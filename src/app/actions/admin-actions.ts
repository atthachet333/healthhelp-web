"use server";

import { existsSync } from "fs";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { CaseStatus, ActionType, Priority, Role } from "@prisma/client";
import { compare } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { updateSheetCaseStatus, updateSheetAssignee, appendAttachmentToSheet, getGoogleSheetsClient } from "@/lib/google-sheets";
import { getStatusLabel } from "@/lib/utils";

async function deleteAttachmentRowFromSheet(fileUrl: string) {
    try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        if (!sheets || !spreadsheetId) return;

        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const attachmentSheet = meta.data.sheets?.find((sheet) => {
            const title = sheet.properties?.title?.toLowerCase() ?? "";
            return title.includes("attachment") || title.includes("ไฟล์") || title.includes("เอกสาร");
        });

        if (!attachmentSheet?.properties?.title || attachmentSheet.properties.sheetId === undefined) {
            return;
        }

        const sheetName = attachmentSheet.properties.title;
        const sheetId = attachmentSheet.properties.sheetId;

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetName}'!E:E`,
        });

        const rows = res.data.values ?? [];
        const rowIndex = rows.findIndex((row) => row[0] === fileUrl);
        if (rowIndex === -1) return;

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId,
                                dimension: "ROWS",
                                startIndex: rowIndex,
                                endIndex: rowIndex + 1,
                            },
                        },
                    },
                ],
            },
        });
    } catch (error) {
        console.warn("[Sheet] ลบแถว Attachments ไม่สำเร็จ:", error);
    }
}

// ============ AUTH ============
export async function loginAction(email: string, password: string) {
    try {
        console.log(`[LOGIN ATTEMPT] Email: '${email}'`);
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log(`[LOGIN FAILED] User not found: ${email}`);
            return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
        }
        if (!user.active) {
            console.log(`[LOGIN FAILED] User inactive: ${email}`);
            return { success: false, error: "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" };
        }

        const valid = await compare(password, user.passwordHash);
        if (!valid) {
            console.log(`[LOGIN FAILED] Invalid password for ${email}`);
            return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
        }

        console.log(`[LOGIN SUCCESS] User: ${user.email} (${user.role})`);
        return {
            success: true,
            user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
        };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
    }
}

