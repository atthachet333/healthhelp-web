"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, FileDown, Database, AlertCircle, CheckCircle2, Loader2, Hospital, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { uploadHospitalCSV, getHospitals } from "@/app/actions/master-data-actions";

export function MasterDataClient() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; successCount?: number; errorCount?: number; error?: string } | null>(null);

    const [hospitals, setHospitals] = useState<any[]>([]);
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingData, setLoadingData] = useState(false);

    const fetchData = useCallback(async () => {
        setLoadingData(true);
        try {
            const res = await getHospitals(page, 15, searchQuery);
            setHospitals(res.data);
            setTotalPages(res.totalPages || 1);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingData(false);
        }
    }, [page, searchQuery]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setSearchQuery(searchInput);
    };

    useEffect(() => {
        const stored = localStorage.getItem("healthhelp_user");
        if (stored) {
            setCurrentUser(JSON.parse(stored));
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResult(null); // Clear previous result
        }
    };

    const handleUpload = async () => {
        if (!file || !currentUser) return;

        setUploading(true);
        setResult(null);

        try {
            const text = await file.text();
            const res = await uploadHospitalCSV(text, currentUser.id);
            setResult(res);
            if (res.success) {
                setFile(null); // Reset form on success
                fetchData(); // Reload data list
            }
        } catch {
            setResult({ success: false, error: "เกิดข้อผิดพลาดในการอ่านไฟล์" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Database className="w-6 h-6 text-blue-400" />
                    จัดการฐานข้อมูล (Master Data)
                </h2>
                <p className="text-slate-400 mt-1">นำเข้าข้อมูลพื้นฐานเข้าสู่ระบบ เช่น รายชื่อโรงพยาบาล</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Hospital className="w-5 h-5 text-indigo-400" />
                        นำเข้าข้อมูลโรงพยาบาล
                    </h3>
                    <p className="text-sm text-slate-400 mb-6">
                        อัปโหลดไฟล์ <span className="text-white font-mono bg-slate-800 px-1 rounded">.csv</span> ที่มีหัวคอลัมน์ <span className="text-emerald-400">code, name, province, district</span>
                    </p>

                    <div className="border-2 border-dashed border-[#1e2d4a] rounded-xl p-8 hover:border-indigo-500/50 transition-colors text-center">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                            id="csv-upload"
                        />
                        <label
                            htmlFor="csv-upload"
                            className="cursor-pointer flex flex-col items-center justify-center space-y-4"
                        >
                            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                <Upload className="w-8 h-8 text-indigo-400" />
                            </div>
                            <div className="text-slate-300 font-medium">
                                {file ? file.name : "คลิกหรือลากไฟล์มาวางที่นี่"}
                            </div>
                            {!file && <span className="text-xs text-slate-500">รองรับเฉพาะไฟล์ .csv เท่านั้น</span>}
                        </label>
                    </div>

                    {file && (
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="btn-primary w-full sm:w-auto"
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                ยืนยันการอัปโหลด
                            </button>
                        </div>
                    )}

                    {result && (
                        <div className={`mt-6 p-4 rounded-xl border ${result.success ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                            {result.success ? (
                                <div className="space-y-2">
                                    <h4 className="flex items-center gap-2 font-bold">
                                        <CheckCircle2 className="w-5 h-5" />
                                        นำเข้าข้อมูลสำเร็จ
                                    </h4>
                                    <ul className="text-sm space-y-1 list-disc list-inside ml-1">
                                        <li>เพิ่ม/อัปเดตข้อมูล: <span className="font-bold">{result.successCount}</span> รายการ</li>
                                        {result.errorCount! > 0 && <li className="text-yellow-400">ข้อมูลไม่สมบูรณ์ถูกข้ามไป: <span className="font-bold">{result.errorCount}</span> รายการ</li>}
                                    </ul>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="font-bold">นำเข้าข้อมูลไม่สำเร็จ</h4>
                                        <p className="text-sm mt-1 text-red-300">{result.error}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Info / Template Section */}
                <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FileDown className="w-5 h-5 text-emerald-400" />
                        รูปแบบไฟล์ที่รองรับ
                    </h3>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                        ระบบต้องการไฟล์นามสกุล <span className="text-white">.csv</span> ที่เข้ารหัสแบบ <span className="text-white">UTF-8</span> เพื่อป้องกันปัญหาภาษาไทยผิดเพี้ยน
                    </p>

                    <div className="bg-[#0b1121] rounded-lg border border-[#1e2d4a] p-4 font-mono text-xs sm:text-sm text-slate-300 overflow-x-auto shadow-inner">
                        <div className="text-emerald-400 border-b border-slate-800 pb-2 mb-2 font-bold whitespace-nowrap">
                            code,name,province,district
                        </div>
                        <div className="whitespace-nowrap space-y-1">
                            <p>10665,&quot;โรงพยาบาลศิริราช&quot;,&quot;กรุงเทพมหานคร&quot;,&quot;บางกอกน้อย&quot;</p>
                            <p>10666,&quot;โรงพยาบาลจุฬาลงกรณ์&quot;,&quot;กรุงเทพมหานคร&quot;,&quot;ปทุมวัน&quot;</p>
                            <p>10702,&quot;โรงพยาบาลมหาราชนครราชสีมา&quot;,&quot;นครราชสีมา&quot;,&quot;เมืองนครราชสีมา&quot;</p>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            ข้อแนะนำ
                        </h4>
                        <ul className="text-xs text-blue-200/80 space-y-2 list-disc list-inside">
                            <li>หากบันทึกจาก Excel ให้เลือก Save As เป็น <span className="text-white font-medium">CSV (Comma delimited) (*.csv)</span></li>
                            <li>หากมีการอัปโหลดรหัส (code) เดิมที่ซ้ำกัน ระบบจะทำการ <span className="text-white font-medium">อัปเดตข้อมูล</span> ชื่อและจังหวัดให้เป็นค่าล่าสุดแทนการเพิ่มข้อมูลซ้ำ</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Search and Table Section */}
            <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-[#1e2d4a] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-400" />
                        ข้อมูลองค์กร/หน่วยงานในระบบ
                    </h3>
                    <form onSubmit={handleSearch} className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="ค้นหาตามชื่อ, รหัสองค์กร, จังหวัด..."
                            className="w-full bg-[#0b1121] border border-[#1e2d4a] rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <button type="submit" className="hidden" />
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-[#0b1121] border-b border-[#1e2d4a]">
                            <tr>
                                <th className="px-6 py-3">รหัส (9 หลัก)</th>
                                <th className="px-6 py-3">ชื่อหน่วยงาน</th>
                                <th className="px-6 py-3">ประเภท</th>
                                <th className="px-6 py-3">สังกัด</th>
                                <th className="px-6 py-3">จังหวัด</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingData ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        กำลังโหลดข้อมูล...
                                    </td>
                                </tr>
                            ) : hospitals.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        ไม่พบข้อมูลหน่วยงาน
                                    </td>
                                </tr>
                            ) : (
                                hospitals.map((hosp: any) => (
                                    <tr key={hosp.id} className="border-b border-[#1e2d4a] hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-blue-400">{hosp.code}</td>
                                        <td className="px-6 py-4 font-medium text-white">{hosp.name}</td>
                                        <td className="px-6 py-4">{hosp.orgType || "-"}</td>
                                        <td className="px-6 py-4">{hosp.affiliation || "-"}</td>
                                        <td className="px-6 py-4">{hosp.province || "-"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-[#1e2d4a] flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                            หน้า {page} จาก {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg bg-[#0b1121] border border-[#1e2d4a] text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg bg-[#0b1121] border border-[#1e2d4a] text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
