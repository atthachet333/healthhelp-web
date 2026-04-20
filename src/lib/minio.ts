import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 1. สร้างตัวเชื่อมต่อ (Client) ไปยัง MinIO
export const s3Client = new S3Client({
    region: "ap-southeast-1", // ใส่หลอกไว้ MinIO ไม่บังคับ Region
    endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || "admin",
        secretAccessKey: process.env.MINIO_SECRET_KEY || "password1234",
    },
    forcePathStyle: true,
});

// 2. ฟังก์ชันสำหรับอัปโหลดไฟล์
export async function uploadToMinio(fileBuffer: Buffer, fileName: string, mimeType: string) {
    const bucketName = process.env.MINIO_BUCKET_NAME || "helpdesk-files";

    const uniqueFileName = `${Date.now()}-${fileName.replace(/\s+/g, '-')}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueFileName,
        Body: fileBuffer,
        ContentType: mimeType,
    });

    await s3Client.send(command);

    const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
    return `${endpoint}/${bucketName}/${uniqueFileName}`;
}

// 3. ฟังก์ชันสร้างลิงก์สำหรับดู/โหลดไฟล์แบบ Real-time (แก้ใหม่ให้รองรับโฟลเดอร์และภาษาไทย)
export async function getPresignedFileUrl(fileUrl: string, forceDownload: boolean = false) {
    try {
        const bucketName = process.env.MINIO_BUCKET_NAME || "helpdesk-files";

        // 1. ตัดเอาเฉพาะ URL ไม่เอา Query String (ลบพวก ?X-Amz... ทิ้งไปให้หมด)
        const urlWithoutQuery = fileUrl.split('?')[0];

        // 2. ดึงเอา Key (Path ของไฟล์ใน Bucket) ออกมาให้ถูกต้อง
        const urlObj = new URL(urlWithoutQuery);
        let key = urlObj.pathname;

        // ตัดชื่อ Bucket ออกจาก Path ถ้ามี (เช่น /helpdesk-files/uploads/...)
        const prefix = `/${bucketName}/`;
        if (key.startsWith(prefix)) {
            key = key.substring(prefix.length);
        }

        // ถอดรหัสภาษาไทยให้เป็นข้อความปกติ ป้องกัน MinIO หาชื่อไฟล์ไม่เจอ
        key = decodeURIComponent(key);

        // ดึงแค่ชื่อไฟล์สำหรับใช้ตอนดาวน์โหลด
        const fileName = key.split('/').pop() || 'download';

        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key, // ส่ง Key ที่รวมโฟลเดอร์ครบถ้วน
            // บังคับการดาวน์โหลดหรือพรีวิว + รองรับชื่อไฟล์ภาษาไทยเวลาโหลดลงเครื่อง
            ResponseContentDisposition: forceDownload
                ? `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
                : `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        });

        // ขอสร้างลิงก์ใหม่เอี่ยมให้มีอายุ 1 ชั่วโมง (3600 วินาที)
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return signedUrl;
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return fileUrl; // ถ้าพังให้คืนค่าลิงก์เดิมไปก่อน
    }
}