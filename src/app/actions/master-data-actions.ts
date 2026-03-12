"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function uploadHospitalCSV(csvText: string, currentUserId: string) {
    try {
        const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
        if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERVISOR")) {
            return { success: false, error: "ไม่มีสิทธิ์ในการเข้าถึง" };
        }

        // Basic CSV Parsing (assuming header: code,name,province,district)
        const rows = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
        if (rows.length < 2) return { success: false, error: "ไฟล์ต้องมีอย่างน้อย 1 แถวข้อมูล (รวม Header)" };

        const headers = rows[0].split(",").map(h => h.trim().toLowerCase());

        // Find indexes dynamically to allow flexible CSVs
        const getIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

        const codeIdx = getIdx(["code", "รหัส"]);
        const nameIdx = getIdx(["name", "ชื่อหน่วยงาน", "ชื่อโรงพยาบาล"]);
        const orgTypeIdx = getIdx(["org_type", "ประเภทองค์กร"]);
        const unitTypeIdx = getIdx(["unit_type", "ประเภทหน่วยงาน"]);
        const affiliationIdx = getIdx(["affiliation", "สังกัด"]);
        const departmentIdx = getIdx(["department", "กรม/ฝ่าย/สำนัก"]);
        const levelIdx = getIdx(["level", "ระดับบริการ"]);
        const actualBedsIdx = getIdx(["actual_beds", "จำนวนเตียง"]);
        const zoneIdx = getIdx(["zone", "เขตพื้นที่"]);
        const healthRegionIdIdx = getIdx(["health_region_id", "เขตสุขภาพที่"]);
        const addressIdx = getIdx(["address", "ที่ตั้ง"]);
        const mooIdx = getIdx(["moo", "หมู่ที่"]);
        const subdistrictIdx = getIdx(["subdistrict", "ตำบล"]);
        const districtIdx = getIdx(["district", "อำเภอ"]);
        const provinceIdx = getIdx(["province", "จังหวัด"]);
        const zipcodeIdx = getIdx(["zipcode", "รหัสไปรษณีย์"]);
        const foundedDateIdx = getIdx(["founded_date", "วันที่เปิดใช้งาน", "วันก่อตั้ง"]);
        const closedDateIdx = getIdx(["closed_date", "วันที่ปิด", "ยกเลิก"]);
        const lastUpdateIdx = getIdx(["last_update", "วันที่ปรับปรุงข้อมูล"]);

        if (codeIdx === -1 || nameIdx === -1) {
            return { success: false, error: "ไฟล์ CSV ต้องมีคอลัมน์ 'รหัส' และ 'ชื่อหน่วยงาน' เป็นอย่างน้อย" };
        }

        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < rows.length; i++) {
            const cols = parseCSVLine(rows[i]);
            if (cols.length <= Math.max(codeIdx, nameIdx)) continue;

            const code = cols[codeIdx]?.trim();
            const name = cols[nameIdx]?.trim();

            if (!code || !name) {
                errorCount++;
                continue;
            }

            const getVal = (idx: number) => idx !== -1 ? cols[idx]?.trim() || null : null;
            const parseIntVal = (idx: number) => {
                const val = getVal(idx);
                if (!val) return null;
                const parsed = parseInt(val.replace(/,/g, ''), 10);
                return isNaN(parsed) ? null : parsed;
            };

            const data = {
                name,
                orgType: getVal(orgTypeIdx),
                unitType: getVal(unitTypeIdx),
                affiliation: getVal(affiliationIdx),
                department: getVal(departmentIdx),
                level: getVal(levelIdx),
                actualBeds: parseIntVal(actualBedsIdx),
                zone: getVal(zoneIdx),
                healthRegionId: getVal(healthRegionIdIdx),
                address: getVal(addressIdx),
                moo: getVal(mooIdx),
                subdistrict: getVal(subdistrictIdx),
                district: getVal(districtIdx),
                province: getVal(provinceIdx),
                zipcode: getVal(zipcodeIdx),
                foundedDate: getVal(foundedDateIdx),
                closedDate: getVal(closedDateIdx),
                lastUpdate: getVal(lastUpdateIdx),
            };

            try {
                await prisma.hospital.upsert({
                    where: { code },
                    update: data,
                    create: { code, ...data }
                });
                successCount++;
            } catch (e) {
                console.error("Error upserting hospital:", code, e);
                errorCount++;
            }
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: currentUserId,
                action: "UPLOAD_MASTER_DATA",
                resource: "HOSPITAL",
                resourceId: "bulk",
                metadata: { successCount, errorCount }
            }
        });

        return { success: true, successCount, errorCount };
    } catch (error) {
        console.error("Upload error:", error);
        return { success: false, error: "เกิดข้อผิดพลาดในการนำเข้าข้อมูล" };
    }
}

export async function getHospitals(page = 1, limit = 50, search = "") {
    const where: Prisma.HospitalWhereInput = {};
    if (search) {
        where.OR = [
            { code: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
            { province: { contains: search, mode: "insensitive" } },
        ];
    }

    const [data, total] = await Promise.all([
        prisma.hospital.findMany({
            where,
            orderBy: [{ province: "asc" }, { code: "asc" }],
            skip: (page - 1) * limit,
            take: limit
        }),
        prisma.hospital.count({ where })
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
}

// Simple custom CSV line parser to handle quotes
function parseCSVLine(text: string): string[] {
    const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    return text.split(re).map(str => str.replace(/^"|"$/g, "").trim());
}
