/**
 * fix_conditional_format.ts
 * - Reads user's existing conditional formatting rules
 * - Expands their range from A3:N1021 to A2:N1021 so row 2 gets colored too
 * Run with: npx tsx fix_conditional_format.ts
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

async function main() {
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const meta = await sheets.spreadsheets.get({ spreadsheetId, includeGridData: false });
    const firstSheet = meta.data.sheets?.[0];
    const sheetId = firstSheet?.properties?.sheetId;
    const sheetName = firstSheet?.properties?.title;
    const conditionalFormats = firstSheet?.conditionalFormats || [];

    if (conditionalFormats.length === 0) {
        console.log("No conditional formatting rules found.");
        return;
    }

    console.log(`Found ${conditionalFormats.length} conditional formatting rule(s) in "${sheetName}"`);

    // Update each rule to start at row index 1 (row 2) instead of row index 2 (row 3)
    const requests = conditionalFormats.map((cf: any, index: number) => {
        const updatedRanges = (cf.ranges || []).map((range: any) => {
            if (range.startRowIndex === 2) {
                console.log(`  Rule ${index + 1}: Expanding range from row 3 → row 2`);
                return { ...range, startRowIndex: 1 }; // row 2 in 0-based index
            }
            return range;
        });

        return {
            updateConditionalFormatRule: {
                rule: { ...cf, ranges: updatedRanges },
                index: index,
                sheetId: sheetId,
            }
        };
    });

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests }
    });

    console.log("✅ Conditional formatting ranges updated! All data rows will now be colored.");
}

main().catch(e => console.error(e));
