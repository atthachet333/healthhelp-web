import { google } from "googleapis";
import * as dotenv from "dotenv";
dotenv.config();

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function main() {
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

    // ดูว่าในชีต Attachments มีข้อมูลอะไรบ้าง (3 แถวแรก คอลัมน์ A-G)
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Attachments!A1:G3",
    });

    console.log("ข้อมูลในชีต Attachments (A1:G3):");
    console.log(JSON.stringify(res.data.values, null, 2));
}

main().catch(console.error);
