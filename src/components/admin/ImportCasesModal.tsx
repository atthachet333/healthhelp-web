"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import * as XLSX from "xlsx";
import { importCasesAction, ParsedCaseData } from "@/app/actions/import-actions";
import { toast } from "react-hot-toast";

interface ImportCasesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface PreviewRow extends ParsedCaseData {
    isValid: boolean;
    errors: string[];
}

export function ImportCasesModal({ isOpen, onClose }: ImportCasesModalProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    if (!isOpen) return null;

    const expectedHeaders = ["ปัญหา", "รายละเอียด", "ชื่อผู้แจ้ง", "เบอร์โทร", "อีเมล", "Line ID", "หมวดหมู่"];

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        // Check file type
        const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
        if (fileExt !== 'xlsx' && fileExt !== 'csv') {
            toast.error("รองรับเฉพาะไฟล์ .xlsx หรือ .csv เท่านั้น");
            return;
        }

        setFile(selectedFile);
        setIsParsing(true);
        setPreviewData([]);

        try {
            const data = await selectedFile.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Expected headers logic: Map the columns based on the first row
            const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (rawJson.length < 2) {
                toast.error("ไม่พบข้อมูลในไฟล์ (ต้องมีอย่างน้อย 1 แถวข้อมูลถัดจาก Header)");
                setIsParsing(false);
                return;
            }

            const headerRow = rawJson[0] as string[];
            const rows = rawJson.slice(1);

            // Simple column index mapping (heuristic based on order or matching names)
            // We'll trust the order if headers match roughly, otherwise map by exact expected header names
            // For simplicity, we assume Columns A-G correspond to the expected format.
            const parsedRows: PreviewRow[] = rows.map((row) => {
                const rowData = {
                    problemSummary: String(row[0] || ""),
                    description: String(row[1] || ""),
                    reporterName: String(row[2] || ""),
                    reporterPhone: String(row[3] || ""),
                    reporterEmail: String(row[4] || ""),
                    reporterLineId: String(row[5] || ""),
                    categoryName: String(row[6] || ""),
                };

                const errors: string[] = [];
                if (!rowData.problemSummary.trim()) errors.push("ขาด ปัญหา");
                if (!rowData.reporterName.trim()) errors.push("ขาด ชื่อผู้แจ้ง");
                if (!rowData.reporterPhone.trim()) errors.push("ขาด เบอร์โทร");
                if (!rowData.categoryName.trim()) errors.push("ขาด หมวดหมู่");

                return {
                    ...rowData,
                    isValid: errors.length === 0,
                    errors
                };
            }).filter(r => r.problemSummary || r.reporterName); // filter out completely empty trailing rows

            setPreviewData(parsedRows);

            if (parsedRows.some(r => !r.isValid)) {
                toast.error("พบข้อมูลที่ไม่ครบถ้วน โปรดตรวจสอบ");
            } else {
                toast.success(`ตรวจสอบข้อมูลเบื้องต้นสำเร็จ (${parsedRows.length} รายการ)`);
            }

            // Auto fullscreen if many columns or rows to preview better
            if (parsedRows.length > 5) {
                setIsFullscreen(true);
            }

        } catch (error) {
            console.error("Parse error:", error);
            toast.error("เกิดข้อผิดพลาดในการอ่านไฟล์");
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleImportSubmit = async () => {
        const validData = previewData.filter(r => r.isValid);
        if (validData.length === 0) {
            toast.error("ไม่มีข้อมูลที่พร้อมนำเข้า");
            return;
        }

        setIsImporting(true);
        const userStr = localStorage.getItem("healthhelp_user");
        const adminId = userStr ? JSON.parse(userStr).id : "";

        const payload: ParsedCaseData[] = validData.map(r => ({
            problemSummary: r.problemSummary,
            description: r.description,
            reporterName: r.reporterName,
            reporterPhone: r.reporterPhone,
            reporterEmail: r.reporterEmail,
            reporterLineId: r.reporterLineId,
            categoryName: r.categoryName
        }));

        try {
            const result = await importCasesAction(payload, adminId);
            if (result.success) {
                toast.success(`อิมพอร์ตข้อมูลสำเร็จ ${result.importedCount} รายการ!`);
                onClose();
                router.refresh();
            } else {
                toast.error(`เกิดข้อผิดพลาด: ${result.error}`);
            }
        } catch (error) {
            toast.error("ระบบขัดข้อง ไม่สามารถอิมพอร์ตได้");
        } finally {
            setIsImporting(false);
        }
    };

    const handleClear = () => {
        setFile(null);
        setPreviewData([]);
    };

    const validCount = previewData.filter(d => d.isValid).length;
    const invalidCount = previewData.length - validCount;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`bg-[#0b1121] border border-[#1e2d4a] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${isFullscreen ? 'fixed inset-4 w-auto h-auto' : 'w-full max-w-4xl max-h-[90vh]'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d4a] bg-[#111a2e]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white leading-tight">นำเข้าข้อมูลเคส (Import)</h3>
                            <p className="text-sm text-slate-400 leading-tight">รองรับไฟล์ Excel (.xlsx) และ CSV</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {previewData.length > 0 && (
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 hover:border-slate-500"
                            >
                                {isFullscreen ? "ย่อหน้าต่าง" : "ขยายเต็มจอ"}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors border border-transparent hover:border-slate-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#1e2d4a] scrollbar-track-transparent">
                    {!file && previewData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-[#1e2d4a] rounded-xl bg-[#0d1526] hover:bg-[#111a2e] transition-colors group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Upload className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์มาวางที่นี่</h4>
                            <p className="text-slate-400 text-center max-w-md mb-6 leading-relaxed">
                                โครงสร้างคอลัมน์ที่ระบบรองรับ (เรียงตามลำดับ):<br/>
                                <span className="font-mono text-xs text-indigo-400 inline-block mt-2 px-3 py-1.5 bg-indigo-950/30 rounded-lg border border-indigo-900/50">
                                    ปัญหา* | รายละเอียด | ชื่อผู้แจ้ง* | เบอร์โทร* | อีเมล | Line ID | หมวดหมู่*
                                </span>
                            </p>
                            <button className="btn-primary py-2.5 px-6 rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20">
                                เลือกไฟล์
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".xlsx, .csv"
                                onChange={handleFileUpload}
                            />
                        </div>
                    ) : isParsing ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                            <p className="text-white font-medium text-lg">กำลังอ่านข้อมูลไฟล์...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-[#111a2e] rounded-xl p-4 border border-[#1e2d4a] flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-400">ข้อมูลทั้งหมด</p>
                                        <p className="text-2xl font-bold text-white">{previewData.length} แถว</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                                    </div>
                                </div>
                                <div className="bg-[#111a2e] rounded-xl p-4 border border-green-500/20 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-green-400">ข้อมูลที่สมบูรณ์</p>
                                        <p className="text-2xl font-bold text-white">{validCount} แถว</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    </div>
                                </div>
                                <div className="bg-[#111a2e] rounded-xl p-4 border border-amber-500/20 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-amber-400">ข้อมูลที่ต้องแก้ไข</p>
                                        <p className="text-2xl font-bold text-white">{invalidCount} แถว</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Preview Table */}
                            <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl overflow-hidden shadow-inner">
                                <div className="overflow-x-auto min-h-[300px] max-h-[500px]">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[#0b1121] sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#1e2d4a]">สถานะ</th>
                                                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#1e2d4a]">ปัญหา</th>
                                                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#1e2d4a]">ผู้แจ้ง</th>
                                                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#1e2d4a]">ติดต่อ</th>
                                                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#1e2d4a]">หมวดหมู่</th>
                                                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#1e2d4a]">รายละเอียด</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#1e2d4a]">
                                            {previewData.map((row, i) => (
                                                <tr key={i} className={`hover:bg-[#1a2540]/50 transition-colors ${!row.isValid ? 'bg-amber-500/5' : ''}`}>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {row.isValid ? (
                                                            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded-full w-max">
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> พร้อม
                                                            </span>
                                                        ) : (
                                                            <div className="flex flex-col gap-1">
                                                                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full w-max">
                                                                    <AlertTriangle className="w-3.5 h-3.5" /> ข้อมูลไม่ครบ
                                                                </span>
                                                                <span className="text-[10px] text-amber-500 whitespace-normal min-w-[120px]">
                                                                    {row.errors.join(", ")}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-slate-200 line-clamp-2" title={row.problemSummary}>{row.problemSummary || "-"}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-slate-300 font-medium">{row.reporterName || "-"}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-slate-300">{row.reporterPhone || "-"}</span>
                                                            {row.reporterEmail && <span className="text-[10px] text-slate-500">{row.reporterEmail}</span>}
                                                            {row.reporterLineId && <span className="text-[10px] text-slate-500">LINE: {row.reporterLineId}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-full whitespace-nowrap border border-indigo-500/20">{row.categoryName || "-"}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs text-slate-500 truncate max-w-[150px] inline-block" title={row.description}>{row.description || "-"}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#1e2d4a] bg-[#0b1121] flex justify-between items-center rounded-b-2xl">
                    <div>
                        {previewData.length > 0 && (
                            <button
                                onClick={handleClear}
                                disabled={isImporting}
                                className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                            >
                                อัปโหลดไฟล์อื่น
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isImporting}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-[#111a2e] border border-[#1e2d4a] transition-all"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleImportSubmit}
                            disabled={previewData.length === 0 || validCount === 0 || isImporting}
                            className="btn-primary min-w-[200px] py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isImporting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    กำลังนำเข้า ({validCount} รายการ)...
                                </>
                            ) : (
                                <>
                                    ยืนยันนำเข้าข้อมูล ({validCount} รายการ)
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
