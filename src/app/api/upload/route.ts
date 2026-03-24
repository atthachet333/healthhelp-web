import { NextResponse } from "next/server";
// จุดสำคัญ: แก้ไข path ให้ชี้ไปยังไฟล์ minioService.ts ของคุณให้ถูกต้อง
import { uploadFileToMinio, getFileUrl } from "../../../../minioService";

export async function POST(request: Request) {
    try {
        // 1. อ่านข้อมูลที่ส่งมาจากหน้าเว็บ (ฟอร์ม)
        const formData = await request.formData();

        // 2. ดึงไฟล์ออกมาจากฟอร์ม โดยใช้ชื่อ key ว่า 'file'
        const file = formData.get("file") as File;

        // ถ้าไม่มีไฟล์ส่งมา ให้ตอบกลับไปว่า Error
        if (!file) {
            return NextResponse.json(
                { error: "กรุณาแนบไฟล์ที่ต้องการอัปโหลด" },
                { status: 400 }
            );
        }

        // 3. แปลงไฟล์เป็น Buffer (MinIO ต้องการข้อมูลรูปแบบ Buffer)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 4. 📅 สร้างโฟลเดอร์ตามวันที่ปัจจุบัน (YYYY-MM-DD)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // เติม 0 ข้างหน้าถ้าเป็นเลขหลักเดียว
        const day = String(today.getDate()).padStart(2, '0');
        const folderDate = `${year}-${month}-${day}`;

        // ตั้งชื่อไฟล์ใหม่ ป้องกันชื่อซ้ำกัน และจับใส่โฟลเดอร์วันที่
        const safeFileName = file.name.replace(/\s+/g, '-'); // ลบช่องว่างออก

        // 📁 ผลลัพธ์ที่ได้จะเป็นเช่น: uploads/2026-03-24/167900000-รูป.jpg
        const minioFileName = `uploads/${folderDate}/${Date.now()}-${safeFileName}`;

        // 5. เรียกใช้ฟังก์ชันที่เราเขียนไว้ เพื่อยิงไฟล์ขึ้น MinIO!
        const fileUrl = await uploadFileToMinio(buffer, minioFileName, file.type);

        return NextResponse.json({
            success: true,
            message: "อัปโหลดไฟล์สำเร็จ!",
            url: fileUrl,       // อันนี้เอาไว้ให้หน้าเว็บโชว์พรีวิวทันทีหลังอัปโหลดเสร็จ
            fileName: minioFileName // 👈 ค่านี้แหละที่จะถูกเซฟลง Database (และนำไปใช้กับหน้า Admin)
        });

    } catch (error) {
        console.error("❌ API Upload Error:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fileName = searchParams.get("fileName");

        if (!fileName) {
            return NextResponse.json({ error: "ระบุชื่อไฟล์ไม่ถูกต้อง" }, { status: 400 });
        }

        // 1. ไปเสกกุญแจชั่วคราวจาก MinIO
        const url = await getFileUrl(fileName);

        // 2. 🚩 แก้ไขตรงนี้: สั่งให้ Browser เด้งไปที่ลิงก์นั้นทันที (Bridge)
        return NextResponse.redirect(url);

    } catch (error) {
        console.error("❌ API Get File Error:", error);
        return NextResponse.json({ error: "เปิดไฟล์ไม่ได้" }, { status: 500 });
    }
}