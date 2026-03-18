import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendAttachmentToSheet } from "@/lib/google-sheets";
import { sendLineNotify } from "@/lib/line-notify";
import { ActionType } from "@prisma/client";
import { put } from "@vercel/blob"; // ✅ เปลี่ยนมาใช้ Vercel Blob

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const caseNo = formData.get("caseNo") as string;
        const phone = formData.get("phone") as string;
        const file = formData.get("file") as File;

        if (!caseNo || !file) {
            return NextResponse.json({ success: false, error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        // Verify case existence
        const caseRecord = await prisma.case.findUnique({
            where: { caseNo },
            include: { reporter: true }
        });

        if (!caseRecord) {
            return NextResponse.json({ success: false, error: "ไม่พบเคสด้วยหมายเลขนี้" }, { status: 404 });
        }

        // Optional phone verification
        if (phone && caseRecord.reporter.phone !== phone) {
            return NextResponse.json({ success: false, error: "เบอร์โทรศัพท์ไม่ตรงกับข้อมูลในระบบ" }, { status: 400 });
        }

        // ✅ อัปโหลดไฟล์ขึ้น Vercel Blob (ไม่ต้องใช้ fs/mkdir แล้ว)
        const blob = await put(`uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`, file, {
            access: 'public',
        });
        const fileUrl = blob.url;

        // Save to Database
        await prisma.attachment.create({
            data: {
                fileUrl,
                fileName: file.name,
                fileType: file.type,
                caseUpdate: {
                    create: {
                        caseId: caseRecord.id,
                        actionType: ActionType.COMMENT,
                        note: "ผู้ใช้งานอัปโหลดไฟล์/หลักฐานเพิ่มเติม",
                    }
                }
            }
        });

        // Save to Google Sheets (Attachments tab)
        const sheetData = [
            new Date(),
            caseNo,
            caseRecord.reporter.phone,
            file.name,
            fileUrl, 
            caseRecord.reporter.fullName, 
        ];

        // ✅ ใช้ await และ try-catch เพื่อให้ Vercel ทำงานจนเสร็จก่อน return
        try {
            await appendAttachmentToSheet(sheetData);
        } catch (sheetError) {
            console.error("Sheet Sync Error:", sheetError);
        }

        // Notify Admin
        const lineMsg = `📎 มีไฟล์แนบเพิ่มเติม!\nเคส: ${caseNo}\nพิมพ์โดย: ${caseRecord.reporter.fullName}\nชื่อไฟล์: ${file.name}`;
        await sendLineNotify(lineMsg);

        return NextResponse.json({ success: true, fileUrl });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" }, { status: 500 });
    }
}