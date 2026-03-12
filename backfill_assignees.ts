/**
 * backfill_assignees.ts
 * อัปเดตชื่อ "ผู้รับผิดชอบ" (column M) ใน Google Sheet
 * สำหรับเคสที่มี assignee อยู่แล้วในฐานข้อมูล
 *
 * รันด้วย: npx tsx backfill_assignees.ts
 */
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
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

// Column indexes (0-based) — must match SHEET_COLUMNS in google-sheets.ts
const COL_TRACKING = 2;  // C
const COL_ASSIGNEE = 12; // M

function colLetter(idx: number): string {
    let letter = "";
    let n = idx;
    do {
        letter = String.fromCharCode(65 + (n % 26)) + letter;
        n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return letter;
}

async function main() {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!spreadsheetId) {
        console.error("❌ Missing GOOGLE_SHEETS_SPREADSHEET_ID in .env");
        process.exit(1);
    }

    const sheets = google.sheets({ version: "v4", auth });

    // --- 1. Get sheet name ---
    const meta = await sheets.spreadsheets.get({ spreadsheetId, includeGridData: false });
    const sheetName = meta.data.sheets?.[0]?.properties?.title;
    if (!sheetName) { console.error("❌ Cannot read sheet name"); process.exit(1); }
    console.log(`📄 Sheet: "${sheetName}"`);

    // --- 2. Fetch tracking column from sheet ---
    const trackingLetter = colLetter(COL_TRACKING); // "C"
    const sheetRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!${trackingLetter}:${trackingLetter}`,
    });
    const sheetRows = sheetRes.data.values || [];
    // Build map: trackingCode → sheetRowNumber (1-based)
    const trackingToRow: Record<string, number> = {};
    sheetRows.forEach((row, idx) => {
        if (idx === 0) return; // skip header
        const code = row[0]?.toString().trim();
        if (code) trackingToRow[code] = idx + 1; // 1-based
    });
    console.log(`   Found ${Object.keys(trackingToRow).length} data rows in sheet`);

    // --- 3. Fetch all assigned cases from DB ---
    const cases = await prisma.case.findMany({
        where: { assigneeId: { not: null } },
        select: {
            trackingCode: true,
            assignee: { select: { fullName: true } },
        },
    });
    console.log(`🗄  Found ${cases.length} assigned cases in DB`);

    if (cases.length === 0) {
        console.log("ℹ️  Nothing to backfill.");
        return;
    }

    // --- 4. Build batch update requests ---
    const assigneeColLetter = colLetter(COL_ASSIGNEE); // "M"
    const data: { range: string; values: string[][] }[] = [];
    let matched = 0;
    let skipped = 0;

    for (const c of cases) {
        const assigneeName = c.assignee?.fullName;
        if (!assigneeName) continue;
        const row = trackingToRow[c.trackingCode];
        if (!row) {
            console.log(`  ⚠️  Tracking "${c.trackingCode}" not in sheet — skipped`);
            skipped++;
            continue;
        }
        data.push({
            range: `'${sheetName}'!${assigneeColLetter}${row}:${assigneeColLetter}${row}`,
            values: [[assigneeName]],
        });
        matched++;
    }

    console.log(`   Matched: ${matched}  |  Skipped (not in sheet): ${skipped}`);

    if (data.length === 0) {
        console.log("ℹ️  No rows to update.");
        return;
    }

    // --- 5. Batch update (single API call) ---
    await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
            valueInputOption: "USER_ENTERED",
            data,
        },
    });

    console.log(`\n✅ Backfill complete — updated ${matched} row(s) in column M.`);
}

main()
    .catch(e => console.error("❌ Error:", e))
    .finally(() => prisma.$disconnect());
