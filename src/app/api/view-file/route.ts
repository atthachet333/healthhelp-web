import { NextResponse } from 'next/server';
// ดึง getFileUrl มาจาก minioService ของคุณ
import { getFileUrl } from "../../../../minioService";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get('url');
    const dl = searchParams.get('dl');

    if (!rawUrl) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    try {
        const urlObj = new URL(rawUrl);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        const objectKey = decodeURIComponent(pathParts.slice(1).join('/'));

        // ดึง URL ที่สดใหม่จาก MinIO
        const freshUrl = await getFileUrl(objectKey);

        // ดึงข้อมูลไฟล์
        const response = await fetch(freshUrl);

        if (!response.ok) {
            console.error("❌ Fetch Error:", response.status, response.statusText);
            return new NextResponse(`Error fetching file from MinIO`, { status: response.status });
        }

        const buffer = await response.arrayBuffer();
        let fileName = objectKey.split('/').pop() || 'downloaded-file';
        let contentType = response.headers.get('content-type') || 'application/octet-stream';
        const lowerFileName = fileName.toLowerCase();

        // บังคับประเภทไฟล์ให้ถูกต้อง
        if (lowerFileName.match(/\.(jpg|jpeg)$/)) contentType = 'image/jpeg';
        else if (lowerFileName.endsWith('.png')) contentType = 'image/png';
        else if (lowerFileName.endsWith('.gif')) contentType = 'image/gif';
        else if (lowerFileName.endsWith('.webp')) contentType = 'image/webp';
        else if (lowerFileName.endsWith('.pdf')) contentType = 'application/pdf';

        const headers = new Headers();
        headers.set('Content-Type', contentType);

        // 💡 ไฮไลท์การแก้ปัญหา: เข้ารหัสชื่อไฟล์ภาษาไทย ป้องกัน Error "ByteString"
        const encodedFileName = encodeURIComponent(fileName);

        // ใช้รูปแบบ filename*=UTF-8'' ซึ่งเป็นมาตรฐานสากลในการส่งชื่อไฟล์ภาษาไทย!
        if (dl === 'true' || !contentType.startsWith('image/')) {
            headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
        } else {
            headers.set('Content-Disposition', `inline; filename*=UTF-8''${encodedFileName}`);
        }

        return new Response(buffer, {
            status: 200,
            headers: headers,
        });

    } catch (error: any) {
        console.error('❌ Proxy Error:', error.message);
        return new NextResponse(`Error: ${error.message}`, { status: 500 });
    }
}