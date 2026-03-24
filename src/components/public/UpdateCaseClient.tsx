"use client";

import { useState } from "react";
import { Search, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function UpdateCaseClient() {
    const [caseNo, setCaseNo] = useState("");
    const [phone, setPhone] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!caseNo || !file) return;

        setLoading(true);
        setResult(null);

        try {
            // ==========================================
            // จังหวะที่ 1: โยนไฟล์ไปเก็บที่ MinIO ก่อน
            // ==========================================
            const fileFormData = new FormData();
            fileFormData.append("file", file);

            // ยิงไปที่ API สำหรับอัปโหลดที่เราสร้างไว้ตอนเทส
            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: fileFormData
            });

            const uploadData = await uploadRes.json();
            let savedFileName = "";

            if (uploadData.success) {
                // ได้ชื่อไฟล์กลับมาแล้ว (เช่น "uploads/123-file.jpg")
                savedFileName = uploadData.fileName;
            } else {
                setResult({ success: false, error: "อัปโหลดไฟล์ไป MinIO ไม่สำเร็จ: " + uploadData.error });
                setLoading(false);
                return; // หยุดการทำงานถ้าอัปโหลดรูปพัง
            }

            // ==========================================
            // จังหวะที่ 2: เอาข้อมูลเคส + ชื่อไฟล์ที่ได้ ส่งไปเซฟลงระบบเดิม
            // ==========================================
            const caseFormData = new FormData();
            caseFormData.append("caseNo", caseNo);
            caseFormData.append("phone", phone);
            // เปลี่ยนจากการแนบไฟล์ก้อนใหญ่ๆ เป็นการแนบแค่ "ชื่อไฟล์" (String) ไปแทน
            caseFormData.append("fileName", savedFileName);

            // ยิงไปที่ API เดิมของคุณที่ใช้เซฟลง Database หรือ Google Sheet
            const response = await fetch("/api/upload-file", {
                method: "POST",
                body: caseFormData
            });

            const data = await response.json();
            if (data.success) {
                setResult({ success: true, message: "อัปโหลดไฟล์เพิ่มเติมสำเร็จ!" });
                setFile(null);
                setCaseNo("");
                setPhone("");
                // รีเซ็ตค่าช่องเลือกไฟล์หน้าเว็บ
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            } else {
                setResult({ success: false, error: data.error || "เกิดข้อผิดพลาด" });
            }
        } catch (error) {
            console.error("Submit Error:", error);
            setResult({ success: false, error: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 py-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">ส่งเอกสารเพิ่มเติม</h1>
            <p className="text-slate-600 mb-8">
                คุณสามารถส่งไฟล์เอกสาร, รูปภาพ, หรือหลักฐานเพิ่มเติม โดยระบุหมายเลขเคสของคุณ
            </p>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            หมายเลขเคส (Case ID) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={caseNo}
                                onChange={(e) => setCaseNo(e.target.value)}
                                placeholder="เช่น HH-11-03-69-0-100001"
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            เบอร์โทรศัพท์ที่ใช้แจ้งเรื่อง <span className="text-slate-400 font-normal">(เพื่อยืนยันตัวตน)</span>
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="08X-XXX-XXXX"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            แนบไฟล์ <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:border-blue-500 transition-colors text-center bg-slate-50">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                required
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                                    <FileText className="w-8 h-8 text-blue-500" />
                                </div>
                                <span className="text-slate-700 font-medium mb-1">
                                    {file ? file.name : "เลือกไฟล์ที่ต้องการแนบ"}
                                </span>
                                <span className="text-sm text-slate-500">
                                    รองรับไฟล์ .pdf, .jpg, .png, .csv ขนาดไม่เกิน 10MB
                                </span>
                            </label>
                        </div>
                    </div>

                    {result && (
                        <div className={`p-4 rounded-xl flex items-start gap-3 ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {result.success ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                            <div>
                                <p className="font-semibold">{result.success ? "สำเร็จ" : "ข้อผิดพลาด"}</p>
                                <p className="text-sm">{result.message || result.error}</p>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !file || !caseNo}
                        className="w-full btn-primary py-3.5 text-lg"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "ส่งข้อมูล"}
                    </button>
                </div>
            </form>
        </div>
    );
}