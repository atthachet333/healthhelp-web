"use client";

import { useState, useEffect, useRef } from "react";
import { createCase } from "@/app/actions/case-actions";
import { getHospitals } from "@/app/actions/master-data-actions";
import { toast } from "react-hot-toast";
import { CheckCircle2, Copy, Loader2, User, Phone, Mail, MessageSquare, FileText, AlertCircle, MapPin, List, ChevronDown, Tag, Send, Upload, Hospital, Search } from "lucide-react";

interface Category {
    id: string;
    name: string;
}

export function CreateCaseForm({ categories }: { categories: Category[] }) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ trackingCode: string; caseNo: string } | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [copied, setCopied] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    // Hospital Autocomplete
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedHospital, setSelectedHospital] = useState<any>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchingHosp, setSearchingHosp] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (!isDropdownOpen) return;

        const delay = setTimeout(async () => {
            setSearchingHosp(true);
            try {
                const res = await getHospitals(1, 10, searchQuery);
                setHospitals(res.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setSearchingHosp(false);
            }
        }, 300);

        return () => clearTimeout(delay);
    }, [searchQuery, isDropdownOpen]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        const formData = new FormData(e.currentTarget);
        const input = {
            fullName: formData.get("fullName") as string,
            phone: formData.get("phone") as string,
            email: formData.get("email") as string,
            lineId: formData.get("lineId") as string,
            address: formData.get("address") as string,
            hospitalId: selectedHospital ? selectedHospital.id : "",
            categoryId: formData.get("categoryId") as string,
            problemSummary: formData.get("problemSummary") as string,
            description: formData.get("description") as string,
        };

        const res = await createCase(input);

        if (res.success && res.trackingCode && res.caseNo) {
            toast.success("ส่งข้อมูลแจ้งปัญหาสำเร็จ!");
            // If there's a file, upload it to the new endpoint
            if (file) {
                try {
                    const fd = new FormData();
                    fd.append("caseNo", res.caseNo);
                    fd.append("phone", input.phone);
                    fd.append("file", file);
                    await fetch("/api/upload-file", { method: "POST", body: fd });
                } catch (err) {
                    console.error("Failed to upload file attachment:", err);
                }
            }

            setResult({ trackingCode: res.trackingCode, caseNo: res.caseNo });
            setLoading(false);
        } else if (res.error) {
            toast.error("เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาตรวจสอบอีกครั้ง");
            setErrors(res.error as Record<string, string[]>);
            setLoading(false);
        }
    }

    function handleCopy() {
        if (result) {
            navigator.clipboard.writeText(result.trackingCode);
            toast.success("คัดลอกรหัสติดตามแล้ว");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    if (result) {
        return (
            <div className="text-center py-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">ส่งข้อมูลสำเร็จ!</h3>
                <p className="text-slate-600 mb-6 w-full">เคสของคุณถูกสร้างเรียบร้อยแล้ว เจ้าหน้าที่จะดำเนินการโดยเร็ว</p>

                <div className="bg-indigo-50 rounded-xl p-6 w-full max-w-sm mb-6 flex flex-col items-center text-center">
                    <p className="text-sm text-slate-600 mb-1">เลขที่เคส</p>
                    <p className="text-lg font-bold text-slate-900 mb-4">{result.caseNo}</p>

                    <p className="text-sm text-slate-600 mb-1">รหัสติดตาม (Tracking Code)</p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-mono font-bold text-indigo-600 tracking-widest">
                            {result.trackingCode}
                        </span>
                        <button
                            onClick={handleCopy}
                            className="p-2 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="คัดลอก"
                        >
                            <Copy className="w-5 h-5 text-indigo-500" />
                        </button>
                    </div>
                    {copied && <p className="text-green-600 text-sm mt-2">คัดลอกแล้ว!</p>}
                </div>

                <div className="w-full max-w-sm mb-4 bg-amber-50 border-2 border-amber-400 rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm animate-pulse-slow">
                    <span className="text-2xl mt-0.5 shrink-0">⚠️</span>
                    <p className="text-sm font-semibold text-amber-800 leading-snug text-left">
                        <span className="block text-amber-900 font-bold mb-0.5">กรุณาจดรหัสติดตามไว้!</span>
                        คุณจำเป็นต้องใช้รหัสนี้เพื่อตรวจสอบสถานะเคสของคุณในภายหลัง
                    </p>
                </div>

                <div className="flex justify-center gap-3">
                    <a href="/track" className="btn-primary text-sm">
                        ติดตามสถานะ
                    </a>
                    <button onClick={() => { setResult(null); setErrors({}); }} className="btn-secondary text-sm">
                        แจ้งปัญหาใหม่
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-10 sm:space-y-12">
            {/* Contact Information */}
            <div className="bg-orange-50/40 p-6 sm:p-10 border border-orange-100 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-orange-100/60">
                    <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                        <User className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-base font-semibold text-slate-800">ข้อมูลผู้แจ้ง</h4>
                        <p className="text-xs text-slate-500 mt-0.5">ข้อมูลสำหรับการติดต่อกลับ</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    {/* Full Name */}
                    <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                            ชื่อ-นามสกุล <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <User className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input name="fullName" className="input-field bg-white focus:bg-white pl-[52px]" placeholder="สมชาย ใจดี" required />
                        </div>
                        {errors.fullName && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.fullName[0]}</p>}
                    </div>

                    {/* Phone */}
                    <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                            เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Phone className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input name="phone" maxLength={10} className="input-field bg-white focus:bg-white pl-[52px]" placeholder="0812345678" required 
                                onInput={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    target.value = target.value.replace(/[^0-9]/g, '');
                                }} 
                            />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.phone[0]}</p>}
                    </div>

                    {/* Email */}
                    <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                            Email <span className="text-slate-400 font-normal ml-1">(ไม่บังคับ)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Mail className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input name="email" type="email" className="input-field bg-white focus:bg-white pl-[52px]" placeholder="email@example.com" />
                        </div>
                        {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.email[0]}</p>}
                    </div>

                    {/* Line ID */}
                    <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                            Line ID <span className="text-slate-400 font-normal ml-1">(ไม่บังคับ)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <MessageSquare className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input name="lineId" className="input-field bg-white focus:bg-white pl-[52px]" placeholder="@lineid" />
                        </div>
                        {errors.lineId && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.lineId[0]}</p>}
                    </div>

                    {/* Address */}
                    <div className="group md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                            ที่อยู่ <span className="text-slate-400 font-normal ml-1">(ไม่บังคับ)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute top-4 left-0 pl-5 flex items-start pointer-events-none">
                                <MapPin className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <textarea name="address" className="input-field bg-white focus:bg-white pl-[52px] min-h-[100px] py-3.5" placeholder="บ้านเลขที่ หมู่ ซอย ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์..." />
                        </div>
                    </div>

                    {/* Hospital / Agency (Autocomplete) */}
                    <div className="group md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                            หน่วยงาน / โรงพยาบาล <span className="text-slate-400 font-normal ml-1">(ไม่บังคับ - ค้นหาและเลือกได้)</span>
                        </label>
                        <div className="relative" ref={dropdownRef}>
                            <div className="absolute top-0 left-0 pl-5 h-12 flex items-center pointer-events-none">
                                <Hospital className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>

                            {selectedHospital ? (
                                <div className="input-field bg-emerald-50 focus:bg-emerald-50 pl-[52px] flex items-center justify-between border-emerald-200">
                                    <div className="truncate text-emerald-800 font-medium">
                                        [{selectedHospital.code}] {selectedHospital.name} {selectedHospital.province && `จ.${selectedHospital.province}`}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedHospital(null); setSearchQuery(""); setIsDropdownOpen(true); }}
                                        className="text-emerald-600 hover:text-emerald-800 text-sm font-bold px-2 py-1 bg-emerald-100 rounded-md"
                                    >
                                        เปลี่ยน
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setIsDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        className="input-field bg-white focus:bg-white pl-[52px] pr-10"
                                        placeholder="พิมพ์ชื่อหน่วยงาน, รหัส 9 หลัก, หรือจังหวัด เพื่อค้นหา..."
                                    />
                                    <div className="absolute top-0 right-0 pr-4 h-12 flex items-center pointer-events-none">
                                        {searchingHosp ? (
                                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                        ) : (
                                            <Search className="w-4 h-4 text-slate-400" />
                                        )}
                                    </div>

                                    {/* Dropdown */}
                                    {isDropdownOpen && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                            {hospitals.length > 0 ? (
                                                <ul className="py-1">
                                                    {hospitals.map(hosp => (
                                                        <li
                                                            key={hosp.id}
                                                            onClick={() => {
                                                                setSelectedHospital(hosp);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                        >
                                                            <div className="font-medium text-slate-800">{hosp.name}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">
                                                                รหัส: <span className="text-blue-600 font-mono">{hosp.code}</span>
                                                                {hosp.province && <span className="ml-2">จังหวัด: {hosp.province}</span>}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="p-4 text-center text-sm text-slate-500">
                                                    {searchQuery ? "ไม่พบหน่วยงานที่ระบุ" : "พิมพ์เพื่อค้นหา"}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Issue Information */}
            <div className="bg-orange-50/40 p-6 sm:p-10 border border-orange-100 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-orange-100/60">
                    <div className="w-8 h-8 rounded-md bg-orange-50 flex items-center justify-center text-orange-500">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-base font-semibold text-slate-800">รายละเอียดปัญหา</h4>
                        <p className="text-xs text-slate-500 mt-0.5">ข้อมูลของปัญหาที่ต้องการแจ้ง</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {/* Category */}
                    <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                            ประเภทปัญหา <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                                <List className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <select name="categoryId" className="input-field bg-white focus:bg-white pl-[52px] appearance-none" required defaultValue="">
                                <option value="" disabled>-- เลือกประเภทปัญหา --</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                            </div>
                        </div>
                        {errors.categoryId && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.categoryId[0]}</p>}
                    </div>

                    {/* Summary */}
                    <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                            หัวข้อปัญหา <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Tag className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input name="problemSummary" className="input-field bg-white focus:bg-white pl-[52px]" placeholder="สรุปปัญหาสั้นๆ ให้เข้าใจง่าย" required />
                        </div>
                        {errors.problemSummary && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.problemSummary[0]}</p>}
                    </div>

                    {/* Description */}
                    <div className="group">
                        <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                            รายละเอียดเพิ่มเติม
                        </label>
                        <div className="relative">
                            <textarea name="description" className="input-field bg-white focus:bg-white p-5 min-h-[160px] leading-relaxed" placeholder="อธิบายรายละเอียดของปัญหาเพิ่มเติม อาการแวดล้อม หรือข้อมูลอื่นๆ ที่เป็นประโยชน์ในการแก้ไขปัญหา..." />
                        </div>
                    </div>
                </div>

                {/* File Upload Section */}
                <div className="mt-8 border-t border-orange-100/60 pt-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
                        แนบไฟล์หลักฐาน (ถ้ามี)
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:border-blue-500 transition-colors text-center bg-white">
                        <input
                            type="file"
                            id="case-file-upload"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <label htmlFor="case-file-upload" className="cursor-pointer flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                                <Upload className="w-6 h-6 text-slate-400" />
                            </div>
                            <span className="text-slate-700 font-medium mb-1">
                                {file ? file.name : "คลิกเพื่อเลือกไฟล์ที่ต้องการแนบ"}
                            </span>
                            <span className="text-xs text-slate-500">
                                รองรับไฟล์ .pdf, .jpg, .png, .csv ขนาดไม่เกิน 10MB
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Errors */}
            {errors._form && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-pulse-slow">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-red-800 text-sm font-medium">{errors._form[0]}</p>
                </div>
            )}

            {/* Submit */}
            <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg sm:text-xl py-4 sm:py-5 px-6 rounded-xl shadow-md transition-colors flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>กำลังส่งข้อมูล...</span>
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span>ส่งแจ้งปัญหา</span>
                        </>
                    )}
                </button>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ข้อมูลของคุณถูกส่งผ่านระบบเข้ารหัสอย่างปลอดภัย
                </div>
            </div>
        </form>
    );
}
