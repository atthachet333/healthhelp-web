"use server";

import { prisma } from "@/lib/prisma";
import { CaseStatus, ActionType, Priority, Role } from "@prisma/client";
import { compare } from "bcryptjs";

// ============ AUTH ============
export async function loginAction(email: string, password: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.active) {
            return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
        }
        const valid = await compare(password, user.passwordHash);
        if (!valid) {
            return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
        }
        // Return user data (exclude password)
        return {
            success: true,
            user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
        };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: "เกิดข้อผิดพลาด" };
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
            startDate = new Date(refDate.getFullYear() - 4, 0, 1);
            endDate = new Date(refDate.getFullYear(), 11, 31, 23, 59, 59, 999);

            for (let i = 4; i >= 0; i--) {
                const y = refDate.getFullYear() - i;
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
        const users = await prisma.user.findMany({ where: { role: { in: [Role.STAFF, Role.SUPERVISOR] } } });
        const userMap = Object.fromEntries(users.map((u) => [u.id, u.fullName]));
        const staffStats = staffPerformance.map((s) => ({
            name: userMap[s.assigneeId!] || "ไม่ระบุ",
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
    if (status && status !== "ALL") where.status = status;
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
        prisma.case.count({ where: where as any }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
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
export async function addCaseUpdate(caseId: string, userId: string, note: string, newStatus?: string) {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role === "VIEWER") {
            return { success: false, error: "ไม่มีสิทธิ์ในการแก้ไขเคส" };
        }

        const caseData = await prisma.case.findUnique({ where: { id: caseId } });
        if (!caseData) return { success: false, error: "ไม่พบเคส" };

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
        }

        // Update case
        await prisma.case.update({ where: { id: caseId }, data: { ...updates, updatedAt: new Date() } });

        // Create timeline entry
        await prisma.caseUpdate.create({
            data: { caseId, userId, actionType, oldValue, newValue, note },
        });

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
