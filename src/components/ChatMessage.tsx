'use client';

import { useState } from 'react';

// โครงสร้างข้อมูลที่อิงตาม Schema (ตาราง Attachment) ของคุณ
interface AttachmentType {
    fileUrl: string;
    fileName: string;
    fileType: string;
}

interface ChatMessageProps {
    sender: string;
    message: string | null; // ในฐานข้อมูลของคุณคือ CaseUpdate.note
    attachments?: AttachmentType[]; // รับไฟล์เป็น Array ได้หลายไฟล์
}

export default function ChatMessage({ sender, message, attachments = [] }: ChatMessageProps) {
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // ฟังก์ชันเช็กว่าเป็นไฟล์รูปภาพหรือไม่
    const isImage = (type: string, name: string) => {
        return type.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
    };

    return (
        <div className="flex flex-col gap-1 mb-4">
            {/* 1. ชื่อคนส่ง */}
            <span className="text-sm font-semibold text-gray-400">{sender}</span>

            {/* 2. กล่องข้อความแชท */}
            <div className="inline-block px-4 py-2 bg-gray-800 text-white rounded-lg rounded-tl-none max-w-[80%] border border-gray-700">

                {/* แสดงข้อความ */}
                {message && <p className="whitespace-pre-wrap text-sm">{message}</p>}

                {/* 3. ส่วนแสดงไฟล์แนบ (ลูปแสดงปุ่มตามจำนวนไฟล์ที่มี) */}
                {attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50 flex flex-wrap gap-2">
                        {attachments.map((file, index) => {
                            // ถ้าเป็นรูปภาพ -> โชว์ปุ่มลูกกะตา
                            if (isImage(file.fileType, file.fileName)) {
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setPreviewImage(file.fileUrl)}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-400 bg-blue-500/10 rounded-md hover:bg-blue-500/20 transition-colors focus:outline-none"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        ดูรูปภาพ
                                    </button>
                                );
                            }
                            // ถ้าไม่ใช่รูปภาพ (เช่น PDF, Word) -> โชว์ปุ่มดาวน์โหลด
                            return (
                                <a
                                    key={index}
                                    href={file.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-400 bg-green-500/10 rounded-md hover:bg-green-500/20 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    ดาวน์โหลดไฟล์
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 4. หน้าต่าง Popup (Modal) สำหรับดูรูปภาพ */}
            {previewImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="relative max-w-4xl max-h-[90vh] w-full p-4 flex flex-col items-center">

                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 p-2 text-white bg-gray-800/80 rounded-full hover:bg-red-500 transition-colors focus:outline-none"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-gray-700 bg-black"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}