import { google } from "googleapis";

// Define the scopes for Google Sheets API
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

/**
 * Single source of truth for main sheet column layout (0-based index).
 * If you add/remove/reorder columns in sheetData, update THIS map.
 */
export const SHEET_COLUMNS = {
    DATE: 0,  // A — วันที่/เวลา
    CASE_NO: 1,  // B — เลขที่เคส
    TRACKING: 2,  // C — Tracking Code
    NAME: 3,  // D — ชื่อผู้แจ้ง
    PHONE: 4,  // E — เบอร์โทร
    EMAIL: 5,  // F — อีเมล
    LINE_ID: 6,  // G — Line ID
    CATEGORY: 7,  // H — หมวดหมู่
    PRIORITY: 8,  // I — ระดับ
    STATUS: 9,  // J — สถานะ
    SUBJECT: 10,  // K — หัวข้อปัญหา
    DETAIL: 11,  // L — รายละเอียด
    ASSIGNEE: 12,  // M — ผู้รับผิดชอบ
    HOSPITAL: 13,  // N — ชื่อโรงพยาบาล
    HOSP_CODE: 14, // O — รหัส 9 หลัก
} as const;

/** Human-readable headers matching each column in SHEET_COLUMNS order */
export const SHEET_HEADERS = [
    "วันที่/เวลา",    // A
    "เลขที่เคส",      // B
    "Tracking Code",  // C
    "ชื่อผู้แจ้ง",     // D
    "เบอร์โทร",       // E
    "อีเมล",          // F
    "Line ID",        // G
    "หมวดหมู่",        // H
    "ระดับ",           // I
    "สถานะ",          // J
    "หัวข้อปัญหา",     // K
    "รายละเอียด",      // L
    "ผู้รับผิดชอบ",     // M
    "ชื่อโรงพยาบาล",       // N
    "รหัส 9 หลัก",    // O
];

/** Convert a 0-based column index to a spreadsheet letter (0→A, 1→B, …) */
function colIndexToLetter(index: number): string {
    let letter = "";
    let n = index;
    do {
        letter = String.fromCharCode(65 + (n % 26)) + letter;
        n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return letter;
}

// Reformat private key to replace escaped newlines with actual newlines
// Required for environment variables that might be read literally
const getPrivateKey = () => {
    const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    if (!key) return undefined;

    // Replace literal '\n' characters with actual newlines if present
    return key.replace(/\\n/g, "\n");
};

/**
 * Get an authenticated Google Sheets client
 */
export async function getGoogleSheetsClient() {
    try {
        if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
            console.warn("Google Sheets credentials not found. Skipping Google Sheets integration.");
            return null;
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
                private_key: getPrivateKey(),
            },
            scopes: SCOPES,
        });

        const client = await auth.getClient();
        // @ts-expect-error - The googleapis type definitions can be strict, but this works
        return google.sheets({ version: "v4", auth: client });
    } catch (error) {
        console.error("Error initializing Google Sheets client:", error);
        return null;
    }
}

/**
 * Append a row of tracking data to the Google Sheet
 * @param rowData Array of values to append (will be mapped to columns A, B, C...)
 */
export async function appendToSheet(rowData: unknown[]) {
    try {
        const sheets = await getGoogleSheetsClient();

        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        if (!sheets || !spreadsheetId) {
            console.error("Missing Google Sheets client or GOOGLE_SHEETS_SPREADSHEET_ID in environment variables.");
            return false;
        }

        // Fetch the spreadsheet metadata to get the actual name of the first sheet
        // This avoids issues with different languages (Sheet1 vs แผ่นที่ 1)
        const metaData = await sheets.spreadsheets.get({
            spreadsheetId
        });

        const firstSheetName = metaData.data.sheets?.[0]?.properties?.title;
        if (!firstSheetName) {
            console.error("Could not determine the name of the first sheet");
            return false;
        }

        // Auto-write headers if row 1 is empty (e.g. brand-new sheet)
        await ensureSheetHeaders(sheets, spreadsheetId, firstSheetName);

        // Format dates to strings if any
        const formattedData = rowData.map(val => {
            if (val instanceof Date) {
                // Return DD/MM/YYYY HH:mm:ss format in Gregorian calendar (Asia/Bangkok)
                return val.toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }).replace(",", "");
            }
            if (val === null || val === undefined) {
                return "";
            }
            return String(val);
        });

        // Use the dynamically fetched sheet name
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `'${firstSheetName}'!A:Z`, // Append to the first available row in the specified sheet
            valueInputOption: "USER_ENTERED", // Parses dates and numbers like user typing them
            insertDataOption: "INSERT_ROWS",
            requestBody: {
                values: [formattedData],
            },
        });

        console.log("Sheets API Response Status:", response.status);

        return response.status === 200;
    } catch (error) {
        // @ts-expect-error - Error might not be strictly typed as an Error object
        console.error("Error appending to Google Sheet:", error?.message || error);
        return false;
    }
}

