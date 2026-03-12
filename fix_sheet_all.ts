/**
 * fix_sheet_all.ts
 * รัน script นี้ครั้งเดียวเพื่อ:
 *  1. ตั้ง Header row (row 1) พร้อมสีน้ำเงินเข้ม + ตัวอักษรขาวหนา (sheet หลัก)
 *  2. ลบ conditional formatting เก่าทิ้งทั้งหมด
 *  3. เพิ่ม conditional formatting ใหม่:
 *     - คอลัมน์ H (หมวดหมู่) → สีตาม category (vivid)
 *     - คอลัมน์ I (ระดับ)     → สีตาม priority (vivid)
 *     - คอลัมน์ J (สถานะ)    → สีตาม status (vivid)
 *  4. แก้ไข sheet Attachments: header สีดำ + ตัวขาว + conditional format เหมือนหน้าหลัก
 *
 * รันด้วย: npx tsx fix_sheet_all.ts
 */
import { google } from "googleapis";
import * as dotenv from "dotenv";
dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: SCOPES,
});

// ===== COLUMN LAYOUT =====
const COL = {
    DATE: 0, CASE_NO: 1, TRACKING: 2, NAME: 3, PHONE: 4,
    EMAIL: 5, LINE_ID: 6, CATEGORY: 7, PRIORITY: 8,
    STATUS: 9, SUBJECT: 10, DETAIL: 11, ASSIGNEE: 12, HOSPITAL: 13, HOSP_CODE: 14,
};
const TOTAL_COLS = 15; // A–O

const SHEET_HEADERS = [
    "วันที่/เวลา", "เลขที่เคส", "Tracking Code",
    "ชื่อผู้แจ้ง", "เบอร์โทร", "อีเมล", "Line ID",
    "หมวดหมู่", "ระดับ", "สถานะ",
    "หัวข้อปัญหา", "รายละเอียด", "ผู้รับผิดชอบ", "ชื่อโรงพยาบาล", "รหัส 9 หลัก",
];

// ===== COLOR HELPERS =====
type RGB = { red: number; green: number; blue: number };
const hex = (h: string): RGB => ({
    red:   parseInt(h.slice(1, 3), 16) / 255,
    green: parseInt(h.slice(3, 5), 16) / 255,
    blue:  parseInt(h.slice(5, 7), 16) / 255,
});
const WHITE: RGB = { red: 1, green: 1, blue: 1 };
const BLACK: RGB = { red: 0, green: 0, blue: 0 };

// ===== VIVID COLOR PALETTE =====

// หมวดหมู่ (column H)
const CATEGORY_RULES: { value: string; bg: RGB; fg: RGB }[] = [
    { value: "ปัญหาทั่วไป",      bg: hex("#B6D7A8"), fg: BLACK },
    { value: "ปัญหาด้านสุขภาพ",  bg: hex("#F9CB9C"), fg: BLACK },
    { value: "สอบถามข้อมูล",     bg: hex("#9FC5E8"), fg: BLACK },
    { value: "ร้องเรียน",        bg: hex("#EA9999"), fg: BLACK },
    { value: "ขอคำปรึกษา",      bg: hex("#D5A6BD"), fg: BLACK },
    { value: "แจ้งเหตุฉุกเฉิน", bg: hex("#CC0000"), fg: WHITE },
];

// ระดับ (column I) — Thai + English fallbacks for rows created before Thai mapping
const PRIORITY_RULES: { value: string; bg: RGB; fg: RGB }[] = [
    { value: "วิกฤต",    bg: hex("#CC0000"), fg: WHITE },
    { value: "CRITICAL", bg: hex("#CC0000"), fg: WHITE },  // fallback: English
    { value: "สูง",      bg: hex("#E06666"), fg: WHITE },
    { value: "HIGH",     bg: hex("#E06666"), fg: WHITE },  // fallback: English
    { value: "ปานกลาง", bg: hex("#FFD966"), fg: BLACK },
    { value: "MEDIUM",   bg: hex("#FFD966"), fg: BLACK },  // fallback: English
    { value: "ต่ำ",      bg: hex("#6AA84F"), fg: WHITE },
    { value: "LOW",      bg: hex("#6AA84F"), fg: WHITE },  // fallback: English
];

