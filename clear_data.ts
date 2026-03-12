/**
 * clear_data.ts
 * Clears all case/reporter data from DB and resets the Google Sheet.
 * Keeps: Users, Categories, Hospitals, AuditLogs
 * Run with: npx tsx clear_data.ts
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

async function main() {
    console.log("🗑️  Starting data cleanup...\n");

    // ====== CLEAR DATABASE ======
    console.log("Clearing database...");

    await prisma.cSATRating.deleteMany({});
    console.log("  ✅ CSATRatings cleared");

    await prisma.attachment.deleteMany({});
    console.log("  ✅ Attachments cleared");

    await prisma.caseUpdate.deleteMany({});
    console.log("  ✅ CaseUpdates cleared");

    await prisma.case.deleteMany({});
    console.log("  ✅ Cases cleared");

    await prisma.reporter.deleteMany({});
    console.log("  ✅ Reporters cleared");

    await prisma.dailySequence.deleteMany({});
    console.log("  ✅ DailySequences (Case ID counter) reset");

    console.log("\n✅ Database cleared! (Users, Categories, Hospitals preserved)");

    // ====== CLEAR GOOGLE SHEET (keep header) ======
    console.log("\nClearing Google Sheet...");
    try {
        const sheets = google.sheets({ version: "v4", auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const firstSheet = meta.data.sheets?.[0]?.properties?.title;

        if (firstSheet) {
            // Clear everything from row 2 onwards (keeping header row 1)
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: `'${firstSheet}'!A2:Z10000`,
            });
            console.log(`  ✅ Sheet "${firstSheet}" cleared (header preserved)`);
        }
    } catch (e) {
        console.warn("  ⚠️  Could not clear Google Sheet:", e);
    }

    console.log("\n🎉 All done! The system is ready for new data.");
    await prisma.$disconnect();
}

main().catch(async e => {
    console.error(e);
    await prisma.$disconnect();
});
