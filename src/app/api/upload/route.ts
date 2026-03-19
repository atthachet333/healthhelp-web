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

        console.log("--- DEBUG START ---");
        console.log("caseNo ที่ส่งมา:", caseNo);
        console.log("phone ที่ส่งมา:", phone);
        console.log("ไฟล์ที่ส่งมา:", file ? { name: file.name, size: file.size, type: file.type } : "ไม่มีไฟล์");
        console.log("--- DEBUG END ---");

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

        // ✅ อัปโหลดไฟล์ขึ้น Vercel Blob แทนการเซฟลง public/uploads
        // เราจะได้ fileUrl เป็นลิงก์จริงที่เข้าถึงได้เลยทันที
        const blob = await put(`uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`, file, {
            access: 'public',
        });
        const fileUrl = blob.url;

        // Save to Database
        export async function POST(request: Request) {
            try {
                const formData = await request.formData();
                const file = formData.get("file") as File;
        
                if (!file) {
                    return NextResponse.json({ success: false, error: "ไม่มีไฟล์" }, { status: 400 });
                }
        
                // 1. อัปโหลดขึ้น Vercel Blob อย่างเดียว
                const blob = await put(`uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`, file, {
                    access: 'public',
                });
        
                // 2. ส่งค่ากลับไปให้หน้าบ้าน (ห้ามเซฟลง DB หรือ Sheet ในนี้)
                return NextResponse.json({ 
                    success: true, 
                    fileUrl: blob.url,
                    fileName: file.name,
                    fileType: file.type
                });
                
            } catch (error) {
                console.error("Upload error:", error);
                return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
            }
        }