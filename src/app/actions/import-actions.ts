"use server";

import { prisma } from "@/lib/prisma";
import { Priority, CaseStatus } from "@prisma/client";
import { formatDateForCaseNo, generateTrackingCode } from "@/lib/utils";

export interface ParsedCaseData {
    problemSummary: string;
    description: string;
    reporterName: string;
    reporterPhone: string;
    reporterEmail?: string;
    reporterLineId?: string;
    categoryName: string;
}

export type ImportResult = {
    success: boolean;
    importedCount: number;
    error?: string;
    details?: string[];
};

export async function importCasesAction(
    casesData: ParsedCaseData[],
    adminId: string
): Promise<ImportResult> {
    try {
        if (!casesData || casesData.length === 0) {
            return { success: false, importedCount: 0, error: "ไม่มีข้อมูลให้อิมพอร์ต" };
        }

        const admin = await prisma.user.findUnique({
            where: { id: adminId },
            select: { role: true },
        });

        if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPERVISOR")) {
            return {
                success: false,
                importedCount: 0,
                error: "ไม่มีสิทธิ์ในการแก้ไขข้อมูล",
            };
        }

        // 1. Get all categories mapping
        const categories = await prisma.category.findMany({ select: { id: true, name: true } });
        const categoryMap = new Map();
        categories.forEach(c => categoryMap.set(c.name.trim().toLowerCase(), c.id));

        const defaultCategoryId = categories.length > 0 ? categories[0].id : null;

        if (!defaultCategoryId) {
            return { success: false, importedCount: 0, error: "ไม่พบข้อมูลหมวดหมู่ในระบบ กรุณาเพิ่มหมวดหมู่ก่อนอิมพอร์ต" };
        }

        let importedCount = 0;

        await prisma.$transaction(async (tx: any) => {
            const dateStr = formatDateForCaseNo(); // DD-MM-YY
            const dbDateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD for DailySequence key

            // Bulk update sequences inside transaction to be atomic
            const seq = await tx.dailySequence.upsert({
                where: { date: dbDateStr },
                update: { lastCount: { increment: casesData.length } },
                create: { date: dbDateStr, lastCount: casesData.length },
            });

            if (!seq) throw new Error("Could not update daily sequence");

            let startCaseSeq = seq.lastCount - casesData.length + 1;

            for (const item of casesData) {
                // Find category by matching string
                const catNameLower = (item.categoryName || "").trim().toLowerCase();
                const matchedCatId = categoryMap.has(catNameLower) 
                    ? categoryMap.get(catNameLower) 
                    : defaultCategoryId;

                // Format Case No
                const caseNo = `C-${dateStr}-${startCaseSeq.toString().padStart(5, '0')}`;
                
                // Format Tracking Code
                let trackingCode = generateTrackingCode();
                while (await tx.case.findUnique({ where: { trackingCode } })) {
                    trackingCode = generateTrackingCode();
                }

                await tx.case.create({
                    data: {
                        caseNo,
                        problemSummary: item.problemSummary.substring(0, 191),
                        description: item.description || "อิมพอร์ตจากระบบ",
                        status: CaseStatus.OPEN,
                        priority: Priority.MEDIUM,
                        channel: "SYSTEM", // Imported
                        category: { connect: { id: matchedCatId } },
                        trackingCode,
                        reporter: {
                            connectOrCreate: {
                                where: { phone: item.reporterPhone.substring(0, 20) },
                                create: {
                                    fullName: item.reporterName.substring(0, 100),
                                    phone: item.reporterPhone.substring(0, 20),
                                    email: item.reporterEmail ? item.reporterEmail.substring(0, 100) : null,
                                    lineId: item.reporterLineId ? item.reporterLineId.substring(0, 100) : null,
                                }
                            }
                        },
                        updates: {
                            create: {
                                actionType: "SYSTEM",
                                note: "อิมพอร์ตข้อมูลเข้าสู่ระบบด้วย Excel/CSV"
                            }
                        }
                    }
                });

                startCaseSeq++;
                importedCount++;
            }
        }, {
            timeout: 30000 // 30s timeout for large imports
        });

        return { success: true, importedCount };
    } catch (error: any) {
        console.error("Import cases error:", error);
        return { success: false, importedCount: 0, error: error.message || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล" };
    }
}
