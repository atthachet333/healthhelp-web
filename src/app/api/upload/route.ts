import { NextResponse } from "next/server";
// ⚠️ สำคัญ: เช็ก Path ตรงนี้ให้ชี้ไปหาไฟล์ minioService.ts ของคุณให้ถูกต้องด้วยนะครับ
import { uploadFileToMinio, getFileUrl } from "../../../../minioService";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "กรุณาแนบไฟล์ที่ต้องการอัปโหลด" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // จัดโฟลเดอร์ตามวันที่
        const today = new Date();
        const folderDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const safeFileName = file.name.replace(/\s+/g, '-');
        const minioFileName = `uploads/${folderDate}/${Date.now()}-${safeFileName}`;

        // 🚀 ยิงไฟล์ขึ้น MinIO
        const fileUrl = await uploadFileToMinio(buffer, minioFileName, file.type);

        return NextResponse.json({
            success: true,
            message: "อัปโหลดไฟล์ขึ้น MinIO สำเร็จ!",
            url: fileUrl,
            fileUrl: fileUrl,    // ✨ ตัวแปรสำคัญที่ทำให้ไม่พังแบบรอบที่แล้ว!
            fileName: minioFileName
        });

    } catch (error) {
        console.error("❌ API Upload Error (MinIO):", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์ไปที่ MinIO" },
            { status: 500 }
        );
    }
}