// ============ DASHBOARD ============
export async function getDashboardMetrics(timeFilter: "DAY" | "MONTH" | "YEAR" = "DAY", refDateIso?: string) {
    try {
        const [total, open, inProgress, waitingInfo, resolved, closed] = await Promise.all([
            prisma.case.count(),
            prisma.case.count({ where: { status: CaseStatus.OPEN } }),
            prisma.case.count({ where: { status: CaseStatus.IN_PROGRESS } }),
            prisma.case.count({ where: { status: CaseStatus.WAITING_INFO } }),
            prisma.case.count({ where: { status: CaseStatus.RESOLVED } }),
            prisma.case.count({ where: { status: CaseStatus.CLOSED } }),
        ]);

        const breachedSLA = await prisma.case.count({
            where: {
                status: { notIn: [CaseStatus.RESOLVED, CaseStatus.CLOSED] },
                slaDueAt: { lt: new Date() },
            },
        });

        // Avg resolution time (cases that have resolvedAt)
        const resolvedCases = await prisma.case.findMany({
            where: { resolvedAt: { not: null } },
            select: { createdAt: true, resolvedAt: true },
        });

        let avgResolutionHours = 0;
        if (resolvedCases.length > 0) {
            const totalHours = resolvedCases.reduce((sum, c) => {
                const diff = (c.resolvedAt!.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
                return sum + diff;
            }, 0);
            avgResolutionHours = Math.round(totalHours / resolvedCases.length);
        }

        // Cases by category
        const casesByCategory = await prisma.case.groupBy({
            by: ["categoryId"],
            _count: true,
        });
        const categories = await prisma.category.findMany();
        const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
        const casesByCategoryNamed = casesByCategory.map((c) => ({
            name: categoryMap[c.categoryId] || "อื่นๆ",
            value: c._count,
        }));

        // Cases over time based on strict boundaries
        const dailyCounts: Record<string, { date: string; created: number; resolved: number }> = {};
        const refDate = refDateIso ? new Date(refDateIso) : new Date();
        let startDate = new Date();
        let endDate = new Date();

        if (timeFilter === "DAY") {
            // Find Monday of the week containing refDate
            const day = refDate.getDay();
            const diff = refDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            const monday = new Date(refDate);
            monday.setDate(diff);
            monday.setHours(0, 0, 0, 0);

            startDate = new Date(monday);
            endDate = new Date(monday);
            endDate.setDate(monday.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);

            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                dailyCounts[key] = { date: key, created: 0, resolved: 0 };
            }
        } else if (timeFilter === "MONTH") {
            startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
            endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);

            const daysInMonth = endDate.getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const key = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                dailyCounts[key] = { date: key, created: 0, resolved: 0 };
            }
        } else if (timeFilter === "YEAR") {
            // Requested range: 2569 - 2574 (which is 2026 - 2031 in Gregorian)
            const startYear = 2026;
            const endYear = 2031;

            startDate = new Date(startYear, 0, 1);
            endDate = new Date(endYear, 11, 31, 23, 59, 59, 999);

            for (let y = startYear; y <= endYear; y++) {
                const key = `${y}`; // YYYY
                dailyCounts[key] = { date: key, created: 0, resolved: 0 };
            }
        }

        const recentCases = await prisma.case.findMany({
            where: { createdAt: { gte: startDate, lte: endDate } },
            select: { createdAt: true, status: true },
        });

        // Populate counts
        recentCases.forEach((c) => {
            const dt = c.createdAt;
            if (timeFilter === "YEAR") {
                const key = `${dt.getFullYear()}`;
                if (dailyCounts[key]) dailyCounts[key].created++;
            } else {
                const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
                if (dailyCounts[key]) dailyCounts[key].created++;
            }
        });

        // Staff performance
        const staffPerformance = await prisma.case.groupBy({
            by: ["assigneeId"],
            where: { assigneeId: { not: null } },
            _count: true,
        });
        const users = await prisma.user.findMany({ where: { role: { in: [Role.ADMIN, Role.STAFF, Role.SUPERVISOR] } } });
        const userMap = Object.fromEntries(users.map((u) => [u.id, u.fullName]));
        const staffStats = staffPerformance.map((s) => ({
            name: userMap[s.assigneeId!] || "สมชาย ผู้ดูแลระบบ",
            cases: s._count,
        }));

        // CSAT average
        const csatAgg = await prisma.cSATRating.aggregate({ _avg: { score: true }, _count: true });

        return {
            total,
            open,
            inProgress,
            waitingInfo,
            resolved,
            closed,
            breachedSLA,
            avgResolutionHours,
            casesByCategory: casesByCategoryNamed,
            dailyCounts: Object.values(dailyCounts),
            staffStats,
            csatAvg: csatAgg._avg.score ? Math.round(csatAgg._avg.score * 10) / 10 : 0,
            csatCount: csatAgg._count,
        };
    } catch (error) {
        console.error("Dashboard error:", error);
        return null;
    }
}