/**
 * Ensures the first row of the main sheet contains the correct headers.
 * Writes headers only if row 1 is completely empty.
 */
export async function ensureSheetHeaders(sheets: Awaited<ReturnType<typeof getGoogleSheetsClient>>, spreadsheetId: string, sheetName: string) {
    if (!sheets) return;
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetName}'!A1:Z1`,
        });
        const firstRow = res.data.values?.[0];
        const isEmpty = !firstRow || firstRow.every(cell => !cell);
        if (isEmpty) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheetName}'!A1`,
                valueInputOption: "USER_ENTERED",
                requestBody: { values: [SHEET_HEADERS] },
            });
            console.log("[Google Sheets] Header row written automatically.");
        }
    } catch (e) {
        console.warn("[Google Sheets] Could not ensure headers:", e);
    }
}

/**
 * Updates the status of a specific case in the Google Sheet.
 * Uses SHEET_COLUMNS to determine the correct column letter dynamically.
 * @param trackingCode The tracking code of the case (tracked in the TRACKING column)
 * @param newStatus The new status label to write into the STATUS column
 */
export async function updateSheetCaseStatus(trackingCode: string, newStatus: string) {
    try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        if (!sheets || !spreadsheetId) return false;

        // Fetch sheet metadata to get exact sheet name
        const metaData = await sheets.spreadsheets.get({ spreadsheetId });
        const firstSheetName = metaData.data.sheets?.[0]?.properties?.title;
        if (!firstSheetName) return false;

        // Fetch the TRACKING column (C) to locate the row
        const trackingColLetter = colIndexToLetter(SHEET_COLUMNS.TRACKING); // → "C"
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${firstSheetName}'!${trackingColLetter}:${trackingColLetter}`,
        });

        const rows = response.data.values;
        if (!rows) {
            console.log(`[Google Sheets Sync] Sheet appears empty — no rows found.`);
            return false;
        }

        // Skip header row (index 0) and search from index 1
        const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[0] === trackingCode);

        if (rowIndex === -1) {
            console.log(`[Google Sheets Sync] Could not find tracking code "${trackingCode}" in the sheet. The case may pre-date Google Sheets integration or was deleted from the sheet.`);
            return false;
        }

        // rowIndex is 0-based; sheet rows are 1-based → add 1
        const exactRow = rowIndex + 1;

        // Use SHEET_COLUMNS to calculate the correct status column letter dynamically
        const statusColLetter = colIndexToLetter(SHEET_COLUMNS.STATUS); // → "J"
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${firstSheetName}'!${statusColLetter}${exactRow}:${statusColLetter}${exactRow}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [[newStatus]] },
        });

        console.log(`[Google Sheets Sync] Updated row ${exactRow} — case ${trackingCode} → "${newStatus}"`);
        return true;
    } catch (error) {
        // @ts-expect-error - Error might not be strictly typed
        console.error("Error updating case in Google Sheet:", error?.message || error);
        return false;
    }
}

/**
 * Updates the assignee name of a specific case in the Google Sheet (column M).
 * @param trackingCode The tracking code of the case
 * @param assigneeName The full name of the new assignee to write
 */
