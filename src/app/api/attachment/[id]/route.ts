import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { google } from "googleapis";

const getGoogleSheetsClient = async () => {
    const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !key) return null;
    const auth = new google.auth.GoogleAuth({
        credentials: { client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL, private_key: key },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const client = await auth.getClient();
    // @ts-expect-error - googleapis type quirk
    return google.sheets({ version: "v4", auth: client });
};

async function deleteFromSheet(fileUrl: string) {
    try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        if (!sheets || !spreadsheetId) return;

        // หา sheet ชื่อ Attachments
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const attachmentSheet = meta.data.sheets?.find((s) => {
            const t = s.properties?.title?.toLowerCase() ?? "";
            return t.includes("attachment") || t.includes("ไฟล์") || t.includes("เอกสาร");
        });
        if (!attachmentSheet) return;

        const sheetName = attachmentSheet.properties!.title!;
        const sheetId = attachmentSheet.properties!.sheetId!;

        // ดึงคอลัมน์ E (URL/ลิงก์ไฟล์) เพื่อหาแถวที่ตรงกัน
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetName}'!E:E`,
        });

        const rows = res.data.values ?? [];
        const rowIndex = rows.findIndex((row) => row[0] === fileUrl);
        if (rowIndex === -1) return; // ไม่เจอ → ข้ามไป

        const sheetRowIndex = rowIndex; // 0-based

        // ลบแถวนั้นออก
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId,
                                dimension: "ROWS",
                                startIndex: sheetRowIndex,
                                endIndex: sheetRowIndex + 1,
                            },
                        },
                    },
                ],
            },
        });
    } catch (e) {
        console.warn("[Sheet] ลบแถว Attachments ไม่สำเร็จ:", e);
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // ตรวจสอบ header admin auth (userId ส่งมาใน header)
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ success: false, error: "ไม่ได้รับอนุญาต" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPERVISOR")) {
            return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์ในการลบ" }, { status: 403 });
        }

        // ดึงข้อมูล attachment
        const attachment = await prisma.attachment.findUnique({ where: { id } });
        if (!attachment) {
            return NextResponse.json({ success: false, error: "ไม่พบไฟล์" }, { status: 404 });
        }

        // 1) ลบไฟล์จริงจาก public/uploads/
        const filePath = path.join(process.cwd(), "public", attachment.fileUrl);
        if (existsSync(filePath)) {
            await unlink(filePath);
        }

        // 2) ลบแถวใน Google Sheets Attachments
        await deleteFromSheet(attachment.fileUrl);

        // 3) ลบ record ใน DB
        await prisma.attachment.delete({ where: { id } });

        // 4) บันทึก audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: "DELETE_ATTACHMENT",
                resource: "ATTACHMENT",
                resourceId: id,
                metadata: { fileName: attachment.fileName, fileUrl: attachment.fileUrl },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete attachment error:", error);
        return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการลบไฟล์" }, { status: 500 });
    }
}
