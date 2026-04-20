"use client";

import { useState, useRef, useEffect } from "react";
import { getCaseByTracking, getCasesByPhone, submitCSAT, addPublicCaseUpdate } from "@/app/actions/case-actions";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import {
    Search, HeartPulse, Clock, ArrowLeft, CheckCircle2, AlertCircle,
    MessageCircle, User, Star, Loader2, Phone, FileText, Paperclip,
    X, Send, RefreshCw, Activity, ShieldCheck, ArrowRight, List, Download
} from "lucide-react";
import { getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor, formatDateTime } from "@/lib/utils";
import { toast } from "react-hot-toast";

// อัปเกรด: เพิ่มปุ่ม Download ในหน้าต่าง Preview รูปภาพ
function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200" onClick={onClose}>
            <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
                <a href={src} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors shadow-lg" title="ดาวน์โหลดไฟล์">
                    <Download className="w-6 h-6" />
                </a>
                <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-2xl font-bold transition-colors">✕</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl relative z-40" onClick={(e) => e.stopPropagation()} />
        </div>
    );
}

export default function TrackPage() {
    const [searchType, setSearchType] = useState<"tracking" | "phone">("tracking");
    const [searchValue, setSearchValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [caseData, setCaseData] = useState<any | null>(null);
    const [casesList, setCasesList] = useState<any[]>([]);
    const [error, setError] = useState("");

    const [replyNote, setReplyNote] = useState("");
    const [replyFiles, setReplyFiles] = useState<File[]>([]);
    const [submittingReply, setSubmittingReply] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    const [csatScore, setCsatScore] = useState(0);
    const [csatComment, setCsatComment] = useState("");
    const [submittingCSAT, setSubmittingCSAT] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }, [caseData]);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!searchValue.trim()) { setError("กรุณากรอกข้อมูลเพื่อค้นหา"); return; }
        setLoading(true); setError(""); setCaseData(null); setCasesList([]); setReplyNote(""); setReplyFiles([]);
        try {
            if (searchType === "tracking") {
                const data = await getCaseByTracking(searchValue.trim());
                if (data) setCaseData(data); else setError("ไม่พบข้อมูลเคส กรุณาตรวจสอบรหัสติดตามอีกครั้ง");
            } else {
                const data = await getCasesByPhone(searchValue.trim());
                if (data.length > 0) setCasesList(data); else setError("ไม่พบข้อมูลเคสที่ผูกกับเบอร์โทรศัพท์นี้");
            }
        } catch (err) { setError("เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง"); } finally { setLoading(false); }
    }

    async function handleSelectCase(trackingCode: string) {
        setSearchType("tracking"); setSearchValue(trackingCode); setCasesList([]); setLoading(true);
        try {
            const data = await getCaseByTracking(trackingCode);
            if (data) setCaseData(data);
        } catch (err) { setError("เกิดข้อผิดพลาด"); } finally { setLoading(false); }
    }

    async function handleSubmitReply() {
        if (!replyNote.trim() && replyFiles.length === 0) return;
        setSubmittingReply(true); setError("");
        let uploadedAttachments: any[] = [];
        if (replyFiles.length > 0) {
            setUploadingFiles(true);
            try {
                for (const file of replyFiles) {
                    const formData = new FormData();
                    formData.append("file", file); formData.append("caseNo", caseData.caseNo); formData.append("phone", caseData.reporter.phone);
                    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                    if (!uploadRes.ok) throw new Error((await uploadRes.json()).error || "Upload failed");
                    const uploadData = await uploadRes.json();
                    uploadedAttachments.push({ fileUrl: uploadData.fileUrl, fileName: file.name, fileType: file.type });
                }
            } catch (err: any) {
                toast.error("อัปโหลดไฟล์ไม่สำเร็จ: " + err.message);
                setUploadingFiles(false); setSubmittingReply(false); return;
            }
            setUploadingFiles(false);
        }
        const res = await addPublicCaseUpdate(caseData.trackingCode, replyNote, uploadedAttachments);
        if (res.success) {
            toast.success("ส่งข้อความสำเร็จ"); setReplyNote(""); setReplyFiles([]);
            const updated = await getCaseByTracking(caseData.trackingCode); setCaseData(updated);
        } else { toast.error(res.error || "เกิดข้อผิดพลาดในการส่งข้อความ"); }
        setSubmittingReply(false);
    }

    async function handleSubmitCSAT() {
        if (csatScore === 0) { setError("กรุณาให้คะแนนความพึงพอใจ"); return; }
        setSubmittingCSAT(true); setError("");
        const res = await submitCSAT(caseData.trackingCode, { score: csatScore, comment: csatComment });
        if (res.success) {
            toast.success("ขอบคุณสำหรับคำประเมิน เคสนี้ถูกปิดสมบูรณ์แล้ว");
            const updated = await getCaseByTracking(caseData.trackingCode); setCaseData(updated);
        } else { toast.error(res.error || "เกิดข้อผิดพลาด"); }
        setSubmittingCSAT(false);
    }

    function removeFile(index: number) { setReplyFiles(prev => prev.filter((_, i) => i !== index)); }

    const needsCSAT = caseData && (caseData.status === "RESOLVED" || caseData.status === "CLOSED") && !caseData.csatRating;

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc] w-full font-sans selection:bg-blue-500 selection:text-white">
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm px-6 lg:px-12 py-4 w-full">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-4 text-slate-500 hover:text-blue-600 transition-colors group">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors"><ArrowLeft className="w-6 h-6" /></div>
                        <span className="font-bold text-lg hidden sm:block">กลับหน้าหลัก</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30"><Activity className="w-8 h-8 text-white" /></div>
                        <span className="font-black text-3xl text-slate-900 tracking-tighter">Track Status</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">
                        <ShieldCheck className="w-6 h-6 text-emerald-500" /><span className="hidden sm:block">Secure Tracking</span>
                    </div>
                </div>
            </header>

            {/* อัปเกรด: ตัด padding-bottom ทิ้ง เพื่อให้ขอบแชทชนขอบล่างจอ */}
            <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 pt-8 pb-0 flex flex-col items-center">
                {lightboxSrc && <ImageLightbox src={lightboxSrc} alt="รูปขยาย" onClose={() => setLightboxSrc(null)} />}
                {!caseData && (
                    <div className="w-full max-w-5xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
                        <div className="text-center w-full mb-12 mt-10">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-6">ติดตามสถานะเคส</h1>
                            <p className="text-slate-500 text-xl lg:text-2xl font-medium">ตรวจสอบความคืบหน้า และสนทนากับทีมวิศวกรได้ตลอดเวลา</p>
                        </div>
                        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-8 sm:p-14 border border-slate-100 w-full mb-12">
                            <div className="flex bg-slate-100 p-2 rounded-[2rem] mb-10">
                                <button type="button" onClick={() => { setSearchType("tracking"); setSearchValue(""); setError(""); setCaseData(null); setCasesList([]); }}
                                    className={`flex-1 py-4 px-6 rounded-3xl text-xl font-bold transition-all duration-200 ${searchType === "tracking" ? "bg-white text-indigo-700 shadow-md" : "text-slate-500 hover:text-slate-700"}`}>ค้นหาด้วยรหัสติดตาม</button>
                                <button type="button" onClick={() => { setSearchType("phone"); setSearchValue(""); setError(""); setCaseData(null); setCasesList([]); }}
                                    className={`flex-1 py-4 px-6 rounded-3xl text-xl font-bold transition-all duration-200 ${searchType === "phone" ? "bg-white text-indigo-700 shadow-md" : "text-slate-500 hover:text-slate-700"}`}>ค้นหาด้วยเบอร์โทร</button>
                            </div>
                            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-5">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 w-20 flex items-center justify-center pointer-events-none"><Search className="h-8 w-8 text-slate-400" /></div>
                                    <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder={searchType === "tracking" ? "เช่น TRK-12345678" : "เช่น 0812345678"}
                                        className="w-full pl-20 pr-6 py-6 bg-slate-50 border-2 border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 text-2xl font-black placeholder:font-medium placeholder:text-slate-400 tracking-wider" />
                                </div>
                                <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-6 rounded-3xl text-2xl font-black transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center disabled:opacity-70">
                                    {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : "ค้นหาข้อมูล"}
                                </button>
                            </form>
                        </div>
                        {error && (
                            <div className="mb-10 p-6 bg-red-50 border-2 border-red-200 rounded-3xl flex items-center justify-center gap-4 text-red-700 text-xl font-bold w-full shadow-sm"><AlertCircle className="w-8 h-8 shrink-0" />{error}</div>
                        )}
                        {casesList.length > 0 && !caseData && (
                            <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-500">
                                <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3"><Search className="w-8 h-8 text-indigo-600" />พบ {casesList.length} รายการที่เชื่อมโยงกับเบอร์นี้</h3>
                                <div className="space-y-5 w-full">
                                    {casesList.map((c) => (
                                        <button key={c.id} onClick={() => handleSelectCase(c.trackingCode)} className="w-full text-left bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div>
                                                <div className="flex items-center gap-4 mb-3">
                                                    <span className="font-mono font-black text-2xl text-indigo-700 bg-indigo-50 px-4 py-1.5 rounded-xl">{c.caseNo}</span>
                                                    <span className={`px-4 py-1.5 rounded-xl text-sm font-bold border ${getStatusColor(c.status)}`}>{getStatusLabel(c.status)}</span>
                                                </div>
                                                <h4 className="font-black text-slate-800 text-xl line-clamp-1">{c.problemSummary}</h4>
                                                <p className="text-base font-medium text-slate-500 mt-2 flex items-center gap-2"><Clock className="w-4 h-4" /> {formatDateTime(c.createdAt)} <span className="mx-2">•</span> {c.category.name}</p>
                                            </div>
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors hidden md:flex"><ArrowRight className="w-7 h-7" /></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {caseData && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 flex flex-col w-full max-w-[1600px] mx-auto h-[calc(100vh-90px)]">
                        {/* ── Top bar ── */}
                        <div className="bg-white rounded-[2rem] shadow-md border border-slate-100 relative overflow-hidden shrink-0 mb-6 z-10">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                            <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <h2 className="text-4xl font-black text-slate-900 font-mono tracking-tight">{caseData.caseNo}</h2>
                                    <button onClick={() => handleSelectCase(caseData.trackingCode)} disabled={loading} className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors border border-slate-200">
                                        <RefreshCw className={`w-6 h-6 ${loading ? "animate-spin text-indigo-600" : ""}`} />
                                    </button>
                                    <span className={`px-6 py-2.5 rounded-xl text-lg font-bold border-2 shadow-sm ${getStatusColor(caseData.status)}`}>{getStatusLabel(caseData.status)}</span>
                                </div>
                                <div className="text-left md:text-right bg-slate-50 px-5 py-3 rounded-xl border border-slate-100">
                                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-400" /> อัปเดต: {formatDateTime(caseData.updatedAt)}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── 3-Column Layout ── */}
                        <div className="flex flex-col xl:flex-row gap-6 items-stretch w-full flex-1 min-h-0">

                            {/* ════ LEFT: Case Details ════ */}
                            <div className="w-full xl:w-[360px] 2xl:w-[400px] shrink-0 space-y-6 overflow-y-auto custom-scrollbar pb-6 pr-2">
                                <div className="bg-white rounded-[2rem] shadow-md border border-slate-100 p-6">
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 border-b-2 border-slate-50 pb-3">ข้อมูลเคส</p>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-4 py-3 border-b border-slate-50">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0"><List className="w-6 h-6 text-indigo-500" /></div>
                                            <div><p className="text-xs font-bold text-slate-400 mb-0.5">ประเภท</p><p className="font-black text-slate-800 text-lg">{caseData.category.name}</p></div>
                                        </div>
                                        <div className="flex items-center gap-4 py-3 border-b border-slate-50">
                                            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0"><AlertCircle className="w-6 h-6 text-orange-500" /></div>
                                            <div><p className="text-xs font-bold text-slate-400 mb-1">ความเร่งด่วน</p><span className={`inline-block px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm ${getPriorityColor(caseData.priority)}`}>{getPriorityLabel(caseData.priority)}</span></div>
                                        </div>
                                        <div className="flex items-center gap-4 py-3 border-b border-slate-50">
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><Clock className="w-6 h-6 text-blue-500" /></div>
                                            <div><p className="text-xs font-bold text-slate-400 mb-0.5">วันที่แจ้ง</p><p className="font-black text-slate-800 text-base">{formatDateTime(caseData.createdAt)}</p></div>
                                        </div>
                                        <div className="flex items-center gap-4 py-3">
                                            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0"><User className="w-6 h-6 text-purple-500" /></div>
                                            <div><p className="text-xs font-bold text-slate-400 mb-0.5">ผู้รับผิดชอบ</p>{caseData.assignee ? <p className="font-black text-slate-800 text-lg">{caseData.assignee.fullName}</p> : <p className="text-slate-400 italic text-base font-medium">รอการมอบหมาย</p>}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-[2rem] shadow-md border border-slate-100 p-6">
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 border-b-2 border-slate-50 pb-3">หัวข้อปัญหา</p>
                                    <h3 className="text-xl font-black text-slate-900 mb-3 leading-snug">{caseData.problemSummary}</h3>
                                    <p className="text-slate-600 text-base font-medium leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100 whitespace-pre-wrap">{caseData.description || <span className="text-slate-400 italic">ไม่มีรายละเอียดเพิ่มเติม</span>}</p>
                                </div>
                            </div>

                            {/* ════ CENTER: Chat Area (ขยายกว้างและแนบติดขอบล่าง) ════ */}
                            <div className="flex-1 w-full bg-white rounded-t-[2.5rem] xl:rounded-t-[2.5rem] xl:rounded-b-none shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-x border-t border-slate-200 overflow-hidden flex flex-col h-full z-20">
                                <div className="bg-slate-900 px-8 py-4 shrink-0 flex items-center gap-4 shadow-md z-10">
                                    <MessageCircle className="w-6 h-6 text-indigo-400" /><h3 className="text-lg font-black text-white tracking-wide">การสนทนากับเจ้าหน้าที่</h3>
                                </div>

                                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-slate-50/50 custom-scrollbar">
                                    {caseData.updates.filter((u: any) => u.actionType === "COMMENT" && u.isPublic).length === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400"><MessageCircle className="w-16 h-16 mb-4 opacity-20" /><p className="text-lg font-bold italic">ยังไม่มีข้อความสนทนา</p></div>
                                    )}
                                    {caseData.updates.filter((u: any) => u.actionType === "COMMENT" && u.isPublic).map((u: any) => {
                                        if (!u.user) {
                                            return (
                                                <div key={u.id} className="flex justify-end mb-6 group animate-in fade-in slide-in-from-right-4">
                                                    <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end">
                                                        <div className="flex items-center gap-3 mb-2 opacity-60 group-hover:opacity-100 transition-opacity"><span className="text-sm font-bold text-slate-500">{formatDateTime(u.createdAt)}</span><span className="text-base font-black text-indigo-700 bg-indigo-100 px-3 py-1 rounded-lg">คุณ</span></div>
                                                        <div className="bg-indigo-600 text-white rounded-3xl rounded-tr-md px-6 py-4 shadow-lg shadow-indigo-600/20 border border-indigo-500">
                                                            {u.note && <p className="text-lg font-medium leading-relaxed">{u.note}</p>}
                                                            {u.attachments?.length > 0 && (
                                                                <div className="mt-4 flex flex-col gap-3 items-end">
                                                                    {u.attachments.map((file: any, idx: number) => {
                                                                        const safeUrl = `/api/view-file?url=${encodeURIComponent(file.fileUrl)}`;
                                                                        const downloadUrl = `/api/view-file?url=${encodeURIComponent(file.fileUrl)}&dl=true`;
                                                                        return (
                                                                            <div key={idx}>
                                                                                {file.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                                                    <div className="relative group/img inline-block">
                                                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                                        <img src={safeUrl} alt={file.fileName} className="max-w-[300px] max-h-[300px] object-cover rounded-2xl cursor-zoom-in border-4 border-indigo-400/30 hover:border-indigo-300 transition-colors" onClick={() => setLightboxSrc(safeUrl)} />
                                                                                        <a href={downloadUrl} className="absolute top-3 right-3 w-10 h-10 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all backdrop-blur-sm shadow-md" title="ดาวน์โหลดรูปภาพ">
                                                                                            <Download className="w-5 h-5" />
                                                                                        </a>
                                                                                    </div>
                                                                                ) : (
                                                                                    // 💡 แก้ไขตรงนี้: เปลี่ยนมาใช้ safeUrl และ target="_blank" เพื่อให้เบราว์เซอร์เปิดพรีวิว PDF
                                                                                    <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-bold bg-indigo-800 text-white px-5 py-3 rounded-2xl hover:bg-indigo-900 transition-colors shadow-sm" title="เปิดพรีวิวไฟล์">
                                                                                        <FileText className="w-5 h-5 shrink-0" />
                                                                                        <span className="truncate max-w-[200px]">{file.fileName}</span>
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={u.id} className="flex justify-start mb-6 group animate-in fade-in slide-in-from-left-4">
                                                <div className="max-w-[85%] sm:max-w-[75%]">
                                                    <div className="flex items-center gap-3 mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shadow-md"><User className="w-4 h-4 text-white" /></div>
                                                        <span className="text-base font-black text-slate-800">เจ้าหน้าที่: <span className="font-bold text-slate-600">{u.user.fullName}</span></span>
                                                        <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">{formatDateTime(u.createdAt)}</span>
                                                    </div>
                                                    <div className="bg-white border-2 border-slate-100 rounded-3xl rounded-tl-md px-6 py-4 shadow-md ml-11">
                                                        {u.note && <p className="text-lg font-medium leading-relaxed text-slate-800">{u.note}</p>}
                                                        {u.attachments?.length > 0 && (
                                                            <div className="mt-4 flex flex-col gap-3">
                                                                {u.attachments.map((file: any, idx: number) => {
                                                                    const safeUrl = `/api/view-file?url=${encodeURIComponent(file.fileUrl)}`;
                                                                    const downloadUrl = `/api/view-file?url=${encodeURIComponent(file.fileUrl)}&dl=true`;
                                                                    return (
                                                                        <div key={idx}>
                                                                            {file.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                                                <div className="relative group/img inline-block">
                                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                                    <img src={safeUrl} alt={file.fileName} className="max-w-[300px] max-h-[300px] object-cover rounded-2xl cursor-zoom-in border-4 border-slate-100 hover:border-slate-300 transition-colors" onClick={() => setLightboxSrc(safeUrl)} />
                                                                                    <a href={downloadUrl} className="absolute top-3 right-3 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all backdrop-blur-sm shadow-md" title="ดาวน์โหลดรูปภาพ">
                                                                                        <Download className="w-5 h-5" />
                                                                                    </a>
                                                                                </div>
                                                                            ) : (
                                                                                // 💡 แก้ไขตรงนี้: เปลี่ยนมาใช้ safeUrl และ target="_blank" เพื่อเปิดพรีวิว PDF
                                                                                <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-bold bg-slate-50 text-indigo-700 px-5 py-3 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm" title="เปิดพรีวิวไฟล์">
                                                                                    <FileText className="w-5 h-5 shrink-0 text-indigo-500" />
                                                                                    <span className="truncate max-w-[200px]">{file.fileName}</span>
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* ── ช่องพิมพ์แชทด้านล่าง ── */}
                                {caseData.status !== "CLOSED" && (
                                    <div className="bg-gradient-to-b from-indigo-50/50 to-white border-t border-indigo-100 p-6 sm:p-10 shrink-0 pb-10">
                                        <div className="flex flex-col sm:flex-row gap-5 mb-5">
                                            <textarea
                                                value={replyNote}
                                                onChange={(e) => setReplyNote(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if ((replyNote.trim() || replyFiles.length > 0) && !submittingReply && !uploadingFiles) handleSubmitReply(); } }}
                                                placeholder="พิมพ์ข้อความตอบกลับเจ้าหน้าที่ที่นี่..."
                                                className="flex-1 bg-white border-2 border-indigo-200 rounded-[2rem] py-5 px-8 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none min-h-[140px] text-xl font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal custom-scrollbar shadow-sm"
                                                rows={4}
                                            />
                                            <button
                                                onClick={handleSubmitReply}
                                                disabled={(!replyNote.trim() && replyFiles.length === 0) || submittingReply || uploadingFiles}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-5 rounded-[2rem] font-black text-2xl transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50 flex flex-col items-center justify-center sm:min-w-[140px] gap-2"
                                            >
                                                {submittingReply ? <Loader2 className="w-10 h-10 animate-spin" /> : <><Send className="w-10 h-10 hidden sm:block" /> ส่ง</>}
                                            </button>
                                        </div>
                                        {replyFiles.length > 0 && (
                                            <div className="mb-5 flex flex-wrap gap-4 p-5 bg-white rounded-[2rem] border-2 border-indigo-50 shadow-sm">
                                                {replyFiles.map((f, i) => (
                                                    <div key={i} className="relative group">
                                                        {f.type.startsWith("image/") ? <img src={URL.createObjectURL(f)} alt={f.name} className="w-24 h-24 object-cover rounded-2xl border-2 border-slate-200 shadow-sm" /> : <div className="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-indigo-100 flex flex-col items-center justify-center gap-2 p-3"><FileText className="w-8 h-8 text-indigo-400" /><span className="text-xs font-bold text-slate-500 truncate w-full text-center">{f.name}</span></div>}
                                                        <button type="button" onClick={() => removeFile(i)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 shadow-xl"><X className="w-5 h-5" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <label className={`flex items-center justify-center gap-3 w-full py-5 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all text-lg font-bold select-none ${uploadingFiles ? "border-indigo-300 bg-indigo-50 text-indigo-500 pointer-events-none" : "border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 text-slate-500"}`}>
                                            {uploadingFiles ? <><Loader2 className="w-6 h-6 animate-spin" /> กำลังประมวลผลไฟล์...</> : <><Paperclip className="w-6 h-6" /> แนบรูปภาพ / เอกสารเพิ่มเติม <span className="text-slate-400 font-normal text-base ml-2">(JPG, PNG, PDF)</span></>}
                                            <input type="file" multiple className="hidden" disabled={uploadingFiles} onChange={async (e) => {
                                                if (!e.target.files || e.target.files.length === 0) return;
                                                const files = Array.from(e.target.files); e.target.value = ""; setUploadingFiles(true);
                                                const validFiles = files.filter(file => { if (file.size > 10 * 1024 * 1024) { toast.error(`ไฟล์ใหญ่เกินไป`); return false; } return true; });
                                                if (validFiles.length > 0) setReplyFiles((prev: File[]) => [...prev, ...validFiles]);
                                                setUploadingFiles(false);
                                            }} />
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* ════ RIGHT: Timeline ════ */}
                            <div className="w-full xl:w-[320px] 2xl:w-[340px] shrink-0 overflow-y-auto custom-scrollbar pb-6 pl-2">
                                <div className="bg-white rounded-[2rem] shadow-md border border-slate-100 p-6">
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3 border-b-2 border-slate-50 pb-3"><Clock className="w-5 h-5" /> ไทม์ไลน์สถานะ</p>
                                    <div className="relative pl-2">
                                        {caseData.updates.filter((u: any) => u.actionType === "SYSTEM" || u.actionType === "STATUS_CHANGE").map((u: any, idx: number, arr: any[]) => {
                                            const isLast = idx === arr.length - 1;
                                            return (
                                                <div key={u.id} className="flex gap-4 relative">
                                                    {!isLast && <div className="absolute left-4 top-8 bottom-[-10px] w-0.5 bg-slate-200" />}
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 mt-1 ${isLast ? "bg-indigo-600 shadow-lg shadow-indigo-500/40 border-2 border-white ring-4 ring-indigo-50" : "bg-slate-100 border-2 border-white"}`}>
                                                        {u.actionType === "STATUS_CHANGE" ? <AlertCircle className={`w-4 h-4 ${isLast ? "text-white" : "text-amber-500"}`} /> : <CheckCircle2 className={`w-4 h-4 ${isLast ? "text-white" : "text-blue-500"}`} />}
                                                    </div>
                                                    <div className="flex-1 pb-8">
                                                        <p className={`text-sm font-bold leading-snug ${isLast ? "text-indigo-800" : "text-slate-700"}`}>{u.actionType === "STATUS_CHANGE" ? <span>เปลี่ยนเป็น <span className="text-slate-900 font-black">{getStatusLabel(u.newValue)}</span></span> : u.note}</p>
                                                        <p className={`text-xs font-bold mt-1.5 ${isLast ? "text-indigo-400" : "text-slate-400"}`}>{formatDateTime(u.createdAt)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}