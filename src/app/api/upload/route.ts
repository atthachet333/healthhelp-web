import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, error: "ไม่พบไฟล์" }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const uploadedFiles = [];

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Unique filename
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            // Replace spaces and special chars to prevent URL issues
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
            const filename = `${uniqueSuffix}-${safeName}`;
            const filePath = path.join(uploadDir, filename);

            await writeFile(filePath, buffer);

            const fileUrl = `/uploads/${filename}`;
            
            uploadedFiles.push({
                fileName: file.name,
                fileUrl,
                fileKey: filename,
                fileType: file.type || "application/octet-stream"
            });
        }

        return NextResponse.json({ success: true, files: uploadedFiles });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ success: false, error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" }, { status: 500 });
    }
}
