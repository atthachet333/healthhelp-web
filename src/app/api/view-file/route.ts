import { NextResponse } from "next/server";
import { getPresignedFileUrl } from "@/lib/minio";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const download = searchParams.get("dl") === "true"; // เช็คว่าสั่งดาวน์โหลดไหม

    if (!url) {
        return new NextResponse("Missing URL", { status: 400 });
    }

    try {
        // ขอลิงก์ใหม่จาก MinIO
        const freshUrl = await getPresignedFileUrl(url, download);
        // สั่งให้เบราว์เซอร์เด้ง (Redirect) ไปที่ไฟล์จริงๆ
        return NextResponse.redirect(freshUrl);
    } catch (error) {
        return new NextResponse("Error fetching file", { status: 500 });
    }
}