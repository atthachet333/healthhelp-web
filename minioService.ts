import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 1. ตั้งค่าการเชื่อมต่อกับ MinIO
const s3Client = new S3Client({
    region: "us-east-1",
    endpoint: "http://localhost:9000",
    credentials: {
        accessKeyId: "admin_demo",
        secretAccessKey: "password123",
    },
    forcePathStyle: true,
});

const BUCKET_NAME = "healthhelp-file";

/**
 * ฟังก์ชันสำหรับอัปโหลดไฟล์ขึ้น MinIO
 */
// 👇 สังเกตตรงนี้ครับ เราเติม : Buffer และ : string เข้าไป
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
        console.log(`✅ อัปโหลดไฟล์ ${fileName} สำเร็จ!`);

        return await getFileUrl(fileName);
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการอัปโหลด:", error);
        throw error;
    }
};

/**
 * ฟังก์ชันสำหรับสร้างลิงก์ดูไฟล์แบบชั่วคราว (Presigned URL)
 */
// 👇 เติม : string ให้ fileName
export const getFileUrl = async (fileName: string): Promise<string> => {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return signedUrl;
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการสร้าง URL:", error);
        throw error;
    }
};

import { DeleteObjectCommand } from "@aws-sdk/client-s3"; // เพิ่มบรรทัดนี้ไว้ด้านบนสุด

// ฟังก์ชันสำหรับลบไฟล์ออกจาก MinIO
export const deleteFileFromMinio = async (fileName: string) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.MINIO_BUCKET_NAME,
            Key: fileName, // ชื่อไฟล์ เช่น uploads/2026-03-24/xxx.jpg
        });
        await s3Client.send(command);
        console.log(`✅ Deleted ${fileName} from MinIO`);
    } catch (error) {
        console.error("❌ MinIO Delete Error:", error);
        throw error;
    }
};