// ============ CASE LIST ============
export async function getCases(params: {
    status?: string;
    priority?: string;
    assigneeId?: string;
    search?: string;
    page?: number;
    limit?: number;
}) {
    const { status, priority, assigneeId, search, page = 1, limit = 20 } = params;

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") {
        if (status === "ACTIVE") {
            where.status = { notIn: ["RESOLVED", "CLOSED"] };
        } else if (status === "HIDE_DONE") {
            // Hide only completed/closed cases — keeps IN_PROGRESS, OPEN, WAITING_INFO
            where.status = { notIn: ["RESOLVED", "CLOSED"] };
        } else if (status === "SHOW_DONE") {
            // Show ONLY completed/closed cases
            where.status = { in: ["RESOLVED", "CLOSED"] };
        } else {
            where.status = status;
        }
    }
    if (priority && priority !== "ALL") where.priority = priority;
    if (assigneeId && assigneeId !== "ALL") where.assigneeId = assigneeId;
    if (search) {
        where.OR = [
            { caseNo: { contains: search, mode: "insensitive" } },
            { problemSummary: { contains: search, mode: "insensitive" } },
            { reporter: { fullName: { contains: search, mode: "insensitive" } } },
            { reporter: { phone: { contains: search } } },
        ];
    }

    const [data, total] = await Promise.all([
        prisma.case.findMany({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            where: where as any,
            include: {
                reporter: { select: { fullName: true, phone: true } },
                category: { select: { name: true } },
                assignee: { select: { fullName: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prisma.case.count({ where: where as any }),
    ]);

    // ✨ จุดที่แก้ไข: เพิ่มตัวแปร cases: data เข้าไปเพื่อให้หน้าเพจหาเจอ
    return { cases: data, data, total, page, totalPages: Math.ceil(total / limit) };
}

// ============ CASE DETAIL ============
export async function getCaseById(id: string) {
    return prisma.case.findUnique({
        where: { id },
        include: {
            reporter: true,
            category: true,
            assignee: { select: { id: true, fullName: true } },
            updates: {
                include: {
                    user: { select: { fullName: true, role: true } },
                    attachments: true,
                },
                orderBy: { createdAt: "asc" },
            },
            csatRating: true,
        },
    });
}

// ============ UPDATE CASE ============
export async function addCaseUpdate(
    caseId: string,
    userId: string,
    note: string,
    newStatus?: string,
    isPublic?: boolean,
    attachments?: { fileName: string; fileUrl: string; fileKey?: string; fileType?: string }[]
) {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "VIEWER") {
            return { success: false, error: "ไม่มีสิทธิ์ในการแก้ไขเคส" };
        }

        const caseData = await prisma.case.findUnique({
            where: { id: caseId },
            include: { reporter: true }
        });
        if (!caseData) return { success: false, error: "ไม่พบเคส" };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: any = {};
        let actionType: ActionType = ActionType.COMMENT;
        let oldValue: string | null = null;
        let newValue: string | null = null;

        if (newStatus && newStatus !== caseData.status) {
            actionType = ActionType.STATUS_CHANGE;
            oldValue = caseData.status;
            newValue = newStatus;
            updates.status = newStatus as CaseStatus;

            if (newStatus === CaseStatus.RESOLVED) {
                updates.resolvedAt = new Date();
            }
            if (newStatus === CaseStatus.CLOSED) {
                updates.closedAt = new Date();
            }

            // Sync status with Google Sheets
            updateSheetCaseStatus(caseData.trackingCode, getStatusLabel(newStatus)).catch(e => console.error("Sheet Sync Error:", e));
        }

        // Update case
        await prisma.case.update({ where: { id: caseId }, data: { ...updates, updatedAt: new Date() } });

        // Create timeline entry
        const updateRecord = await prisma.caseUpdate.create({
            data: {
                caseId,
                userId,
                actionType,
                oldValue,
                newValue,
                note,
                isPublic: isPublic !== undefined ? isPublic : false,
                attachments: attachments?.length ? {
                    create: attachments.map(att => ({
                        fileName: att.fileName,
                        fileUrl: att.fileUrl,
                        fileKey: att.fileKey,
                        fileType: att.fileType || "application/octet-stream",
                    }))
                } : undefined,
            },
        });

        // Sync attachments to Google Sheets Attachments tab
        if (attachments?.length) {
            for (const att of attachments) {
                const sheetData = [
                    new Date(),
                    caseData.caseNo,
                    caseData.reporter?.phone || "-",
                    att.fileName,
                    att.fileUrl,
                    user.fullName, // ผู้ส่ง = เจ้าหน้าที่ที่อัปโหลดไฟล์/แนบไฟล์
                ];
                appendAttachmentToSheet(sheetData).catch(e => console.error("Sheet Sync Error:", e));
            }
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: newStatus ? "STATUS_CHANGE" : "ADD_COMMENT",
                resource: "CASE",
                resourceId: caseId,
                metadata: { note, oldValue, newValue },
            },
        });

        // Revalidate page cache so router.refresh() shows new data immediately
        revalidatePath(`/admin/cases/${caseId}`);

        return { success: true };
    } catch (error) {
        console.error("Update case error:", error);
        return { success: false, error: "เกิดข้อผิดพลาด" };
    }
}

