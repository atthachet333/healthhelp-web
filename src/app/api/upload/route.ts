import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file received.' }, { status: 400 });
        }

        // แปลงไฟล์เป็น Buffer เพื่อเตรียมบันทึกลงเครื่อง
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // ตั้งชื่อไฟล์ใหม่ ป้องกันชื่อซ้ำและตัดอักขระพิเศษออก
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        // กำหนดปลายทางที่จะเซฟไฟล์ (โฟลเดอร์ public/uploads)
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        // เช็คว่ามีโฟลเดอร์ uploads หรือยัง ถ้ายังไม่มีให้สร้างขึ้นมาใหม่เลย
        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }

        // นำไฟล์ไปวางในโฟลเดอร์
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);

        // สร้าง URL สำหรับให้ Frontend เอาไปใช้งานต่อ
        // สร้าง URL สำหรับให้ Frontend เอาไปใช้งานต่อ
        const fileUrl = `/uploads/${fileName}`;

        return NextResponse.json({ success: true, fileUrl: fileUrl });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}