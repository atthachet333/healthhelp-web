/**
 * fix_sheet_format.ts
 * Fix Google Sheet formatting: keep header row (row 1) dark blue, reset data rows to white background.
 * Run with: npx tsx fix_sheet_format.ts
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

async function fixSheet(sheets: any, spreadsheetId: string, sheetId: number, sheetName: string) {
    console.log(`\nFixing "${sheetName}" (sheetId: ${sheetId})...`);

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                // Row 1 (header): dark blue background, bold white text
                {
                    repeatCell: {
                        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 26 },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0.1, green: 0.2, blue: 0.5 },
                                textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
                            }
                        },
                        fields: "userEnteredFormat(backgroundColor,textFormat)"
                    }
                },
                // Row 2 onwards: white background, default black text
                {
                    repeatCell: {
                        range: { sheetId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 0, endColumnIndex: 26 },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 1, green: 1, blue: 1 },
                                textFormat: { foregroundColor: { red: 0, green: 0, blue: 0 }, bold: false },
                            }
                        },
                        fields: "userEnteredFormat(backgroundColor,textFormat)"
                    }
                }
            ]
        }
    });
    console.log(`  ✅ "${sheetName}" fixed!`);
}

async function main() {
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!spreadsheetId) {
        console.error("Missing GOOGLE_SHEETS_SPREADSHEET_ID env variable.");
        process.exit(1);
    }

    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const allSheets = meta.data.sheets || [];

    for (const s of allSheets) {
        const sheetId = s.properties?.sheetId;
        const sheetName = s.properties?.title;
        if (sheetId !== undefined && sheetId !== null && sheetName) {
            await fixSheet(sheets, spreadsheetId as string, sheetId, sheetName);
        }
    }

    console.log("\n🎉 All sheets fixed!");
}

main().catch(e => console.error(e));