// ============ ASSIGN CASE ============
export async function assignCase(caseId: string, assigneeId: string, currentUserId: string) {
    try {
        const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
        if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERVISOR")) {
            return { success: false, error: "ไม่มีสิทธิ์ในการมอบหมายเคส" };
        }

        const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
        if (!assignee) return { success: false, error: "ไม่พบเจ้าหน้าที่" };

        const caseData = await prisma.case.findUnique({ where: { id: caseId } });
        if (!caseData) return { success: false, error: "ไม่พบเคส" };

        const oldAssignee = caseData.assigneeId
            ? (await prisma.user.findUnique({ where: { id: caseData.assigneeId } }))?.fullName
            : null;

        await prisma.case.update({ where: { id: caseId }, data: { assigneeId } });

        // Sync assignee to Google Sheets (fire-and-forget, same pattern as status sync)
        updateSheetAssignee(caseData.trackingCode, assignee.fullName)
            .catch(e => console.error("[Sheet Sync] Assignee update failed:", e));

        await prisma.caseUpdate.create({
            data: {
                caseId,
                userId: currentUserId,
                actionType: ActionType.ASSIGN,
                oldValue: oldAssignee || null,
                newValue: assignee.fullName,
                note: `มอบหมายเคสให้ ${assignee.fullName}`,
            },
        });

        await prisma.auditLog.create({
            data: {
                userId: currentUserId,
                action: "ASSIGN_CASE",
                resource: "CASE",
                resourceId: caseId,
                metadata: { assigneeId, assigneeName: assignee.fullName },
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Assign case error:", error);
        return { success: false, error: "เกิดข้อผิดพลาด" };
    }
}

export async function deleteAttachment(attachmentId: string, currentUserId: string) {
    try {
        const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
        if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERVISOR")) {
            return { success: false, error: "ไม่มีสิทธิ์ในการลบ" };
        }

        const attachment = await prisma.attachment.findUnique({
            where: { id: attachmentId },
            include: {
                caseUpdate: {
                    include: {
                        case: {
                            select: { id: true },
                        },
                    },
                },
            },
        });

        if (!attachment) {
            return { success: false, error: "ไม่พบไฟล์" };
        }

        const relativeFilePath = attachment.fileUrl.replace(/^\/+/, "");
        const filePath = path.join(process.cwd(), "public", relativeFilePath);

        if (existsSync(filePath)) {
            await unlink(filePath);
        }

        await deleteAttachmentRowFromSheet(attachment.fileUrl);
        await prisma.attachment.delete({ where: { id: attachmentId } });

        await prisma.auditLog.create({
            data: {
                userId: currentUserId,
                action: "DELETE_ATTACHMENT",
                resource: "ATTACHMENT",
                resourceId: attachmentId,
                metadata: { fileName: attachment.fileName, fileUrl: attachment.fileUrl },
            },
        });

        revalidatePath(`/admin/cases/${attachment.caseUpdate.case.id}`);

        return { success: true };
    } catch (error) {
        console.error("Delete attachment error:", error);
        return { success: false, error: "เกิดข้อผิดพลาดในการลบไฟล์" };
    }
}

// ============ GET STAFF USERS ============
export async function getStaffUsers() {
    return prisma.user.findMany({
        where: { active: true, role: { in: [Role.ADMIN, Role.SUPERVISOR, Role.STAFF] } },
        select: { id: true, fullName: true, role: true },
        orderBy: { fullName: "asc" },
    });
}

// ============ SETTINGS: CATEGORIES ============
export async function getAllCategories() {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function createCategory(name: string, defaultPriority: string, currentUserId: string) {
    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERVISOR")) {
        throw new Error("ไม่มีสิทธิ์ในการเข้าถึง");
    }

    return prisma.category.create({
        data: { name, defaultPriority: defaultPriority as Priority },
    });
}

export async function updateCategory(id: string, name: string, defaultPriority: string, active: boolean, currentUserId: string) {
    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERVISOR")) {
        throw new Error("ไม่มีสิทธิ์ในการเข้าถึง");
    }

    return prisma.category.update({
        where: { id },
        data: { name, defaultPriority: defaultPriority as Priority, active },
    });
}

// ============ SETTINGS: SLA ============
export async function getSLARules() {
    return prisma.sLARule.findMany({
        include: { category: true },
        orderBy: { priority: "asc" },
    });
}

export async function updateSLARule(id: string, resolveWithinHours: number, notifyBeforeHours: number, currentUserId: string) {
    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERVISOR")) {
        throw new Error("ไม่มีสิทธิ์ในการเข้าถึง");
    }

    return prisma.sLARule.update({
        where: { id },
        data: { resolveWithinHours, notifyBeforeHours },
    });
}

// ============ USERS MANAGEMENT ============
export async function getAllUsers() {
    return prisma.user.findMany({
        select: { id: true, email: true, fullName: true, role: true, active: true, createdAt: true },
        orderBy: { createdAt: "desc" },
    });
}