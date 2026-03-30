import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "กรุณาแนบไฟล์ที่ต้องการอัปโหลด" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 1. กำหนดโฟลเดอร์ปลายทาง (public/uploads)
        const uploadDir = path.join(process.cwd(), "public", "uploads");

        // 2. เช็กว่ามีโฟลเดอร์หรือยัง ถ้ายังไม่มีให้สร้างขึ้นมาใหม่ (ป้องกัน Error)
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // 3. ตั้งชื่อไฟล์ใหม่ ป้องกันชื่อซ้ำ
        const safeFileName = file.name.replace(/\s+/g, '-');
        const uniqueFileName = `${Date.now()}-${safeFileName}`;
        const filePath = path.join(uploadDir, uniqueFileName);

        // 4. บันทึกไฟล์ลงในเครื่อง Mac ของคุณ
        await writeFile(filePath, buffer);

        // 5. ส่ง URL กลับไปให้หน้าเว็บโชว์รูป
        return NextResponse.json({
            success: true,
            message: "อัปโหลดไฟล์สำเร็จ!",
            url: `/uploads/${uniqueFileName}`, // URL สำหรับดึงรูปไปโชว์
            fileName: uniqueFileName         // ชื่อไฟล์ที่จะเก็บลงฐานข้อมูล
        });

    } catch (error) {
        console.error("❌ API Upload Error (Local):", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" },
            { status: 500 }
        );
    }
}