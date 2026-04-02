"use client";

import { useState, useEffect, useRef } from "react";
import { createCase } from "@/app/actions/case-actions";
import { getHospitals } from "@/app/actions/master-data-actions";
import { toast } from "react-hot-toast";
import {
    CheckCircle2, Copy, Loader2, User, Phone, Mail, MessageSquare,
    FileText, AlertCircle, MapPin, List, ChevronDown, Tag, Send,
    Upload, Hospital, Search, ArrowRight, ArrowLeft, ShieldAlert, MonitorPlay
} from "lucide-react";

interface Category {
    id: string;
    name: string;
}

// 🌟 THE FIX: ใส่ ! (important) เพื่อทะลวง CSS เดิม และขยาย Padding ซ้ายเป็น 72px เพื่อหลบไอคอนให้ขาด
const darkInputClass = "w-full bg-slate-900 border-2 border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none rounded-2xl text-white !pl-[72px] !pr-6 !py-5 text-xl font-medium transition-all placeholder:text-slate-500";

export function CreateCaseForm({ categories }: { categories: Category[] }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ trackingCode: string; caseNo: string } | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [copied, setCopied] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        fullName: "", phone: "", email: "", lineId: "", address: "",
        categoryId: "", problemSummary: "", description: "",
        technicalDetails: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "phone") {
            setFormData(prev => ({ ...prev, [name]: value.replace(/[^0-9]/g, '') }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const [hospitals, setHospitals] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedHospital, setSelectedHospital] = useState<any>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchingHosp, setSearchingHosp] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isDropdownOpen) return;
        const delay = setTimeout(async () => {
            setSearchingHosp(true);
            try {
                const res = await getHospitals(1, 10, searchQuery);
                setHospitals(res.data || []);
            } catch (e) { console.error(e); } finally { setSearchingHosp(false); }
        }, 300);
        return () => clearTimeout(delay);
    }, [searchQuery, isDropdownOpen]);

    const selectedCategoryName = categories.find(c => c.id === formData.categoryId)?.name || "";
    const isSecurityIssue = selectedCategoryName.includes("เจาะ") || selectedCategoryName.includes("แฮก") || selectedCategoryName.includes("ความปลอดภัย") || selectedCategoryName.includes("Hacking");

    const handleNext = () => {
        if (formRef.current && !formRef.current.reportValidity()) return;
        if (step < 3) setStep(prev => prev + 1);
    };

    const handlePrev = () => {
        setStep(prev => prev - 1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key === 'Enter') {
            const target = e.target as HTMLElement;
            if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;

            e.preventDefault();

            if (step < 3) {
                handleNext();
            } else {
                handleFinalSubmit();
            }
        }
    };

    const handleFinalSubmit = async () => {
        if (formRef.current && !formRef.current.reportValidity()) return;

        setLoading(true);
        setErrors({});

        let finalDescription = formData.description;
        if (isSecurityIssue && formData.technicalDetails.trim()) {
            finalDescription += `\n\n[ข้อมูลทางเทคนิคเพิ่มเติม]\n${formData.technicalDetails}`;
        }

        const input = {
            fullName: formData.fullName, phone: formData.phone, email: formData.email, lineId: formData.lineId,
            address: formData.address, hospitalId: selectedHospital ? selectedHospital.id : "",
            categoryId: formData.categoryId, problemSummary: formData.problemSummary, description: finalDescription,
        };

        const res = await createCase(input);

        if (res.success && res.trackingCode && res.caseNo) {
            toast.success("ส่งข้อมูลแจ้งปัญหาสำเร็จ!");
            if (file) {
                try {
                    const fd = new FormData();
                    fd.append("caseNo", res.caseNo); fd.append("phone", input.phone); fd.append("file", file);
                    await fetch("/api/upload-file", { method: "POST", body: fd });
                } catch (err) { console.error("Upload failed", err); }
            }
            setResult({ trackingCode: res.trackingCode, caseNo: res.caseNo });
        } else if (res.error) {
            toast.error("ส่งไม่สำเร็จ กรุณาตรวจสอบข้อมูล");
            setErrors(res.error as Record<string, string[]>);
        }
        setLoading(false);
    };

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
            <div className="text-center py-12 flex flex-col items-center animate-in zoom-in duration-500">
                <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center mb-8 shadow-sm">
                    <CheckCircle2 className="w-16 h-16 text-green-600" />
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-4">ส่งข้อมูลสำเร็จ!</h3>
                <p className="text-slate-600 text-2xl mb-10 w-full">เคสของคุณถูกสร้างเรียบร้อยแล้ว เจ้าหน้าที่จะดำเนินการโดยเร็ว</p>

                <div className="bg-[#eff2ff] rounded-3xl p-10 w-full max-w-xl mb-8 flex flex-col items-center text-center border-2 border-[#dce4ff] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <p className="text-xl text-slate-600 mb-2 font-bold">เลขที่เคส</p>
                    <p className="text-4xl font-black text-slate-900 mb-8">{result.caseNo}</p>

                    <p className="text-xl text-slate-600 mb-4 font-bold">รหัสติดตาม (Tracking Code)</p>
                    <div className="flex items-center justify-center gap-4">
                        <span className="text-5xl font-mono font-black text-indigo-700 tracking-widest bg-white px-8 py-4 rounded-2xl border-2 border-indigo-100 shadow-inner">
                            {result.trackingCode}
                        </span>
                        <button onClick={handleCopy} className="p-5 rounded-2xl hover:bg-indigo-200 bg-indigo-100 transition-colors shadow-sm" title="คัดลอก">
                            <Copy className="w-8 h-8 text-indigo-600" />
                        </button>
                    </div>
                    {copied && <p className="text-green-600 text-xl mt-5 font-bold">คัดลอกเรียบร้อย!</p>}
                </div>

                <div className="w-full max-w-xl mb-10 bg-red-50 border-2 border-red-400 rounded-3xl px-10 py-8 flex items-start gap-5 shadow-md animate-pulse">
                    <span className="text-5xl mt-1 shrink-0">🚨</span>
                    <div className="text-left">
                        <span className="block text-red-700 font-black mb-2 text-2xl">โปรดบันทึกรหัสติดตามไว้!</span>
                        <p className="text-xl font-semibold text-red-600/80 leading-relaxed">
                            รหัสนี้สำคัญมาก ใช้สำหรับตรวจสอบสถานะและส่งข้อมูลเพิ่มเติมให้เจ้าหน้าที่
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-5 w-full max-w-xl">
                    <a href="/track" className="bg-indigo-600 hover:bg-indigo-700 text-white text-2xl font-bold py-6 flex-1 justify-center rounded-2xl shadow-lg shadow-indigo-600/30 text-center transition-all flex items-center">
                        <span className="w-full">ติดตามสถานะเคส</span>
                    </a>
                    <button onClick={() => { window.location.reload(); }} className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-2xl font-bold py-6 flex-1 justify-center rounded-2xl transition-all">
                        แจ้งปัญหาใหม่
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            {/* --- Progress Bar (ขยายให้เด่นชัด) --- */}
            <div className="mb-16 mt-4 shrink-0 w-full px-4 sm:px-12">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-2.5 bg-slate-200 rounded-full -z-10"></div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2.5 bg-blue-600 rounded-full -z-10 transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>

                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex flex-col items-center gap-4">
                            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center font-black text-3xl sm:text-4xl transition-all duration-300 ${step >= s ? "bg-blue-600 text-white ring-8 ring-blue-50 shadow-xl" : "bg-white text-slate-400 border-4 border-slate-200"}`}>
                                {step > s ? <CheckCircle2 className="w-12 h-12" /> : s}
                            </div>
                            <span className={`text-xl sm:text-2xl font-bold hidden sm:block ${step >= s ? "text-blue-800" : "text-slate-400"}`}>
                                {s === 1 ? "ข้อมูลผู้แจ้ง" : s === 2 ? "รายละเอียด" : "ยืนยันข้อมูล"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <form ref={formRef} onSubmit={(e) => e.preventDefault()} onKeyDown={handleKeyDown} className="flex-grow flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-500 w-full pb-8">

                {/* ════ STEP 1: ข้อมูลผู้แจ้ง ════ */}
                {step === 1 && (
                    <div className="bg-slate-50 p-8 sm:p-12 border-2 border-slate-200 rounded-[3rem] shadow-sm flex-grow">
                        <div className="flex items-center gap-6 mb-12 pb-10 border-b-2 border-slate-200">
                            <div className="w-24 h-24 rounded-3xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <User className="w-12 h-12" />
                            </div>
                            <div>
                                <h4 className="text-4xl font-black text-slate-800">1. ข้อมูลผู้แจ้ง</h4>
                                <p className="text-2xl text-slate-500 font-medium mt-3">กรอกข้อมูลเพื่อให้เจ้าหน้าที่ติดต่อกลับ</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                            <div className="group">
                                <label className="block text-2xl font-bold text-slate-800 mb-4">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 w-[72px] flex items-center justify-center pointer-events-none"><User className="h-8 w-8 text-slate-500" /></div>
                                    <input name="fullName" value={formData.fullName} onChange={handleChange} className={darkInputClass} placeholder="เช่น สมชาย ใจดี" required />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-2xl font-bold text-slate-800 mb-4">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 w-[72px] flex items-center justify-center pointer-events-none"><Phone className="h-8 w-8 text-slate-500" /></div>
                                    <input name="phone" value={formData.phone} onChange={handleChange} maxLength={10} className={darkInputClass} placeholder="เช่น 0812345678" required />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-2xl font-bold text-slate-800 mb-4">อีเมล <span className="text-slate-400 font-normal ml-2">(ไม่บังคับ)</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 w-[72px] flex items-center justify-center pointer-events-none"><Mail className="h-8 w-8 text-slate-500" /></div>
                                    <input name="email" value={formData.email} onChange={handleChange} type="email" className={darkInputClass} placeholder="email@example.com" />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-2xl font-bold text-slate-800 mb-4">Line ID <span className="text-slate-400 font-normal ml-2">(ไม่บังคับ)</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 w-[72px] flex items-center justify-center pointer-events-none"><MessageSquare className="h-8 w-8 text-slate-500" /></div>
                                    <input name="lineId" value={formData.lineId} onChange={handleChange} className={darkInputClass} placeholder="เช่น @lineid" />
                                </div>
                            </div>

                            <div className="group md:col-span-2">
                                <label className="block text-2xl font-bold text-slate-800 mb-4">ที่อยู่ <span className="text-slate-400 font-normal ml-2">(ไม่บังคับ)</span></label>
                                <div className="relative">
                                    <div className="absolute top-0 left-0 w-[72px] h-[76px] flex items-center justify-center pointer-events-none"><MapPin className="h-8 w-8 text-slate-500" /></div>
                                    <textarea name="address" value={formData.address} onChange={handleChange} className={`${darkInputClass} !min-h-[160px]`} placeholder="บ้านเลขที่ หมู่ ซอย ถนน..." />
                                </div>
                            </div>

                            {/* Hospital Autocomplete (ขยายให้กว้างและกดง่าย) */}
                            <div className="group md:col-span-2">
                                <label className="block text-2xl font-bold text-slate-800 mb-4">
                                    หน่วยงาน / โรงพยาบาล <span className="text-slate-400 font-normal ml-2">(ถ้ามี)</span>
                                </label>
                                <div className="relative" ref={dropdownRef}>
                                    <div className="absolute top-0 left-0 w-[72px] h-[76px] flex items-center justify-center pointer-events-none">
                                        <Hospital className="h-8 w-8 text-slate-500" />
                                    </div>
                                    {selectedHospital ? (
                                        <div className={`${darkInputClass} flex items-center justify-between`}>
                                            <div className="truncate text-white font-bold">[{selectedHospital.code}] {selectedHospital.name}</div>
                                            <button type="button" onClick={() => { setSelectedHospital(null); setSearchQuery(""); setIsDropdownOpen(true); }} className="text-blue-400 hover:text-blue-300 text-xl font-bold px-6 py-2 bg-slate-800 rounded-xl border-2 border-slate-700 shadow-sm transition-colors">เปลี่ยนหน่วยงาน</button>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={e => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                                                onFocus={() => setIsDropdownOpen(true)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); } }}
                                                className={`${darkInputClass} !pr-20`}
                                                placeholder="พิมพ์ชื่อ, รหัส, หรือจังหวัด เพื่อค้นหา..."
                                            />
                                            <div className="absolute top-0 right-0 w-[72px] h-[76px] flex items-center justify-center pointer-events-none">
                                                {searchingHosp ? <Loader2 className="w-8 h-8 text-blue-500 animate-spin" /> : <Search className="w-8 h-8 text-slate-500" />}
                                            </div>
                                            {isDropdownOpen && (
                                                <div className="absolute z-20 w-full mt-2 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl max-h-96 overflow-y-auto">
                                                    {hospitals.length > 0 ? (
                                                        <ul className="py-3">
                                                            {hospitals.map(hosp => (
                                                                <li key={hosp.id} onClick={() => { setSelectedHospital(hosp); setIsDropdownOpen(false); }} className="px-8 py-6 hover:bg-slate-800 cursor-pointer border-b border-slate-800 last:border-0 transition-colors">
                                                                    <div className="font-bold text-white text-2xl">{hosp.name}</div>
                                                                    <div className="text-lg text-slate-400 mt-2">รหัส: {hosp.code} {hosp.province && `| จ.${hosp.province}`}</div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <div className="p-8 text-center text-xl text-slate-400 font-medium">{searchQuery ? "ไม่พบหน่วยงาน" : "พิมพ์ค้นหา..."}</div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════ STEP 2: รายละเอียดปัญหา ════ */}
                {step === 2 && (
                    <div className="bg-slate-50 p-8 sm:p-12 border-2 border-slate-200 rounded-[3rem] shadow-sm flex-grow">
                        <div className="flex items-center gap-6 mb-12 pb-10 border-b-2 border-slate-200">
                            <div className="w-24 h-24 rounded-3xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                <FileText className="w-12 h-12" />
                            </div>
                            <div>
                                <h4 className="text-4xl font-black text-slate-800">2. รายละเอียดปัญหา</h4>
                                <p className="text-2xl text-slate-500 font-medium mt-3">อธิบายอาการหรือปัญหาที่ท่านพบ</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-12">
                            <div className="group">
                                <label className="block text-2xl font-bold text-slate-800 mb-4">ประเภทปัญหา <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 w-[72px] flex items-center justify-center pointer-events-none z-10"><List className="h-8 w-8 text-slate-500" /></div>
                                    <select name="categoryId" value={formData.categoryId} onChange={handleChange} className={`${darkInputClass} appearance-none cursor-pointer`} required>
                                        <option value="" disabled className="text-slate-500">-- เลือกประเภทปัญหา --</option>
                                        {categories.map((c) => <option key={c.id} value={c.id} className="text-white bg-slate-900">{c.name}</option>)}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 w-[72px] flex items-center justify-center pointer-events-none"><ChevronDown className="h-8 w-8 text-slate-500" /></div>
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-2xl font-bold text-slate-800 mb-4">หัวข้อปัญหา <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 w-[72px] flex items-center justify-center pointer-events-none"><Tag className="h-8 w-8 text-slate-500" /></div>
                                    <input name="problemSummary" value={formData.problemSummary} onChange={handleChange} className={darkInputClass} placeholder="เช่น ไม่สามารถเข้าสู่ระบบได้" required />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-2xl font-bold text-slate-800 mb-4">รายละเอียดเพิ่มเติม <span className="text-slate-400 font-normal ml-2">(ถ้ามี)</span></label>
                                <div className="relative">
                                    <textarea name="description" value={formData.description} onChange={handleChange} className={`${darkInputClass} !min-h-[220px]`} placeholder="อธิบายรายละเอียด อาการ..." />
                                </div>
                            </div>

                            {/* --- CONDITIONAL LOGIC --- */}
                            {isSecurityIssue && (
                                <div className="bg-slate-900 border-2 border-slate-700 rounded-[2.5rem] p-10 animate-in zoom-in-95 duration-300 shadow-sm mt-4">
                                    <div className="flex items-start gap-6 mb-8">
                                        <ShieldAlert className="w-12 h-12 text-red-500 shrink-0" />
                                        <div>
                                            <h5 className="font-black text-white text-3xl mb-2">ข้อมูลทางเทคนิคสำหรับการสืบสวน</h5>
                                            <p className="text-xl text-slate-400 font-medium">กรุณาระบุข้อมูลทางเทคนิคเพื่อให้เจ้าหน้าที่ตรวจสอบได้เร็วขึ้น</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute top-0 left-0 w-[72px] h-[76px] flex items-center justify-center pointer-events-none">
                                            <MonitorPlay className="h-8 w-8 text-red-400" />
                                        </div>
                                        <textarea
                                            name="technicalDetails" value={formData.technicalDetails} onChange={handleChange}
                                            className="w-full bg-slate-800 border-2 border-slate-700 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none rounded-3xl text-white !pl-[72px] !pr-6 !py-5 text-xl font-mono transition-all placeholder:text-slate-500 min-h-[160px]"
                                            placeholder="เช่น IP Address ของผู้โจมตี, URL เว็บไซต์ปลอม..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ════ STEP 3: แนบไฟล์และยืนยัน ════ */}
                {step === 3 && (
                    <div className="bg-slate-50 p-8 sm:p-12 border-2 border-slate-200 rounded-[3rem] shadow-sm flex-grow">
                        <div className="flex items-center gap-6 mb-12 pb-10 border-b-2 border-slate-200">
                            <div className="w-24 h-24 rounded-3xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                <Upload className="w-12 h-12" />
                            </div>
                            <div>
                                <h4 className="text-4xl font-black text-slate-800">3. แนบหลักฐานและยืนยัน</h4>
                                <p className="text-2xl text-slate-500 font-medium mt-3">อัปโหลดรูปภาพหน้าจอ (ถ้ามี)</p>
                            </div>
                        </div>

                        <div className="border-4 border-dashed border-slate-300 hover:border-blue-500 rounded-[2.5rem] p-20 transition-colors text-center bg-white cursor-pointer relative group">
                            <input type="file" id="case-file-upload" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            <div className="flex flex-col items-center gap-6">
                                <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-colors ${file ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                                    {file ? <CheckCircle2 className="w-16 h-16" /> : <Upload className="w-16 h-16" />}
                                </div>
                                <span className={`font-black text-4xl ${file ? 'text-green-700' : 'text-slate-700'}`}>
                                    {file ? `ไฟล์ที่เลือก: ${file.name}` : "แตะเพื่อเลือกไฟล์แนบ"}
                                </span>
                                <span className="text-2xl text-slate-500 font-medium mt-2">รองรับไฟล์ .JPG, .PNG และ .PDF ไม่เกิน 10MB</span>
                            </div>
                            {file && (
                                <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }} className="mt-10 text-red-500 text-2xl font-bold hover:underline relative z-20 bg-red-50 px-10 py-4 rounded-full">
                                    ลบไฟล์นี้ทิ้ง
                                </button>
                            )}
                        </div>

                        <div className="mt-16 bg-white rounded-[2.5rem] p-12 border-2 border-slate-200">
                            <h5 className="font-black text-slate-800 text-3xl mb-8 border-b-2 border-slate-100 pb-6">สรุปข้อมูล</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 text-2xl">
                                <div><span className="text-slate-500 font-bold">ชื่อผู้แจ้ง:</span> <span className="font-black text-slate-800 ml-3">{formData.fullName}</span></div>
                                <div><span className="text-slate-500 font-bold">เบอร์ติดต่อ:</span> <span className="font-black text-slate-800 ml-3">{formData.phone}</span></div>
                                <div className="sm:col-span-2"><span className="text-slate-500 font-bold">ปัญหาที่พบ:</span> <span className="font-black text-blue-700 ml-3">{formData.problemSummary}</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 flex items-start gap-5 mt-10">
                        <AlertCircle className="w-10 h-10 text-red-600 shrink-0" />
                        <div>
                            <p className="text-red-900 text-2xl font-bold mb-3">ส่งข้อมูลไม่สำเร็จ:</p>
                            <ul className="list-disc pl-8 text-red-800 text-xl font-medium space-y-2">
                                {Object.values(errors).map((errs, i) => (
                                    <li key={i}>{Array.isArray(errs) ? errs.join(", ") : errs}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* --- ปุ่มควบคุมด้านล่าง --- */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-12 gap-8 shrink-0">
                    {step > 1 ? (
                        <button type="button" onClick={handlePrev} className="w-full sm:w-auto px-16 py-7 rounded-3xl font-black text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors flex items-center justify-center gap-4 text-2xl">
                            <ArrowLeft className="w-8 h-8" /> ย้อนกลับ
                        </button>
                    ) : (
                        <div className="hidden sm:block"></div>
                    )}

                    {step < 3 ? (
                        <button type="button" onClick={handleNext} className="w-full sm:w-auto px-20 py-7 rounded-3xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all flex items-center justify-center gap-4 text-3xl">
                            ถัดไป <ArrowRight className="w-10 h-10" />
                        </button>
                    ) : (
                        <button type="button" onClick={handleFinalSubmit} disabled={loading} className="w-full sm:flex-1 sm:max-w-xl bg-green-600 hover:bg-green-700 text-white font-black text-3xl py-7 px-12 rounded-3xl shadow-2xl transition-all flex items-center justify-center gap-5 disabled:opacity-70 disabled:cursor-not-allowed">
                            {loading ? <><Loader2 className="w-10 h-10 animate-spin" /> <span>กำลังส่ง...</span></> : <><Send className="w-10 h-10" /> <span>ยืนยันการส่งข้อมูล</span></>}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}