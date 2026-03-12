/**
 * sync_to_sheet.ts
 * Re-syncs all existing cases from DB to Google Sheet.
 * Column layout: A:วันที่ B:เลขที่เคส C:Tracking D:ชื่อ E:เบอร์ F:อีเมล G:LineID
 *               H:หมวดหมู่ I:ระดับ J:สถานะ K:หัวข้อ L:รายละเอียด M:ผู้รับผิดชอบ N:โรงพยาบาล
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

function formatDate(date: Date | null | undefined): string {
    if (!date) return "";
    return date.toLocaleString("en-GB", { timeZone: "Asia/Bangkok" }).replace(",", "");
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
    const firstSheet = meta.data.sheets?.[0]?.properties?.title;
    if (!firstSheet) {
        console.error("Cannot read first sheet name.");
        return;
    }
    console.log(`Writing to sheet: "${firstSheet}"`);

    // Clear data rows only (keep header row 1 as-is)
    console.log("Clearing old data rows (keeping header)...");
    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `'${firstSheet}'!A2:Z10000`,
    });

    // Fetch all cases including related data
    console.log("Loading cases from database...");
    const cases = await prisma.$queryRaw<any[]>`
        SELECT 
            c.created_at, c.case_no, c.tracking_code, c.problem_summary, c.description,
            c.priority, c.status, c.assignee_id,
            r.full_name, r.phone, r.email, r.line_id,
            cat.name AS category_name,
            u.full_name AS assignee_name,
            h.name AS hospital_name
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

    // A:วันที่/เวลา B:เลขที่เคส C:TrackingCode D:ชื่อผู้แจ้ง E:เบอร์โทร
    // F:อีเมล G:LineID H:หมวดหมู่(conditional fmt) I:ระดับ J:สถานะ
    // K:หัวข้อปัญหา L:รายละเอียด M:ผู้รับผิดชอบ N:โรงพยาบาล
    const rows = cases.map((c: any) => [
        formatDate(new Date(c.created_at)),     // A
        c.case_no,                               // B
        c.tracking_code,                         // C
        c.full_name,                             // D
        c.phone,                                 // E
        c.email || "-",                          // F
        c.line_id || "-",                        // G
        c.category_name,                         // H ← conditional formatting =$H3
        priorityLabels[c.priority] || c.priority, // I
        statusLabels[c.status] || c.status,      // J
        c.problem_summary,                       // K
        c.description || "",                     // L
        c.assignee_name || "ยังไม่มอบหมาย",       // M
        c.hospital_name || "",                   // N
    ]);

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${firstSheet}'!A2`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: rows },
    });

    console.log(`✅ Successfully synced ${rows.length} case(s) to Google Sheets!`);
    await prisma.$disconnect();
}

main().catch(async e => {
    console.error(e);
    await prisma.$disconnect();
});
