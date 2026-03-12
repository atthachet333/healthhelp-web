"use server";

import { prisma } from "@/lib/prisma";
import { createCaseSchema, type CreateCaseInput, csatSchema, type CSATInput } from "@/lib/validations";
import { generateTrackingCode, getPriorityLabel, getStatusLabel, formatDateForCaseNo } from "@/lib/utils";
import { sendLineNotify } from "@/lib/line-notify";
import { appendToSheet, updateSheetCaseStatus, SHEET_COLUMNS } from "@/lib/google-sheets";
import { CaseStatus, ActionType, Channel } from "@prisma/client";

export async function createCase(input: CreateCaseInput) {
    // Validate input
    const parsed = createCaseSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors };
    }

    const data = parsed.data;

    // Validate at least one contact channel
    if (!data.email && !data.lineId) {
        return { success: false, error: { lineId: ["กรุณาระบุอย่างน้อย Line ID หรือ Email"] } };
    }

    try {
        // Find or create reporter (auto-link by phone)
        let reporter = await prisma.reporter.findUnique({ where: { phone: data.phone } });

        if (reporter) {
            // Update any missing info
            await prisma.reporter.update({
                where: { id: reporter.id },
                data: {
                    fullName: data.fullName,
                    email: data.email || reporter.email,
                    lineId: data.lineId || reporter.lineId,
                    address: data.address || reporter.address,
                },
            });
        } else {
            reporter = await prisma.reporter.create({
                data: {
                    phone: data.phone,
                    email: data.email || null,
                    lineId: data.lineId || null,
                    fullName: data.fullName,
                    address: data.address || null,
                },
            });
        }

        // Get category for default priority
        const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
        const priority = category?.defaultPriority || "MEDIUM";

        // Get hospital name and code for Google Sheets
        const hospital = data.hospitalId
            ? await prisma.hospital.findUnique({ where: { id: data.hospitalId }, select: { name: true, code: true } })
            : null;

        // Calculate SLA due
        const slaRule = await prisma.sLARule.findFirst({ where: { priority } });
        const slaDueAt = slaRule
            ? new Date(Date.now() + slaRule.resolveWithinHours * 60 * 60 * 1000)
            : null;

        // Generate unique identifiers
        const dateStr = formatDateForCaseNo(); // DD-MM-YY
        const dbDateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD for DailySequence key

        // Use Prisma transaction to ensure atomic increment of the daily sequence
        const sequence = await prisma.$transaction(async (tx: any) => {
            const seq = await tx.dailySequence.upsert({
                where: { date: dbDateStr },
                update: { lastCount: { increment: 1 } },
                create: { date: dbDateStr, lastCount: 1 },
            });
            return seq.lastCount;
        });

        // Format: HH-DD-MM-YY-0-00001
        // We ensure sequence is padded with 5 zeros (e.g., 00001, 00002)
        const seqNumStr = String(sequence).padStart(5, '0');
        const caseNo = `HH-${dateStr}-0-${seqNumStr}`;

        let trackingCode = generateTrackingCode();
        while (await prisma.case.findUnique({ where: { trackingCode } })) {
            trackingCode = generateTrackingCode();
        }

        // Create the case
        const newCase = await prisma.case.create({
            data: {
                caseNo,
                reporterId: reporter.id,
                categoryId: data.categoryId,
                hospitalId: data.hospitalId || null,
                channel: Channel.WEB,
                problemSummary: data.problemSummary,
                description: data.description || "",
                priority,
                status: CaseStatus.OPEN,
                trackingCode,
                slaDueAt,
            },
        });

        // Create initial timeline entry
        await prisma.caseUpdate.create({
            data: {
                caseId: newCase.id,
                actionType: ActionType.SYSTEM,
                note: "เคสถูกสร้างจากเว็บไซต์",
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: "CREATE_CASE",
                resource: "CASE",
                resourceId: newCase.id,
                metadata: { caseNo, reporterPhone: data.phone },
            },
        });

        // Send LINE Notify
        const lineMsg = `🚨มีเคสใหม่เข้าสู่ระบบ!🚨\nเลขที่: ${caseNo}\nหัวข้อ: ${data.problemSummary}\nความเร่งด่วน: ${priority}\nผู้แจ้ง: ${data.fullName}\nตรวจสอบได้ที่ระบบ HealthHelp`;
        await sendLineNotify(lineMsg);

        // Build the row matching SHEET_COLUMNS order exactly:
        // [DATE, CASE_NO, TRACKING, NAME, PHONE, EMAIL, LINE_ID, CATEGORY, PRIORITY, STATUS, SUBJECT, DETAIL, ASSIGNEE, HOSPITAL, HOSP_CODE]
        const sheetData = [
            newCase.createdAt,                 // [0] DATE      → A
            caseNo,                            // [1] CASE_NO   → B
            trackingCode,                      // [2] TRACKING  → C  ← used by updateSheetCaseStatus
            data.fullName,                     // [3] NAME      → D
            data.phone,                        // [4] PHONE     → E
            data.email || "-",                 // [5] EMAIL     → F
            data.lineId || "-",                // [6] LINE_ID   → G
            category?.name || "ไม่ระบุ",        // [7] CATEGORY  → H ← conditional formatting
            getPriorityLabel(priority),        // [8] PRIORITY  → I
            getStatusLabel("OPEN"),            // [9] STATUS    → J ← updated by updateSheetCaseStatus
            data.problemSummary,               // [10] SUBJECT  → K
            data.description || "",            // [11] DETAIL   → L
            "",                                // [12] ASSIGNEE → M (empty at creation)
            hospital?.name || "",              // [13] HOSPITAL → N
            hospital?.code || "",              // [14] HOSP_CODE → O ← รหัส 9 หลัก
        ];
        // Sanity check: array length must equal number of SHEET_COLUMNS entries
        console.assert(sheetData.length === Object.keys(SHEET_COLUMNS).length,
            `[Sheet] sheetData has ${sheetData.length} cols but SHEET_COLUMNS defines ${Object.keys(SHEET_COLUMNS).length}`);

        // Use setImmediate or just don't await so the user gets the success response instantly
        appendToSheet(sheetData).catch(e => console.error("Sheet Sync Error:", e));

        return { success: true, trackingCode, caseNo };
    } catch (error) {
        console.error("Error creating case:", error);
        return { success: false, error: { _form: ["เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"] } };
    }
}

