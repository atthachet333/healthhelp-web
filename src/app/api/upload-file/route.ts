import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendAttachmentToSheet } from "@/lib/google-sheets";
import { sendLineNotify } from "@/lib/line-notify";
import { ActionType } from "@prisma/client";
import { promises as fs } from 'fs';
import path from 'path';

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

        // ✅ แปลงไฟล์และบันทึกลงโฟลเดอร์ public/uploads ในเครื่อง (แทน Vercel Blob)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        // เช็คและสร้างโฟลเดอร์ถ้ายังไม่มี
        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }

        // เขียนไฟล์ลงเครื่อง
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);

        // สร้าง URL สำหรับใช้งาน
        const fileUrl = `/uploads/${fileName}`;

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
            new Date().toISOString(), // ปรับรูปแบบวันที่ให้เซฟลง Sheet ง่ายขึ้น
            caseNo,
            caseRecord.reporter.phone,
            file.name,
            fileUrl,
            caseRecord.reporter.fullName,
        ];

        // ✅ ใช้ await และ try-catch เพื่อให้ทำงานเสร็จก่อน
        try {
            await appendAttachmentToSheet(sheetData);
        } catch (sheetError) {
            console.error("Sheet Sync Error:", sheetError);
        }

        // Notify Admin
        const lineMsg = `📎 มีไฟล์แนบเพิ่มเติม!\nเคส: ${caseNo}\nพิมพ์โดย: ${caseRecord.reporter.fullName}\nชื่อไฟล์: ${file.name}`;
        await sendLineNotify(lineMsg);

        // ✅ ตอบกลับไปหาหน้าบ้าน
        return NextResponse.json({ success: true, fileUrl });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" }, { status: 500 });
    }
}