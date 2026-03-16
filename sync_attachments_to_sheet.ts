/**
 * sync_attachments_to_sheet.ts
 * 
 * ดึงข้อมูลไฟล์แนบทั้งหมดจากฐานข้อมูล แล้ว sync ลงชีต Google Sheets
 * ที่ชื่อว่า "Attachments" (หรือชื่อที่มีคำว่า attachment/ไฟล์/เอกสาร)
 * รูปแบบคอลัมน์:
 *   A: วันที่/เวลา
 *   B: Case ID (เลขที่เคส)
 *   C: เบอร์โทร
 *   D: ชื่อไฟล์
 *   E: URL/ลิงก์ไฟล์
 *   F: ผู้ส่ง
 * 
 * รันด้วย:
 *   npx tsx sync_attachments_to_sheet.ts
 */

import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: SCOPES,
});

const ATTACHMENT_HEADERS = [
    "วันที่/เวลา",   // A
    "Case ID",      // B
    "เบอร์โทร",      // C
    "ชื่อไฟล์",       // D
    "URL/ลิงก์ไฟล์", // E
    "ผู้ส่ง",        // F
];

function formatDateBkk(date: Date | null | undefined): string {
    if (!date) return "";
    const parts = new Intl.DateTimeFormat("th-TH", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
    const text = `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}:${get("second")}`;
    // ใส่ ' นำหน้าเพื่อให้ Google Sheets เก็บเป็น "ข้อความ" ไม่แปลงเป็นตัวเลข 46094.x
    return `'${text}`;
}

async function main() {
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
        console.error("GOOGLE_SHEETS_SPREADSHEET_ID is missing in .env");
        return;
    }

    // หาชีตที่ใช้เก็บ Attachments
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const allSheets = meta.data.sheets ?? [];

    let attachmentSheet = allSheets.find((s) => {
        const title = s.properties?.title?.toLowerCase() ?? "";
        return (
            title.includes("attachment") ||
            title.includes("attachments") ||
            title.includes("ไฟล์") ||
            title.includes("เอกสาร")
        );
    });

    // ถ้ายังไม่มีให้สร้างใหม่ชื่อ "Attachments"
    if (!attachmentSheet) {
        const addRes = await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: "Attachments",
                            },
                        },
                    },
                ],
            },
        });
        const newSheet = addRes.data.replies?.[0]?.addSheet?.properties;
        if (!newSheet?.title) {
            console.error("Cannot create Attachments sheet");
            return;
        }
        attachmentSheet = { properties: newSheet };
    }

    const attachmentSheetName = attachmentSheet.properties!.title!;
    const attachmentSheetId = attachmentSheet.properties!.sheetId!;

    console.log(`✅ Writing attachments to sheet: "${attachmentSheetName}"`);

    // สำรองข้อมูลชีตเดิมด้วยการ duplicate เป็น backup ก่อนจะเคลียร์
    try {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        const backupTitle = `${attachmentSheetName}_backup_${y}${m}${d}_${hh}${mm}${ss}`;

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        duplicateSheet: {
                            sourceSheetId: attachmentSheetId,
                            insertSheetIndex: (attachmentSheet.properties!.index ?? 0) + 1,
                            newSheetName: backupTitle,
                        },
                    },
                ],
            },
        });
        console.log(`💾 Backup created: "${backupTitle}"`);
    } catch (backupErr) {
        console.warn("ไม่สามารถสร้าง backup sheet ได้ (ข้ามไป):", backupErr);
    }

    // เขียน header row เสมอให้ถูกต้อง
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${attachmentSheetName}'!A1:F1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [ATTACHMENT_HEADERS] },
    });

    // ลบข้อมูลเดิมยกเว้น header
    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `'${attachmentSheetName}'!A2:Z10000`,
    });

    console.log("🧹 Cleared old attachment rows (A2:Z10000)");

    // ดึงข้อมูลไฟล์แนบทั้งหมดจากฐานข้อมูล
    console.log("📦 Loading attachments from database...");

    const rows = await prisma.$queryRaw<any[]>`
        SELECT 
            cu.created_at                     AS created_at,
            c.case_no                         AS case_no,
            r.phone                           AS phone,
            a.file_name                       AS file_name,
            a.file_url                        AS file_url,
            COALESCE(u.full_name, r.full_name) AS sender_name
        FROM attachments a
        JOIN case_updates cu ON a.case_update_id = cu.id
        JOIN cases c ON cu.case_id = c.id
        JOIN reporters r ON c.reporter_id = r.id
        LEFT JOIN users u ON cu.user_id = u.id
        ORDER BY cu.created_at ASC
    `;

    console.log(`พบไฟล์แนบทั้งหมด ${rows.length} รายการ กำลังเขียนลงชีต...`);

    if (rows.length === 0) {
        await prisma.$disconnect();
        console.log("ไม่มีไฟล์แนบในระบบ ไม่ต้อง sync เพิ่ม");
        return;
    }

    const values = rows.map((r) => [
        formatDateBkk(new Date(r.created_at)), // วันที่/เวลา
        r.case_no,                             // Case ID
        r.phone,                               // เบอร์โทร
        r.file_name,                           // ชื่อไฟล์
        r.file_url,                            // URL/ลิงก์ไฟล์ (relative /uploads/...)
        r.sender_name || "",                   // ผู้ส่ง (user.full_name หรือ reporter.full_name)
    ]);

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${attachmentSheetName}'!A2`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
            values,
        },
    });

    console.log(`✅ Synced ${values.length} attachment row(s) to Google Sheets.`);

    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
});