export async function updateSheetAssignee(trackingCode: string, assigneeName: string) {
    try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        if (!sheets || !spreadsheetId) return false;

        const metaData = await sheets.spreadsheets.get({ spreadsheetId });
        const firstSheetName = metaData.data.sheets?.[0]?.properties?.title;
        if (!firstSheetName) return false;

        // Find the row by tracking code (column C)
        const trackingColLetter = colIndexToLetter(SHEET_COLUMNS.TRACKING); // "C"
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${firstSheetName}'!${trackingColLetter}:${trackingColLetter}`,
        });

        const rows = response.data.values;
        if (!rows) return false;

        // Skip header row (index 0)
        const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[0] === trackingCode);
        if (rowIndex === -1) {
            console.log(`[Google Sheets Sync] Tracking code "${trackingCode}" not found — assignee not synced.`);
            return false;
        }

        const exactRow = rowIndex + 1; // convert to 1-based
        const assigneeColLetter = colIndexToLetter(SHEET_COLUMNS.ASSIGNEE); // "M"

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${firstSheetName}'!${assigneeColLetter}${exactRow}:${assigneeColLetter}${exactRow}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [[assigneeName]] },
        });

        console.log(`[Google Sheets Sync] Updated row ${exactRow} — assignee for ${trackingCode} → "${assigneeName}"`);
        return true;
    } catch (error) {
        // @ts-expect-error - Error might not be strictly typed
        console.error("Error updating assignee in Google Sheet:", error?.message || error);
        return false;
    }
}


/**
 * Append uploaded file details to an 'Attachments' (or second) sheet
 */
export async function appendAttachmentToSheet(rowData: unknown[]) {
    try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        if (!sheets || !spreadsheetId) return false;

        // Fetch the spreadsheet metadata to find or create the Attachments sheet
        const metaData = await sheets.spreadsheets.get({ spreadsheetId });

        let attachmentSheetName = metaData.data.sheets?.find(s =>
            s.properties?.title?.toLowerCase().includes("attachment") ||
            s.properties?.title?.toLowerCase().includes("ไฟล์") ||
            s.properties?.title?.toLowerCase().includes("เอกสาร")
        )?.properties?.title;

        // If no specifically named sheet is found, try to create 'Attachments'
        if (!attachmentSheetName) {
            try {
                // Creates a new sheet named 'Attachments'
                const addSheetResponse = await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [{
                            addSheet: { properties: { title: "Attachments" } }
                        }]
                    }
                });
                attachmentSheetName = "Attachments";
                const newSheetId = addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId;

                // Add Headers to the new sheet
                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: `'Attachments'!A:E`,
                    valueInputOption: "USER_ENTERED",
                    requestBody: {
                        values: [["วันที่/เวลา", "Case ID", "เบอร์โทร", "ชื่อไฟล์", "URL/ลิงก์ไฟล์"]],
                    },
                });

                if (newSheetId !== undefined) {
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId,
                        requestBody: {
                            requests: [
                                {
                                    repeatCell: {
                                        range: {
                                            sheetId: newSheetId,
                                            startRowIndex: 0,
                                            endRowIndex: 1,
                                            startColumnIndex: 0,
                                            endColumnIndex: 5
                                        },
                                        cell: {
                                            userEnteredFormat: {
                                                backgroundColor: { red: 0.2, green: 0.2, blue: 0.6 }, // Dark blue
                                                textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
                                            }
                                        },
                                        fields: "userEnteredFormat(backgroundColor,textFormat)"
                                    }
                                }
                            ]
                        }
                    });
                }
            } catch (createError) {
                console.warn("Could not create 'Attachments' sheet automatically, falling back to second sheet.", createError);
                // Fallback to second sheet if creation failed (e.g., permissions)
                if (metaData.data.sheets && metaData.data.sheets.length > 1) {
                    attachmentSheetName = metaData.data.sheets[1].properties?.title;
                } else {
                    console.error("No fallback sheet available for attachments.");
                    return false;
                }
            }
        }

        // Format dates to strings if any
        const formattedData = rowData.map(val => {
            if (val instanceof Date) {
                return val.toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }).replace(",", "");
            }
            if (val === null || val === undefined) return "";
            return String(val);
        });

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `'${attachmentSheetName}'!A:Z`,
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",
            requestBody: {
                values: [formattedData],
            },
        });

        console.log("Attachments Sheet Sync Status:", response.status);
        return response.status === 200;
    } catch (error) {
        // @ts-expect-error - Error might not be strictly typed
        console.error("Error appending attachment to Google Sheet:", error?.message || error);
        return false;
    }
}