export async function getCaseByTracking(trackingCode: string) {
    try {
        const caseData = await prisma.case.findUnique({
            where: { trackingCode },
            include: {
                reporter: true,
                category: true,
                assignee: { select: { fullName: true } },
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

        if (!caseData) return null;
        // Fix for Next.js Server Actions serialization errors on Prisma deeply nested objects
        return JSON.parse(JSON.stringify(caseData));
    } catch (error) {
        console.error("Error fetching case:", error);
        return null;
    }
}

export async function getCasesByPhone(phone: string) {
    try {
        const reporter = await prisma.reporter.findUnique({ where: { phone } });
        if (!reporter) return [];

        const cases = await prisma.case.findMany({
            where: { reporterId: reporter.id },
            include: { category: true },
            orderBy: { createdAt: "desc" },
        });

        // Fix for Next.js Server Actions serialization errors on Prisma deeply nested objects
        return JSON.parse(JSON.stringify(cases));
    } catch (error) {
        console.error("Error fetching cases by phone:", error);
        return [];
    }
}

export async function submitCSAT(trackingCode: string, input: CSATInput) {
    const parsed = csatSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: "ข้อมูลไม่ถูกต้อง" };
    }

    try {
        const caseData = await prisma.case.findUnique({ where: { trackingCode } });
        if (!caseData) return { success: false, error: "ไม่พบเคส" };

        if (caseData.status !== CaseStatus.RESOLVED && caseData.status !== CaseStatus.CLOSED) {
            return { success: false, error: "ไม่สามารถให้คะแนนได้ เคสยังไม่ถูกแก้ไข" };
        }

        const existing = await prisma.cSATRating.findUnique({ where: { caseId: caseData.id } });
        if (existing) {
            return { success: false, error: "คุณได้ให้คะแนนเคสนี้แล้ว" };
        }

        await prisma.cSATRating.create({
            data: {
                caseId: caseData.id,
                score: parsed.data.score,
                comment: parsed.data.comment || null,
            },
        });

        // Update Case status to CLOSED
        await prisma.case.update({
            where: { id: caseData.id },
            data: {
                status: CaseStatus.CLOSED,
                closedAt: new Date()
            }
        });

        // Sync Status to Google Sheets
        updateSheetCaseStatus(trackingCode, getStatusLabel("CLOSED")).catch(e => console.error("Sheet Sync Error:", e));

        // Record CaseUpdate for user confirmation
        await prisma.caseUpdate.create({
            data: {
                caseId: caseData.id,
                actionType: ActionType.STATUS_CHANGE,
                oldValue: caseData.status,
                newValue: CaseStatus.CLOSED,
                note: "ผู้ใช้งานยืนยันการแก้ไขและให้คะแนนความพึงพอใจ",
            }
        });

        // Send LINE Notify
        const lineMsg = `✅เคส ${caseData.caseNo} ถูกปิดโดยผู้ใช้งานแล้ว\n(CSAT Score: ${parsed.data.score}/5)`;
        await sendLineNotify(lineMsg);

        return { success: true };
    } catch (error) {
        console.error("Error submitting CSAT:", error);
        return { success: false, error: "เกิดข้อผิดพลาด" };
    }
}

export async function getCategories() {
    return prisma.category.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
    });
}

export async function addPublicCaseUpdate(trackingCode: string, note: string) {
    try {
        const caseData = await prisma.case.findUnique({ where: { trackingCode } });
        if (!caseData) return { success: false, error: "ไม่พบเคส" };

        await prisma.caseUpdate.create({
            data: {
                caseId: caseData.id,
                actionType: ActionType.COMMENT,
                note: note,
            }
        });

        // Notify admins if user replies
        const lineMsg = `💬 ผู้แจ้งตอบกลับเคส!\nเลขที่: ${caseData.caseNo}\nข้อความ: ${note}\nตรวจสอบได้ที่ระบบ HealthHelp`;
        await sendLineNotify(lineMsg);

        return { success: true };
    } catch (error) {
        console.error("Error adding public update:", error);
        return { success: false, error: "เกิดข้อผิดพลาด" };
    }
}
