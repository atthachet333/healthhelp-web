import { google } from "googleapis";
import * as dotenv from 'dotenv';
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

    try {
        const metaData = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = metaData.data.sheets?.find(s => s.properties?.title === "Attachments" || s.properties?.title === "เอกสาร");

        if (!sheet) return console.log("Sheet not found");

        const sheetId = sheet.properties?.sheetId;

        console.log("Checking if first row is header...");
        const firstRow = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheet.properties?.title}'!A1:E1`
        });

        const isAlreadyHeader = firstRow.data.values && firstRow.data.values[0][0] === "วันที่/เวลา";

        if (!isAlreadyHeader) {
            console.log("Header not found. Inserting new row at the top...");
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            insertDimension: {
                                range: {
                                    sheetId: sheetId,
                                    dimension: "ROWS",
                                    startIndex: 0,
                                    endIndex: 1
                                },
                                inheritFromBefore: false
                            }
                        }
                    ]
                }
            });

            console.log("Adding Headers format text...");
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheet.properties?.title}'!A1:E1`,
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: [["วันที่/เวลา", "Case ID", "เบอร์โทร", "ชื่อไฟล์", "URL/ลิงก์ไฟล์"]],
                },
            });
        }

        console.log("Applying Color Formatting...");
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        repeatCell: {
                            range: {
                                sheetId: sheetId,
                                startRowIndex: 0,
                                endRowIndex: 1,
                                startColumnIndex: 0,
                                endColumnIndex: 5
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.1, green: 0.2, blue: 0.5 },
                                    textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
                                }
                            },
                            fields: "userEnteredFormat(backgroundColor,textFormat)"
                        }
                    }
                ]
            }
        });
        console.log("Formatted Google Sheet Successfully!");
    } catch (e) {
        console.error("Error formatting sheet:", e);
    }
}
main();
