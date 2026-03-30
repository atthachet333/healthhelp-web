import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 1. ตั้งค่าการเชื่อมต่อกับ MinIO โดยดึงค่าจากไฟล์ .env
const s3Client = new S3Client({
    region: "ap-southeast-1", // ใส่เป็น ap-southeast-1 ตามมาตรฐาน S3 (MinIO ไม่ซีเรียส)
    endpoint: process.env.MINIO_ENDPOINT || "http://127.0.0.1:9000",
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
        secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    },
    forcePathStyle: true,
});

// ดึงชื่อ Bucket จาก .env
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "helpdesk-files";

/**
 * ฟังก์ชันสำหรับอัปโหลดไฟล์ขึ้น MinIO
 */
export const uploadFileToMinio = async (
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
): Promise<string> => {
    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: fileBuffer,
            ContentType: mimeType,
        });

        await s3Client.send(command);
        console.log(`✅ อัปโหลดไฟล์ ${fileName} ไปที่ MinIO สำเร็จ!`);

        return await getFileUrl(fileName);
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการอัปโหลด:", error);
        throw error;
    }
};

/**
 * ฟังก์ชันสำหรับสร้างลิงก์ดูไฟล์แบบชั่วคราว (Presigned URL)
 */
export const getFileUrl = async (fileName: string): Promise<string> => {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
        });

        // สร้างลิงก์ที่มีอายุ 1 ชั่วโมง (3600 วินาที)
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return signedUrl;
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการสร้าง URL:", error);
        throw error;
    }
};

/**
 * ฟังก์ชันสำหรับลบไฟล์ออกจาก MinIO
 */
export const deleteFileFromMinio = async (fileName: string) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
        });
        await s3Client.send(command);
        console.log(`✅ ลบไฟล์ ${fileName} ออกจาก MinIO สำเร็จ`);
    } catch (error) {
        console.error("❌ MinIO Delete Error:", error);
        throw error;
    }
};