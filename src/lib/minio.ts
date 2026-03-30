import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// 1. สร้างตัวเชื่อมต่อ (Client) ไปยัง MinIO
export const s3Client = new S3Client({
    region: "ap-southeast-1", // ใส่หลอกไว้ MinIO ไม่บังคับ Region
    endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || "admin",
        secretAccessKey: process.env.MINIO_SECRET_KEY || "password1234",
    },
    forcePathStyle: true, // *บังคับเปิดสำหรับ MinIO เพื่อให้อ่าน Path ถูกต้อง
});

// 2. ฟังก์ชันสำหรับอัปโหลดไฟล์
export async function uploadToMinio(fileBuffer: Buffer, fileName: string, mimeType: string) {
    const bucketName = process.env.MINIO_BUCKET_NAME || "tickets-attachments";

    // ตั้งชื่อไฟล์ใหม่ไม่ให้ซ้ำกัน (เติมเวลาเข้าไปข้างหน้า)
    const uniqueFileName = `${Date.now()}-${fileName.replace(/\s+/g, '-')}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueFileName,
        Body: fileBuffer,
        ContentType: mimeType,
    });

    // ส่งไฟล์ขึ้น MinIO
    await s3Client.send(command);

    // สร้าง URL ของไฟล์เพื่อเอาไปเซฟลง Database
    const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
    return `${endpoint}/${bucketName}/${uniqueFileName}`;
}