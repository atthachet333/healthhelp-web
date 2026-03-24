import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendAttachmentToSheet } from "@/lib/google-sheets";
import { sendLineNotify } from "@/lib/line-notify";
import { ActionType } from "@prisma/client";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const caseNo = formData.get("caseNo") as string;
        const phone = formData.get("phone") as string;

        // ✅ 1. เปลี่ยนมารับค่า fileName ที่เป็นข้อความ (String) แทนไฟล์ก้อนใหญ่
        const fileName = formData.get("fileName") as string;

        if (!caseNo || !fileName) {
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

        // ✅ 2. ดึงชื่อไฟล์ดั้งเดิมออกมา (ตัดคำว่า "uploads/ตัวเลข-" ออก เพื่อให้เหลือแค่ชื่อไฟล์เดิม)
        const originalName = fileName.split('/').pop()?.split('-').slice(1).join('-') || fileName;

        // ✅ 3. Save to Database (บันทึกแค่ชื่อไฟล์ลงไป)
        await prisma.attachment.create({
            data: {
                fileUrl: fileName, // บันทึก Path ของ MinIO เก็บไว้ (เช่น uploads/123-pic.jpg)
                fileName: originalName,
                fileType: "file/minio", // ใส่ Type กว้างๆ ไว้ก่อนเพราะเราไม่ได้ส่ง mimetype มาจากหน้าบ้านแล้ว
                caseUpdate: {
                    create: {
                        caseId: caseRecord.id,
                        actionType: ActionType.COMMENT,
                        note: "ผู้ใช้งานอัปโหลดไฟล์/หลักฐานเพิ่มเติม",
                    }
                }
            }
        });

        // ✅ 4. Save to Google Sheets (Attachments tab)
        const sheetData = [
            new Date().toISOString(), // ปรับรูปแบบวันที่ให้เซฟลง Sheet ง่ายขึ้น
            caseNo,
            caseRecord.reporter.phone,
            originalName,
            fileName, // เซฟชื่อไฟล์ MinIO ลง Sheet
            caseRecord.reporter.fullName,
        ];

        try {
            await appendAttachmentToSheet(sheetData);
        } catch (sheetError) {
            console.error("Sheet Sync Error:", sheetError);
        }

        // ✅ 5. Notify Admin
        const lineMsg = `📎 มีไฟล์แนบเพิ่มเติม!\nเคส: ${caseNo}\nพิมพ์โดย: ${caseRecord.reporter.fullName}\nชื่อไฟล์: ${originalName}`;
        await sendLineNotify(lineMsg);

        // ตอบกลับไปหาหน้าบ้าน
        return NextResponse.json({ success: true, fileUrl: fileName });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
    }
}