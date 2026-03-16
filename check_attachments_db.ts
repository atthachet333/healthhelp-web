/**
 * ตรวจสอบข้อมูลไฟล์แนบทั้งหมดในฐานข้อมูล
 * รันด้วย: npx tsx check_attachments_db.ts
 */
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const rows = await prisma.$queryRaw<any[]>`
        SELECT 
            cu.created_at                      AS created_at,
            c.case_no                          AS case_no,
            r.full_name                        AS reporter_name,
            r.phone                            AS phone,
            a.file_name                        AS file_name,
            u.full_name                        AS admin_name,
            COALESCE(u.full_name, r.full_name) AS sender_name
        FROM attachments a
        JOIN case_updates cu ON a.case_update_id = cu.id
        JOIN cases c ON cu.case_id = c.id
        JOIN reporters r ON c.reporter_id = r.id
        LEFT JOIN users u ON cu.user_id = u.id
        ORDER BY cu.created_at ASC
    `;

    console.log(`พบ ${rows.length} รายการ:\n`);
    rows.forEach((r, i) => {
        console.log(`[${i + 1}] ${r.case_no} | ไฟล์: ${r.file_name}`);
        console.log(`     ผู้แจ้ง: ${r.reporter_name} | แอดมิน: ${r.admin_name ?? "(ไม่มี/ผู้ใช้งาน)"} | ผู้ส่ง: ${r.sender_name}`);
        console.log();
    });

    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
});
