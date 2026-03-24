import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// 1. ตั้งค่าการเชื่อมต่อ MinIO
const s3Client = new S3Client({
    region: process.env.MINIO_REGION || 'us-east-1',
    endpoint: process.env.MINIO_ENDPOINT,
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || '',
        secretAccessKey: process.env.MINIO_SECRET_KEY || '',
    },
    forcePathStyle: true, // 🚨 สำคัญมากสำหรับ MinIO ไม่งั้นมันจะหา Bucket ไม่เจอ
});

export async function GET(request: Request) {
    try {
        // 2. รับค่าชื่อไฟล์มาจาก URL (เช่น ?path=uploads/123-pic.jpg)
        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');

        if (!path) {
            return NextResponse.json({ error: 'ระบุพาร์ทของไฟล์ไม่ถูกต้อง' }, { status: 400 });
        }

        const bucketName = process.env.MINIO_BUCKET_NAME || 'healthhelp';

        // 3. เตรียมคำสั่งขออนุญาตดูไฟล์
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: path,
        });

        // 4. เสก Presigned URL ให้มีอายุการใช้งาน 1 ชั่วโมง (3600 วินาที)
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        // 5. Redirect ไปที่รูปภาพนั้นทันที!
        return NextResponse.redirect(presignedUrl);

    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return NextResponse.json({ error: 'ไม่สามารถสร้างลิงก์ดูไฟล์ได้' }, { status: 500 });
    }
}