import { google } from "googleapis";

// Define the scopes for Google Sheets API
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

/**
 * Single source of truth for main sheet column layout (0-based index).
 * If you add/remove/reorder columns in sheetData, update THIS map.
 */
export const SHEET_COLUMNS = {
    DATE: 0,  // A
    CASE_NO: 1,  // B
    TRACKING: 2,  // C
    NAME: 3,  // D
    PHONE: 4,  // E
    EMAIL: 5,  // F
    ADDRESS: 6, // G - ที่อยู่
    LINE_ID: 7,  // H
    CATEGORY: 8,  // I
    PRIORITY: 9,  // J
    STATUS: 10,  // K
    SUBJECT: 11,  // L
    DETAIL: 12,  // M
    ASSIGNEE: 13,  // N
    HOSPITAL: 14,  // O
    HOSP_CODE: 15, // P
} as const;

/** Human-readable headers matching each column in SHEET_COLUMNS order */
export const SHEET_HEADERS = [
    "วันที่/เวลา",    // A
    "เลขที่เคส",      // B
    "Tracking Code",  // C
    "ชื่อผู้แจ้ง",     // D
    "เบอร์โทร",       // E
    "อีเมล",          // F
    "สถานที่/ที่อยู่",    // G
    "Line ID",        // H
    "หมวดหมู่",        // I
    "ระดับ",           // J
    "สถานะ",          // K
    "หัวข้อปัญหา",     // L
    "รายละเอียด",      // M
    "ผู้รับผิดชอบ",     // N
    "ชื่อโรงพยาบาล",       // O
    "รหัส 9 หลัก",    // P
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

// Helper: format Date to DD/MM/YYYY HH:mm:ss in Asia/Bangkok timezone
function formatBangkokDateTime(val: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");

    // Use Intl API to get time in Asia/Bangkok regardless of server timezone
    const parts = new Intl.DateTimeFormat("th-TH", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(val);

    const get = (type: string) => parts.find(p => p.type === type)?.value ?? "00";

    const day = get("day");
    const month = get("month");
    const year = get("year");
    const hour = get("hour");
    const minute = get("minute");
    const second = get("second");

    return `${pad(Number(day))}/${pad(Number(month))}/${year} ${pad(Number(hour))}:${pad(Number(minute))}:${pad(Number(second))}`;
}

export async function appendToSheet(rowData: unknown[]) {
    try {
        const sheets = await getGoogleSheetsClient();

        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        if (!sheets || !spreadsheetId) {
            console.error("Missing Google Sheets client or GOOGLE_SHEETS_SPREADSHEET_ID in environment variables.");
            return false;
        }

        // Fetch the spreadsheet metadata and prefer the sheet named "เคสที่แจ้งมาแล้ว"
        const metaData = await sheets.spreadsheets.get({ spreadsheetId });
        const allSheets = metaData.data.sheets ?? [];
        const mainSheet =
            allSheets.find(s => s.properties?.title === "เคสที่แจ้งมาแล้ว") ??
            allSheets[0];
        const mainSheetName = mainSheet?.properties?.title;
        if (!mainSheetName) {
            console.error("Could not determine the main sheet name");
            return false;
        }

        // Auto-write headers / format sheet if needed
        await ensureSheetHeaders(sheets, spreadsheetId, mainSheetName);

        // แปลงค่าวันที่เป็นสตริงเวลาไทย และบังคับให้เป็น "ข้อความ" ในชีต (ใส่ ' นำหน้า)
        const formattedData = rowData.map((val, idx) => {
            if (val instanceof Date) {
                const formatted = formatBangkokDateTime(val);
                // ถ้าเป็นคอลัมน์วันที่/เวลา ให้ใส่ ' นำหน้าเพื่อไม่ให้กลายเป็นตัวเลข 46094.x
                if (idx === SHEET_COLUMNS.DATE) {
                    return `'${formatted}`;
                }
                return formatted;
            }
            if (val === null || val === undefined) {
                return "";
            }
            return String(val);
        });

        // Use the dynamically selected main sheet name
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `'${mainSheetName}'!A:Z`, // Append to the first available row in the specified sheet
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

        // ถ้าเป็นชีตหลักชื่อ "เคสที่แจ้งมาแล้ว" ให้บังคับฟอร์แมตคอลัมน์ A เป็นวันที่/เวลา
        if (sheetName === "เคสที่แจ้งมาแล้ว") {
            const meta = await sheets.spreadsheets.get({ spreadsheetId });
            const sheet = meta.data.sheets?.find(s => s.properties?.title === sheetName);
            const sheetId = sheet?.properties?.sheetId;

            if (sheetId !== undefined) {
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [
                            {
                                repeatCell: {
                                    range: {
                                        sheetId,
                                        startRowIndex: 1, // ข้ามแถวหัวตาราง
                                        startColumnIndex: SHEET_COLUMNS.DATE,      // คอลัมน์ A
                                        endColumnIndex: SHEET_COLUMNS.DATE + 1,
                                    },
                                    cell: {
                                        userEnteredFormat: {
                                            numberFormat: {
                                                type: "DATE_TIME",
                                                pattern: "dd/MM/yyyy HH:mm:ss",
                                            },
                                        },
                                    },
                                    fields: "userEnteredFormat.numberFormat",
                                },
                            },
                        ],
                    },
                });
            }
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
                    range: `'Attachments'!A:F`,
                    valueInputOption: "USER_ENTERED",
                    requestBody: {
                        values: [["วันที่/เวลา", "Case ID", "เบอร์โทร", "ชื่อไฟล์", "URL/ลิงก์ไฟล์", "ผู้ส่ง"]],
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
                                            endColumnIndex: 6
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

        // สำหรับชีต Attachments ให้ใช้เวลาไทยปัจจุบันเท่านั้น
        const formattedData = rowData.map((val, idx) => {
            if (val instanceof Date) {
                const formatted = formatBangkokDateTime(val);
                if (idx === 0) {
                    return `'${formatted}`;
                }
                return formatted;
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