// สถานะ (column J) — values MUST match getStatusLabel() in src/lib/utils.ts exactly
const STATUS_RULES: { value: string; bg: RGB; fg: RGB }[] = [
    { value: "เปิด",                bg: hex("#4A86E8"), fg: WHITE },  // OPEN
    { value: "กำลังดำเนินการ",      bg: hex("#FF9900"), fg: WHITE },  // IN_PROGRESS
    { value: "รอข้อมูลเพิ่มเติม",   bg: hex("#9900FF"), fg: WHITE },  // WAITING_INFO
    { value: "แก้ไขแล้ว",           bg: hex("#38761D"), fg: WHITE },  // RESOLVED
    { value: "ปิดเคส",              bg: hex("#999999"), fg: WHITE },  // CLOSED
];


// ===== CONDITIONAL FORMAT BUILDER =====
function colLetter(idx: number): string {
    let letter = "";
    let n = idx;
    do {
        letter = String.fromCharCode(65 + (n % 26)) + letter;
        n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return letter;
}

function makeCondFormatRules(
    sheetId: number,
    colIndex: number,
    rules: { value: string; bg: RGB; fg: RGB }[],
    totalCols: number,
): object[] {
    const letter = colLetter(colIndex);
    // Rules are added in reverse order so the first entry ends up at index 0 (highest priority)
    return [...rules].reverse().map(({ value, bg, fg }) => ({
        addConditionalFormatRule: {
            rule: {
                ranges: [{
                    sheetId,
                    startRowIndex: 1,        // skip header (row 2 onwards)
                    endRowIndex: 10000,
                    startColumnIndex: 0,     // colour entire row (A to O)
                    endColumnIndex: totalCols,
                }],
                booleanRule: {
                    // CUSTOM_FORMULA: e.g. =$H2="เปิด"
                    condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: `=$${letter}2="${value}"` }] },
                    format: { backgroundColor: bg, textFormat: { foregroundColor: fg } },
                },
            },
            index: 0,
        },
    }));
}

// ===== STYLE HEADER ROW =====
async function styleHeader(
    sheets: ReturnType<typeof google.sheets>,
    spreadsheetId: string,
    sheetId: number,
    headers: string[],
    bgColor: RGB,
    fgColor: RGB,
) {
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{
                repeatCell: {
                    range: {
                        sheetId,
                        startRowIndex: 0, endRowIndex: 1,
                        startColumnIndex: 0, endColumnIndex: headers.length,
                    },
                    cell: {
                        userEnteredFormat: {
                            backgroundColor: bgColor,
                            textFormat: { foregroundColor: fgColor, bold: true, fontSize: 11 },
                            horizontalAlignment: "CENTER",
                        },
                    },
                    fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
                },
            }],
        },
    });
}

// ===== DELETE ALL EXISTING CONDITIONAL FORMAT RULES =====
async function clearConditionalFormats(
    sheets: ReturnType<typeof google.sheets>,
    spreadsheetId: string,
    sheetIdNum: number,
    count: number,
) {
    if (count === 0) return;
    const deleteRequests = Array.from({ length: count }, (_, i) => count - 1 - i)
        .map(i => ({ deleteConditionalFormatRule: { sheetId: sheetIdNum, index: i } }));
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: deleteRequests },
    });
    console.log(`  🗑  Deleted ${count} old rule(s).`);
}

