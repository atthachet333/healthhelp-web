/**
 * sync_to_sheet.ts
 * Re-syncs all existing cases from DB to Google Sheet.
 * Column layout (matches SHEET_COLUMNS in lib/google-sheets.ts):
 *   A:วันที่/เวลา  B:เลขที่เคส  C:Tracking  D:ชื่อผู้แจ้ง  E:เบอร์โทร
 *   F:อีเมล       G:สถานที่/ที่อยู่  H:Line ID  I:หมวดหมู่  J:ระดับ
 *   K:สถานะ       L:หัวข้อปัญหา  M:รายละเอียด  N:ผู้รับผิดชอบ
 *   O:ชื่อโรงพยาบาล  P:รหัส 9 หลัก
 * Run with: npx tsx sync_to_sheet.ts
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

const SHEET_HEADERS = [
    "วันที่/เวลา",       // A
    "เลขที่เคส",         // B
    "Tracking Code",     // C
    "ชื่อผู้แจ้ง",        // D
    "เบอร์โทร",          // E
    "อีเมล",             // F
    "สถานที่/ที่อยู่",     // G
    "Line ID",           // H
    "หมวดหมู่",           // I
    "ระดับ",              // J
    "สถานะ",             // K
    "หัวข้อปัญหา",        // L
    "รายละเอียด",         // M
    "ผู้รับผิดชอบ",        // N
    "ชื่อโรงพยาบาล",      // O
    "รหัส 9 หลัก",       // P
];

function formatDate(date: Date | null | undefined): string {
    if (!date) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    const d = new Date(date);
    // Convert to Bangkok time (UTC+7)
    const bkk = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    return `${pad(bkk.getUTCDate())}/${pad(bkk.getUTCMonth() + 1)}/${bkk.getUTCFullYear()} ${pad(bkk.getUTCHours())}:${pad(bkk.getUTCMinutes())}:${pad(bkk.getUTCSeconds())}`;
}

const priorityLabels: Record<string, string> = {
    LOW: "ต่ำ",
    MEDIUM: "ปานกลาง",
    HIGH: "สูง",
    CRITICAL: "วิกฤต",
};

const statusLabels: Record<string, string> = {
    OPEN: "เปิด",
    IN_PROGRESS: "กำลังดำเนินการ",
    WAITING_INFO: "รอข้อมูลเพิ่มเติม",
    RESOLVED: "แก้ไขแล้ว",
    CLOSED: "ปิดเคส",
};

async function main() {
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
        console.error("GOOGLE_SHEETS_SPREADSHEET_ID is missing in .env");
        return;
    }

    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const allSheets = meta.data.sheets ?? [];
    const mainSheet =
        allSheets.find(s => s.properties?.title === "เคสที่แจ้งมาแล้ว") ??
        allSheets[0];
    const mainSheetName = mainSheet?.properties?.title;
    if (!mainSheetName) {
        console.error("Cannot read main sheet name.");
        return;
    }
    console.log(`✅ Writing to sheet: "${mainSheetName}"`);

    // --- Write header row (always overwrite row 1 to keep it correct) ---
    console.log("Writing header row (A1:P1)...");
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${mainSheetName}'!A1:P1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [SHEET_HEADERS] },
    });

    // --- Clear data rows only (keep header row 1) ---
    console.log("Clearing old data rows (keeping header)...");
    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `'${mainSheetName}'!A2:Z10000`,
    });

    // --- Fetch all cases including related data ---
    console.log("Loading cases from database...");
    const cases = await prisma.$queryRaw<any[]>`
        SELECT 
            c.created_at, c.case_no, c.tracking_code, c.problem_summary, c.description,
            c.priority, c.status,
            r.full_name, r.phone, r.email, r.line_id, r.address,
            cat.name AS category_name,
            u.full_name AS assignee_name,
            h.name AS hospital_name,
            h.code AS hospital_code
        FROM cases c
        JOIN reporters r ON c.reporter_id = r.id
        JOIN categories cat ON c.category_id = cat.id
        LEFT JOIN users u ON c.assignee_id = u.id
        LEFT JOIN hospitals h ON c.hospital_id = h.id
        ORDER BY c.created_at ASC
    `;

    console.log(`Found ${cases.length} case(s). Writing to sheet...`);

    if (cases.length === 0) {
        console.log("No cases found. Nothing to sync.");
        await prisma.$disconnect();
        return;
    }

    // Build rows matching SHEET_HEADERS order exactly (A-P = 16 columns)
    const rows = cases.map((c: any) => [
        `'${formatDate(new Date(c.created_at))}`,     // A: วันที่/เวลา (เก็บเป็นข้อความ ไม่ให้แสดงเป็นตัวเลข 46094.x)
        c.case_no,                                    // B: เลขที่เคส
        c.tracking_code,                              // C: Tracking Code
        c.full_name,                                  // D: ชื่อผู้แจ้ง
        c.phone,                                      // E: เบอร์โทร
        c.email || "-",                               // F: อีเมล
        c.address || "-",                             // G: สถานที่/ที่อยู่
        c.line_id || "-",                             // H: Line ID
        c.category_name,                              // I: หมวดหมู่
        priorityLabels[c.priority] || c.priority,    // J: ระดับ
        statusLabels[c.status] || c.status,          // K: สถานะ
        c.problem_summary,                            // L: หัวข้อปัญหา
        c.description || "",                          // M: รายละเอียด
        c.assignee_name || "ยังไม่มอบหมาย",           // N: ผู้รับผิดชอบ
        c.hospital_name || "",                        // O: ชื่อโรงพยาบาล
        c.hospital_code || "",                        // P: รหัส 9 หลัก
    ]);

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${mainSheetName}'!A2`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: rows },
    });

    console.log(`✅ Successfully synced ${rows.length} case(s) to Google Sheets!`);
    console.log(`   Columns: A-P (16 columns per row)`);
    await prisma.$disconnect();
}

main().catch(async e => {
    console.error(e);
    await prisma.$disconnect();
});
