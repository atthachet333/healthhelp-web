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
                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-3">ส่งข้อมูลสำเร็จ!</h3>
                <p className="text-slate-600 text-lg mb-6 w-full leading-relaxed">เคสของคุณถูกสร้างเรียบร้อยแล้ว เจ้าหน้าที่จะดำเนินการโดยเร็ว</p>

                <div className="bg-indigo-50 rounded-2xl p-7 w-full max-w-md mb-6 flex flex-col items-center text-center border border-indigo-100">
                    <p className="text-base text-slate-600 mb-1 font-medium">เลขที่เคส</p>
                    <p className="text-xl font-bold text-slate-900 mb-5">{result.caseNo}</p>

                    <p className="text-base text-slate-600 mb-2 font-medium">รหัสติดตาม (Tracking Code)</p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-3xl font-mono font-bold text-indigo-600 tracking-widest">
                            {result.trackingCode}
                        </span>
                        <button
                            onClick={handleCopy}
                            className="p-2.5 rounded-xl hover:bg-indigo-100 transition-colors"
                            title="คัดลอก"
                        >
                            <Copy className="w-6 h-6 text-indigo-500" />
                        </button>
                    </div>
                    {copied && <p className="text-green-600 text-base mt-2 font-semibold">คัดลอกแล้ว!</p>}
                </div>

                <div className="w-full max-w-md mb-6 bg-amber-50 border-2 border-amber-400 rounded-2xl px-5 py-4 flex items-start gap-4 shadow-sm animate-pulse-slow">
                    <span className="text-3xl mt-0.5 shrink-0">⚠️</span>
                    <p className="text-base font-semibold text-amber-800 leading-relaxed text-left">
                        <span className="block text-amber-900 font-bold mb-1 text-lg">กรุณาจดรหัสติดตามไว้!</span>
                        คุณจำเป็นต้องใช้รหัสนี้เพื่อตรวจสอบสถานะเคสของคุณในภายหลัง
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md">
                    <a href="/track" className="btn-primary text-base py-4 flex-1 justify-center">
                        ติดตามสถานะ
                    </a>
                    <button onClick={() => { setResult(null); setErrors({}); }} className="btn-secondary text-base py-4 flex-1 justify-center">
                        แจ้งปัญหาใหม่
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 lg:space-y-12">
            {/* Contact Information */}
            <div className="bg-orange-50/40 p-6 md:p-8 lg:p-10 border border-orange-100 rounded-3xl shadow-sm">
                <div className="flex items-center gap-4 lg:gap-5 mb-8 lg:mb-10 pb-6 border-b border-orange-100/60">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <User className="w-6 h-6 lg:w-7 lg:h-7" />
                    </div>
                    <div>
                        <h4 className="text-xl lg:text-2xl font-extrabold text-slate-800">ข้อมูลผู้แจ้ง</h4>
                        <p className="text-base lg:text-lg text-slate-500 mt-1">ข้อมูลสำหรับการติดต่อกลับ</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 lg:gap-y-10">
                    {/* Full Name */}
                    <div className="group">
                        <label className="block text-base font-semibold text-slate-700 mb-2.5">
                            ชื่อ-นามสกุล <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input name="fullName" className="input-field bg-white focus:bg-white pl-[52px] text-base" placeholder="สมชาย ใจดี" required />
                        </div>
                        {errors.fullName && <p className="text-red-500 text-sm mt-2">{errors.fullName[0]}</p>}
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
                        {errors.phone && <p className="text-red-500 text-sm mt-2">{errors.phone[0]}</p>}
                    </div>

                    {/* Email */}
                    <div className="group">
                        <label className="block text-base font-semibold text-slate-700 mb-2.5">
                            Email <span className="text-slate-400 font-normal ml-1">(ไม่บังคับ)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input name="email" type="email" className="input-field bg-white focus:bg-white pl-[52px] text-base" placeholder="email@example.com" />
                        </div>
                        {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email[0]}</p>}
                    </div>

                    {/* Line ID */}
                    <div className="group">
                        <label className="block text-base font-semibold text-slate-700 mb-2.5">
                            Line ID <span className="text-slate-400 font-normal ml-1">(ไม่บังคับ)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <MessageSquare className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input name="lineId" className="input-field bg-white focus:bg-white pl-[52px] text-base" placeholder="@lineid" />
                        </div>
                        {errors.lineId && <p className="text-red-500 text-sm mt-2">{errors.lineId[0]}</p>}
                    </div>

                    {/* Address */}
                    <div className="group md:col-span-2">
                        <label className="block text-base font-semibold text-slate-700 mb-2.5">
                            ที่อยู่ <span className="text-slate-400 font-normal ml-1">(ไม่บังคับ)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute top-4 left-0 pl-5 flex items-start pointer-events-none">
                                <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <textarea name="address" className="input-field bg-white focus:bg-white pl-[52px] min-h-[110px] py-4 text-base" placeholder="บ้านเลขที่ หมู่ ซอย ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์..." />
                        </div>
                    </div>

                    {/* Hospital / Agency (Autocomplete) */}
                    <div className="group md:col-span-2">
                        <label className="block text-base font-semibold text-slate-700 mb-2.5">
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
            <div className="bg-orange-50/40 p-6 md:p-8 lg:p-10 border border-orange-100 rounded-3xl shadow-sm">
                <div className="flex items-center gap-4 lg:gap-5 mb-8 lg:mb-10 pb-6 border-b border-orange-100/60">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                        <FileText className="w-6 h-6 lg:w-7 lg:h-7" />
                    </div>
                    <div>
                        <h4 className="text-xl lg:text-2xl font-extrabold text-slate-800">รายละเอียดปัญหา</h4>
                        <p className="text-base lg:text-lg text-slate-500 mt-1">ข้อมูลของปัญหาที่ต้องการแจ้ง</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:gap-10">
                    {/* Category */}
                    <div className="group">
                        <label className="block text-base font-semibold text-slate-700 mb-2.5">
                            ประเภทปัญหา <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                                <List className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <select name="categoryId" className="input-field bg-white focus:bg-white pl-[52px] appearance-none text-base" required defaultValue="">
                                <option value="" disabled>-- เลือกประเภทปัญหา --</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                            </div>
                        </div>
                        {errors.categoryId && <p className="text-red-500 text-sm mt-2">{errors.categoryId[0]}</p>}
                    </div>

                    {/* Summary */}
                    <div className="group">
                        <label className="block text-base font-semibold text-slate-700 mb-2.5">
                            หัวข้อปัญหา <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Tag className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input name="problemSummary" className="input-field bg-white focus:bg-white pl-[52px] text-base" placeholder="สรุปปัญหาสั้นๆ ให้เข้าใจง่าย" required />
                        </div>
                        {errors.problemSummary && <p className="text-red-500 text-sm mt-2">{errors.problemSummary[0]}</p>}
                    </div>

                    {/* Description */}
                    <div className="group">
                        <label className="block text-base font-semibold text-slate-700 mb-2.5">
                            รายละเอียดเพิ่มเติม <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
                        </label>
                        <div className="relative">
                            <textarea name="description" className="input-field bg-white focus:bg-white p-5 min-h-[160px] leading-relaxed text-base" placeholder="อธิบายรายละเอียดของปัญหาเพิ่มเติม อาการแวดล้อม หรือข้อมูลอื่นๆ ที่เป็นประโยชน์ในการแก้ไขปัญหา..." />
                        </div>
                    </div>
                </div>

                {/* File Upload Section */}
                <div className="mt-8 border-t border-orange-100/60 pt-7">
                    <label className="block text-base font-semibold text-slate-700 mb-3">
                        แนบไฟล์หลักฐาน <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 hover:border-blue-500 transition-colors text-center bg-white">
                        <input
                            type="file"
                            id="case-file-upload"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <label htmlFor="case-file-upload" className="cursor-pointer flex flex-col items-center gap-1">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                                <Upload className="w-7 h-7 text-slate-400" />
                            </div>
                            <span className="text-slate-700 font-semibold text-base">
                                {file ? file.name : "คลิกเพื่อเลือกไฟล์ที่ต้องการแนบ"}
                            </span>
                            <span className="text-sm text-slate-500 mt-1">
                                รองรับไฟล์ .pdf, .jpg, .png, .csv ขนาดไม่เกิน 10MB
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Errors */}
            {errors._form && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3 animate-pulse-slow">
                    <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-red-800 text-base font-semibold">{errors._form[0]}</p>
                </div>
            )}

            {/* Submit */}
            <div className="pt-4 lg:pt-6">
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xl lg:text-2xl py-6 lg:py-8 px-6 rounded-3xl shadow-xl transition-all hover:scale-[1.01] hover:shadow-2xl flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? (
                        <>
                            <Loader2 className="w-8 h-8 lg:w-9 lg:h-9 animate-spin" />
                            <span>กำลังส่งข้อมูล...</span>
                        </>
                    ) : (
                        <>
                            <Send className="w-7 h-7 lg:w-8 lg:h-8" />
                            <span>ส่งแจ้งปัญหา</span>
                        </>
                    )}
                </button>
                <div className="mt-5 lg:mt-6 flex items-center justify-center gap-3 text-sm lg:text-base font-medium text-slate-500">
                    <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-green-500" />
                    ข้อมูลของคุณถูกส่งผ่านระบบเข้ารหัสอย่างปลอดภัย
                </div>
            </div>
        </form>
    );
}