// ===== MAIN =====
async function main() {
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!spreadsheetId) {
        console.error("❌ Missing GOOGLE_SHEETS_SPREADSHEET_ID in .env");
        process.exit(1);
    }

    const meta = await sheets.spreadsheets.get({ spreadsheetId, includeGridData: false });
    const allSheets = meta.data.sheets || [];

    // ─── MAIN SHEET (index 0) ───────────────────────────────────────────────
    const mainSheet   = allSheets[0];
    const mainSheetId = mainSheet?.properties?.sheetId;
    const mainName    = mainSheet?.properties?.title;
    if (mainSheetId === undefined || mainSheetId === null || !mainName) {
        console.error("❌ Cannot read main sheet."); process.exit(1);
    }
    console.log(`\n📄 Main sheet: "${mainName}"`);

    // Always force-write headers to ensure they match the current SHEET_HEADERS definition
    // (e.g. fixes stale headers like 'ประเภท' left from a previous version)
    await sheets.spreadsheets.values.update({
        spreadsheetId, range: `'${mainName}'!A1`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [SHEET_HEADERS] },
    });
    console.log("  ✅ Header row force-updated.");

    // Style header: dark navy
    await styleHeader(sheets, spreadsheetId, mainSheetId, SHEET_HEADERS, hex("#1A3055"), WHITE);
    console.log("  ✅ Header styled (dark navy).");

    // Clear old CF rules
    const mainOldCF = (mainSheet?.conditionalFormats || []).length;
    await clearConditionalFormats(sheets, spreadsheetId, mainSheetId, mainOldCF);

    // Add new CF rules (status → priority → category: highest priority last)
    const mainCFRequests = [
        ...makeCondFormatRules(mainSheetId, COL.STATUS,   STATUS_RULES,   TOTAL_COLS),
        ...makeCondFormatRules(mainSheetId, COL.PRIORITY, PRIORITY_RULES, TOTAL_COLS),
        ...makeCondFormatRules(mainSheetId, COL.CATEGORY, CATEGORY_RULES, TOTAL_COLS),
    ];
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: mainCFRequests } });
    console.log(`  ✅ Added ${mainCFRequests.length} conditional format rules.`);

    // ─── ATTACHMENTS SHEET ──────────────────────────────────────────────────
    const attSheet = allSheets.find(s =>
        s.properties?.title?.toLowerCase().includes("attachment") ||
        s.properties?.title?.toLowerCase().includes("ไฟล์") ||
        s.properties?.title?.toLowerCase().includes("เอกสาร")
    );

    if (!attSheet) {
        console.log("\nℹ️  No Attachments sheet found — skipping.");
    } else {
        const attSheetId = attSheet.properties?.sheetId;
        const attName    = attSheet.properties?.title;
        if (attSheetId === undefined || attSheetId === null || !attName) {
            console.log("\n⚠️  Could not read Attachments sheet id.");
        } else {
            console.log(`\n📎 Attachments sheet: "${attName}"`);

            // Style header: solid black bg, white bold text
            await styleHeader(sheets, spreadsheetId, attSheetId, ["วันที่/เวลา","Case ID","เบอร์โทร","ชื่อไฟล์","URL/ลิงก์ไฟล์"], hex("#000000"), WHITE);
            console.log("  ✅ Header styled (black).");

            // Attachments sheet: colour data rows (rows 2+) with a subtle alternating-free white background
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        repeatCell: {
                            range: { sheetId: attSheetId, startRowIndex: 1, endRowIndex: 10000, startColumnIndex: 0, endColumnIndex: 5 },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: hex("#F3F3F3"),
                                    textFormat: { foregroundColor: BLACK, bold: false },
                                },
                            },
                            fields: "userEnteredFormat(backgroundColor,textFormat)",
                        },
                    }],
                },
            });
            console.log("  ✅ Data rows styled (light grey background).");

            // Remove old CF on attachments sheet
            const attOldCF = (attSheet?.conditionalFormats || []).length;
            await clearConditionalFormats(sheets, spreadsheetId, attSheetId, attOldCF);

            // Attachments sheet: colour by Case ID column (col B = index 1) using priority colour
            // Just mirror category rules on col H equivalent — col B for case tracking (informational)
            // Keep it simple: no CF on Attachments beyond the data row BG already set above.
            console.log("  ℹ️  No complex conditional formatting needed on Attachments.");
        }
    }

    console.log("\n🎉 All done! Refresh your Google Sheet to see the changes.");
}

main().catch(e => console.error("❌ Error:", e));
