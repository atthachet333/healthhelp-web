"use client"; // จำเป็นต้องใส่ เพราะหน้านี้มีการโต้ตอบกับผู้ใช้ (คลิกปุ่ม, เลือกไฟล์)

import { useState } from "react";

export default function TestUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    // ฟังก์ชันนี้ทำงานตอนที่ผู้ใช้กด "เลือกไฟล์"
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setUploadedUrl(null); // เคลียร์รูปเก่าทิ้งเผื่ออัปโหลดใหม่
        }
    };

    // ฟังก์ชันนี้ทำงานตอนที่ผู้ใช้กดปุ่ม "อัปโหลด"
    const handleUpload = async () => {
        if (!file) {
            alert("กรุณาเลือกไฟล์ก่อนครับ!");
            return;
        }

        try {
            setIsUploading(true);

            // 1. นำไฟล์ใส่กล่อง FormData เพื่อเตรียมส่งไปให้ API
            const formData = new FormData();
            formData.append("file", file); // ชื่อ "file" ตรงนี้ ต้องตรงกับใน route.ts ที่เรารับค่า

            // 2. ยิง API ไปที่หน้าบ้านที่เรารอรับอยู่
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                alert("อัปโหลดสำเร็จ!");
                setUploadedUrl(data.url); // เอา URL ที่ API ส่งกลับมา ไปโชว์บนจอ
            } else {
                alert(`อัปโหลดล้มเหลว: ${data.error}`);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("ระบบมีปัญหา ไม่สามารถอัปโหลดได้");
        } finally {
            setIsUploading(false); // ปิดสถานะกำลังอัปโหลด
        }
    };

    return (
        <div className="p-10 max-w-md mx-auto mt-10 bg-white rounded-xl shadow-md border border-gray-200">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">ทดสอบอัปโหลดไฟล์ไป MinIO</h1>

            {/* ส่วนเลือกไฟล์ */}
            <div className="mb-4">
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*" // บังคับให้เลือกได้เฉพาะรูปภาพ
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            </div>

            {/* ปุ่มอัปโหลด */}
            <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={`w-full py-2 px-4 rounded-md text-white font-bold transition-colors ${!file || isUploading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
            >
                {isUploading ? "กำลังอัปโหลด..." : "อัปโหลดรูปภาพ"}
            </button>

            {/* ส่วนแสดงผลรูปภาพที่อัปโหลดเสร็จแล้ว */}
            {uploadedUrl && (
                <div className="mt-8 border-t pt-6">
                    <p className="text-green-600 font-semibold mb-2">อัปโหลดสำเร็จ! รูปภาพของคุณคือ:</p>
                    <img
                        src={uploadedUrl}
                        alt="Uploaded from MinIO"
                        className="w-full h-auto rounded-lg shadow-sm"
                    />
                </div>
            )}
        </div>
    );
}