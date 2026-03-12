import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (spreadsheetId) {
        return NextResponse.redirect(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
    }
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
}
