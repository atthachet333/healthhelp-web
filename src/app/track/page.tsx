"use client";

import { useState, useRef, useEffect } from "react";
import { getCaseByTracking, getCasesByPhone, submitCSAT, addPublicCaseUpdate } from "@/app/actions/case-actions";
import Link from "next/link";
import imageCompression from "browser-image-compression"; // 👈 นำเข้าไลบรารีบีบอัดรูป
import {
    Search,
    HeartPulse,
    Clock,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    MessageCircle,
    User,
    Star,
    Loader2,
    Phone,
    FileText,
    Paperclip,
    X,
    ImageIcon,
    Send,
    RefreshCw, // 👈 เพิ่มไอคอน Refresh
} from "lucide-react";
import { getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor, formatDateTime } from "@/lib/utils";
import { toast } from "react-hot-toast";

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
            <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-xl font-bold transition-colors"
            >
                ✕
            </button>
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

    // 🌟 ส่วนที่เพิ่มใหม่: สำหรับเลื่อนแชทลงล่างสุดอัตโนมัติ
    const chatContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [caseData]);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!searchValue.trim()) {
            setError("กรุณากรอกข้อมูลเพื่อค้นหา");
            return;
        }

        setLoading(true);
        setError("");
        setCaseData(null);
        setCasesList([]);
        setReplyNote("");
        setReplyFiles([]);

        try {
            if (searchType === "tracking") {
                const data = await getCaseByTracking(searchValue.trim());
                if (data) {
                    setCaseData(data);
                } else {
                    setError("ไม่พบข้อมูลเคส กรุณาตรวจสอบรหัสติดตามอีกครั้ง");
                }
            } else {
                const data = await getCasesByPhone(searchValue.trim());
                if (data.length > 0) {
                    setCasesList(data);
                } else {
                    setError("ไม่พบข้อมูลเคสที่ผูกกับเบอร์โทรศัพท์นี้");
                }
            }
        } catch (err) {
            setError("เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง");
        } finally {
            setLoading(false);
        }
    }

    async function handleSelectCase(trackingCode: string) {
        setSearchType("tracking");
        setSearchValue(trackingCode);
        setCasesList([]);
        setLoading(true);
        try {
            const data = await getCaseByTracking(trackingCode);
            if (data) setCaseData(data);
        } catch (err) {
            setError("เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmitReply() {
        if (!replyNote.trim() && replyFiles.length === 0) return;
        setSubmittingReply(true);
        setError("");

        let uploadedAttachments: any[] = [];

        if (replyFiles.length > 0) {
            setUploadingFiles(true);
            try {
                for (const file of replyFiles) {
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("caseNo", caseData.caseNo);
                    formData.append("phone", caseData.reporter.phone);

                    const uploadRes = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                    });

                    if (!uploadRes.ok) {
                        const errorData = await uploadRes.json();
                        throw new Error(errorData.error || "Upload failed");
                    }

                    const uploadData = await uploadRes.json();

                    uploadedAttachments.push({
                        fileUrl: uploadData.fileUrl,
                        fileName: file.name,
                        fileType: file.type
                    });
                }
            } catch (err: any) {
                console.error("Upload error:", err);
                toast.error("อัปโหลดไฟล์ไม่สำเร็จ: " + err.message);
                setUploadingFiles(false);
                setSubmittingReply(false);
                return;
            }
            setUploadingFiles(false);
        }

        const res = await addPublicCaseUpdate(caseData.trackingCode, replyNote, uploadedAttachments);
        if (res.success) {
            toast.success("ส่งข้อความสำเร็จ");
            setReplyNote("");
            setReplyFiles([]);
            const updated = await getCaseByTracking(caseData.trackingCode);
            setCaseData(updated);
        } else {
            toast.error(res.error || "เกิดข้อผิดพลาดในการส่งข้อความ");
        }
        setSubmittingReply(false);
    }

    async function handleSubmitCSAT() {
        if (csatScore === 0) {
            setError("กรุณาให้คะแนนความพึงพอใจ");
            return;
        }
        setSubmittingCSAT(true);
        setError("");

        const res = await submitCSAT(caseData.trackingCode, { score: csatScore, comment: csatComment });
        if (res.success) {
            toast.success("ขอบคุณสำหรับคำประเมิน เคสนี้ถูกปิดสมบูรณ์แล้ว");
            const updated = await getCaseByTracking(caseData.trackingCode);
            setCaseData(updated);
        } else {
            toast.error(res.error || "เกิดข้อผิดพลาด");
        }
        setSubmittingCSAT(false);
    }

    function removeFile(index: number) {
        setReplyFiles(prev => prev.filter((_, i) => i !== index));
    }

    function getActionIcon(actionType: string) {
        switch (actionType) {
            case "SYSTEM": return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
            case "STATUS_CHANGE": return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            case "COMMENT": return <MessageCircle className="w-4 h-4 text-indigo-500" />;
            default: return <Clock className="w-4 h-4 text-slate-400" />;
        }
    }

    const needsCSAT =
        caseData &&
        (caseData.status === "RESOLVED" || caseData.status === "CLOSED") &&
        !caseData.csatRating;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="w-full max-w-screen-2xl mx-auto px-6 sm:px-10 py-5 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                            <HeartPulse className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tight">
                            HealthHelp
                        </span>
                    </Link>
                    <Link href="/" className="text-lg font-semibold text-slate-500 hover:text-indigo-600 transition-colors hidden sm:block">
                        กลับหน้าหลัก
                    </Link>
                </div>
            </header>

            <main className="flex-1 w-full px-6 sm:px-10 py-10 flex flex-col items-center">
                {lightboxSrc && (
                    <ImageLightbox
                        src={lightboxSrc}
                        alt="รูปขยาย"
                        onClose={() => setLightboxSrc(null)}
                    />
                )}

                <div className="text-center mb-10 w-full max-w-7xl">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">ติดตามสถานะการแจ้งปัญหา</h1>
                    <p className="text-slate-500 text-xl sm:text-2xl">ตรวจสอบความคืบหน้า ให้ข้อมูลเพิ่มเติม หรือประเมินผลการให้บริการ</p>
                </div>

                <div className="w-full max-w-7xl">
                    {/* Search Form */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 sm:p-10 border border-slate-100 mb-10">
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                            <button
                                type="button"
                                onClick={() => { setSearchType("tracking"); setSearchValue(""); setError(""); setCaseData(null); setCasesList([]); }}
                                className={`flex-1 py-4 px-4 rounded-xl text-lg font-bold transition-all duration-200 ${searchType === "tracking" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                ค้นหาด้วยรหัสติดตาม
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSearchType("phone"); setSearchValue(""); setError(""); setCaseData(null); setCasesList([]); }}
                                className={`flex-1 py-4 px-4 rounded-xl text-lg font-bold transition-all duration-200 ${searchType === "phone" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                ค้นหาด้วยเบอร์โทร
                            </button>
                        </div>

                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    placeholder={searchType === "tracking" ? "เช่น a1b2c3d4" : "เช่น 0812345678"}
                                    className="w-full pl-14 pr-4 py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 text-lg font-medium placeholder:font-normal"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl text-lg font-bold transition-all active:scale-95 flex items-center justify-center min-w-[160px] shadow-lg shadow-indigo-600/30 disabled:opacity-70 disabled:active:scale-100"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "ค้นหาเลย"}
                            </button>
                        </form>
                    </div>{/* end search card */}

                    {/* Quick-info strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
                        {[
                            { icon: "🔍", title: "ค้นหาด้วยรหัส", desc: "ใช้รหัสติดตามที่ได้รับทาง SMS หลังแจ้งปัญหา" },
                            { icon: "📱", title: "ค้นหาด้วยเบอร์โทร", desc: "ใช้เบอร์โทรที่กรอกตอนแจ้งปัญหาเพื่อดูทุกเคส" },
                            { icon: "🕐", title: "ตอบกลับใน 24 ชม.", desc: "ติดตามสถานะได้ตลอด 24 ชั่วโมง ทุกวัน" },
                        ].map((item, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex items-start gap-4">
                                <span className="text-3xl shrink-0">{item.icon}</span>
                                <div>
                                    <p className="text-slate-800 font-bold text-lg leading-tight">{item.title}</p>
                                    <p className="text-slate-500 text-base mt-1 leading-snug">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="mt-5 p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600 text-lg font-medium animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-6 h-6 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Search Results (Phone) */}
                    {casesList.length > 0 && !caseData && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Search className="w-5 h-5 text-indigo-600" />
                                พบ {casesList.length} รายการที่เชื่อมโยงกับเบอร์นี้
                            </h3>
                            <div className="space-y-4">
                                {casesList.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleSelectCase(c.trackingCode)}
                                        className="w-full text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-mono font-bold text-indigo-700">{c.caseNo}</span>
                                                <span className={`badge ${getStatusColor(c.status)} text-xs`}>{getStatusLabel(c.status)}</span>
                                            </div>
                                            <h4 className="font-semibold text-slate-800 line-clamp-1">{c.problemSummary}</h4>
                                            <p className="text-sm text-slate-500 mt-1">{formatDateTime(c.createdAt)} • {c.category.name}</p>
                                        </div>
                                        <ArrowLeft className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all rotate-180 hidden sm:block" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Case Detail */}
                {caseData && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-5 w-full">

                        {/* ── Top bar: Case No + Status ── */}
                        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div>
                                        <p className="text-base font-bold tracking-widest text-indigo-500 uppercase mb-1">เลขที่เคส</p>
                                        <h2 className="text-6xl font-black text-slate-900 font-mono tracking-tight">{caseData.caseNo}</h2>
                                    </div>
                                    <button
                                        onClick={() => handleSelectCase(caseData.trackingCode)}
                                        disabled={loading}
                                        className="p-2.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors mt-2"
                                        title="อัปเดตสถานะล่าสุด"
                                    >
                                        <RefreshCw className={`w-6 h-6 ${loading ? "animate-spin text-indigo-600" : ""}`} />
                                    </button>
                                    <span className={`px-6 py-2.5 rounded-full text-lg font-bold border ${getStatusColor(caseData.status)}`}>
                                        {getStatusLabel(caseData.status)}
                                    </span>
                                    {needsCSAT && (
                                        <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-200 animate-pulse">
                                            ⭐ รอการประเมินจากท่าน
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-500">อัปเดตล่าสุด</p>
                                    <p className="text-base font-bold text-slate-700">{formatDateTime(caseData.updatedAt)}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── 3-Column Layout ── */}
                        <div className="flex flex-col xl:flex-row gap-5 items-start min-w-0">

                            {/* ════ LEFT: Case Details ════ */}
                            <div className="w-full xl:w-[440px] shrink-0 space-y-4">

                                {/* Meta Info */}
                                <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6">
                                    <p className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-5">ข้อมูลเคส</p>
                                    <div className="space-y-1">
                                        <div className="flex items-start gap-4 py-4 border-b border-slate-100">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0"><span className="text-xl">📋</span></div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-400 mb-0.5">ประเภท</p>
                                                <p className="font-bold text-slate-800 text-lg">{caseData.category.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 py-4 border-b border-slate-100">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0"><span className="text-xl">⚡</span></div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-400 mb-1">ความเร่งด่วน</p>
                                                <span className={`inline-block px-4 py-1.5 rounded-lg text-base font-bold ${getPriorityColor(caseData.priority)}`}>
                                                    {getPriorityLabel(caseData.priority)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 py-4 border-b border-slate-100">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><span className="text-xl">📅</span></div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-400 mb-0.5">วันที่แจ้ง</p>
                                                <p className="font-bold text-slate-800 text-base">{formatDateTime(caseData.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 py-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                                                <User className="w-5 h-5 text-purple-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-400 mb-0.5">ผู้รับผิดชอบ</p>
                                                {caseData.assignee
                                                    ? <p className="font-bold text-slate-800 text-base">{caseData.assignee.fullName}</p>
                                                    : <p className="text-slate-400 italic text-base">อยู่ระหว่างมอบหมาย</p>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Problem Summary */}
                                <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6">
                                    <p className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-4">หัวข้อปัญหา</p>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug">{caseData.problemSummary}</h3>
                                    <p className="text-slate-600 text-base leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                                        {caseData.description || <span className="text-slate-400 italic">ไม่มีรายละเอียดเพิ่มเติม</span>}
                                    </p>
                                </div>

                                {/* CSAT Form */}
                                {needsCSAT && (
                                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-200 shadow-lg shadow-amber-100">
                                        <h3 className="text-base font-bold text-amber-900 mb-1 flex items-center gap-2">
                                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                            ประเมินความพึงพอใจ
                                        </h3>
                                        <p className="text-amber-800 text-xs mb-4">เคสนี้ได้รับการแก้ไขแล้ว กรุณาให้คะแนนเพื่อปิดเคสสมบูรณ์</p>
                                        <div className="flex flex-col items-center mb-4">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                {[1, 2, 3, 4, 5].map((score) => (
                                                    <button key={score} onClick={() => setCsatScore(score)}
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl transition-all ${csatScore >= score ? "bg-amber-400 text-white shadow-md scale-110" : "bg-white text-slate-300 hover:bg-amber-100"}`}>★</button>
                                                ))}
                                            </div>
                                            <p className="text-xs font-bold text-amber-700">{csatScore === 0 ? "แตะดาวเพื่อให้คะแนน" : csatScore === 5 ? "ยอดเยี่ยมมาก!" : csatScore >= 3 ? "ดี" : "ต้องปรับปรุง"}</p>
                                        </div>
                                        <textarea value={csatComment} onChange={(e) => setCsatComment(e.target.value)}
                                            placeholder="ข้อเสนอแนะเพิ่มเติม (ถ้ามี)..."
                                            className="w-full p-3 rounded-2xl border border-amber-200 bg-white outline-none resize-none min-h-[80px] mb-3 text-sm" />
                                        <button onClick={handleSubmitCSAT} disabled={csatScore === 0 || submittingCSAT}
                                            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center text-sm">
                                            {submittingCSAT ? <Loader2 className="w-4 h-4 animate-spin" /> : "ส่งคำประเมินและปิดเคส"}
                                        </button>
                                    </div>
                                )}

                                {/* CSAT Display */}
                                {caseData.csatRating && (
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-5 border border-emerald-200 shadow-sm">
                                        <h3 className="text-base font-bold text-emerald-900 mb-1 flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />เคสนี้ปิดสมบูรณ์แล้ว
                                        </h3>
                                        <p className="text-emerald-700 text-xs mb-3">ขอบคุณที่ใช้บริการ HealthHelp</p>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <span key={s} className={`text-xl ${s <= caseData.csatRating.score ? "text-amber-400" : "text-slate-200"}`}>★</span>
                                            ))}
                                        </div>
                                        {caseData.csatRating.comment && (
                                            <p className="text-xs italic text-slate-500 mt-2">"{caseData.csatRating.comment}"</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ════ CENTER: Chat ════ */}
                            <div className="flex-1 min-w-0 bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col" style={{ minHeight: "75vh" }}>
                                <div className="bg-slate-800 px-5 py-4 shrink-0 flex items-center gap-3">
                                    <MessageCircle className="w-5 h-5 text-indigo-400" />
                                    <h3 className="text-base font-bold text-white">การสนทนากับเจ้าหน้าที่</h3>
                                </div>

                                {/* Messages */}
                                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-slate-50/50 custom-scrollbar">
                                    {caseData.updates.filter((u: any) => u.actionType === "COMMENT" && u.isPublic).length === 0 && (
                                        <div className="flex-1 flex items-center justify-center py-16 text-slate-400 text-sm italic">ยังไม่มีข้อความ</div>
                                    )}
                                    {caseData.updates.filter((u: any) => u.actionType === "COMMENT" && u.isPublic).map((u: any) => {
                                        const isAdminReply = u.user !== null;
                                        if (!isAdminReply) {
                                            return (
                                                <div key={u.id} className="flex justify-end mb-4 group">
                                                    <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end">
                                                        <div className="flex items-center gap-2 mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-xs font-semibold text-slate-500">{formatDateTime(u.createdAt)}</span>
                                                            <span className="text-sm font-bold text-indigo-700">คุณ</span>
                                                        </div>
                                                        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md shadow-indigo-600/20">
                                                            {u.note && <p className="text-sm leading-relaxed">{u.note}</p>}
                                                            {u.attachments?.length > 0 && (
                                                                <div className="mt-2 flex flex-col gap-2 items-end">
                                                                    {u.attachments.map((file: any, idx: number) => (
                                                                        <div key={idx}>
                                                                            {file.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)
                                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                                ? <img src={file.fileUrl} alt={file.fileName} className="max-w-[180px] max-h-[180px] object-cover rounded-xl cursor-zoom-in border-2 border-indigo-400/30" onClick={() => setLightboxSrc(file.fileUrl)} />
                                                                                : <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs bg-indigo-700 text-white px-3 py-2 rounded-xl border border-indigo-500"><FileText className="w-3.5 h-3.5" />{file.fileName}</a>
                                                                            }
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={u.id} className="flex justify-start mb-4 group">
                                                <div className="max-w-[85%] sm:max-w-[75%]">
                                                    <div className="flex items-center gap-2 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                                                            <User className="w-3.5 h-3.5 text-white" />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-800">เจ้าหน้าที่: <span className="font-normal text-slate-600">{u.user.fullName}</span></span>
                                                        <span className="text-xs text-slate-400">{formatDateTime(u.createdAt)}</span>
                                                    </div>
                                                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm ml-8">
                                                        {u.note && <p className="text-sm leading-relaxed text-slate-800">{u.note}</p>}
                                                        {u.attachments?.length > 0 && (
                                                            <div className="mt-2 flex flex-col gap-2">
                                                                {u.attachments.map((file: any, idx: number) => (
                                                                    <div key={idx}>
                                                                        {file.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)
                                                                            // eslint-disable-next-line @next/next/no-img-element
                                                                            ? <img src={file.fileUrl} alt={file.fileName} className="max-w-[180px] max-h-[180px] object-cover rounded-xl cursor-zoom-in border border-slate-200" onClick={() => setLightboxSrc(file.fileUrl)} />
                                                                            : <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs bg-slate-50 text-indigo-700 px-3 py-2 rounded-xl border border-slate-200"><FileText className="w-3.5 h-3.5 text-indigo-500" />{file.fileName}</a>
                                                                        }
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Chat Input */}
                                {caseData.status !== "CLOSED" && (
                                    <div className="bg-gradient-to-b from-indigo-50 to-white border-t-2 border-indigo-200 p-4 shrink-0">
                                        <div className="flex gap-3 mb-3">
                                            <textarea
                                                value={replyNote}
                                                onChange={(e) => setReplyNote(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if ((replyNote.trim() || replyFiles.length > 0) && !submittingReply && !uploadingFiles) handleSubmitReply(); } }}
                                                placeholder="พิมพ์ข้อความตอบกลับเจ้าหน้าที่..."
                                                className="flex-1 bg-white border-2 border-indigo-300 rounded-2xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 outline-none transition-all resize-none min-h-[56px] text-base text-slate-800 placeholder:text-slate-400 custom-scrollbar shadow-sm"
                                                rows={1}
                                            />
                                            <button onClick={handleSubmitReply}
                                                disabled={(!replyNote.trim() && replyFiles.length === 0) || submittingReply || uploadingFiles}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-2xl font-bold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center min-w-[56px]">
                                                {submittingReply ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {replyFiles.length > 0 && (
                                            <div className="mb-3 flex flex-wrap gap-2 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                                {replyFiles.map((f, i) => (
                                                    <div key={i} className="relative group">
                                                        {f.type.startsWith("image/")
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            ? <img src={URL.createObjectURL(f)} alt={f.name} className="w-14 h-14 object-cover rounded-xl border-2 border-white shadow-sm" />
                                                            : <div className="w-14 h-14 bg-white rounded-xl border border-indigo-200 flex flex-col items-center justify-center gap-1 p-1"><FileText className="w-4 h-4 text-indigo-400" /><span className="text-[9px] text-slate-500 truncate w-full text-center">{f.name}</span></div>
                                                        }
                                                        <button type="button" onClick={() => removeFile(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <label className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-sm font-bold select-none ${uploadingFiles ? "border-indigo-300 bg-indigo-50 text-indigo-400 pointer-events-none" : "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-600"}`}>
                                            {uploadingFiles ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังประมวลผลไฟล์...</> : <><Paperclip className="w-4 h-4" /> แนบรูป / ไฟล์ <span className="text-slate-400 font-normal text-xs">(jpg, png, pdf)</span></>}
                                            <input type="file" multiple className="hidden" disabled={uploadingFiles}
                                                onChange={async (e) => {
                                                    if (!e.target.files || e.target.files.length === 0) return;
                                                    const files = Array.from(e.target.files); e.target.value = "";
                                                    setUploadingFiles(true);
                                                    const hasImage = files.some(f => f.type.startsWith("image/"));
                                                    const toastId = hasImage ? toast.loading("กำลังบีบอัดรูปภาพให้เล็กลง...") : undefined;
                                                    const validFiles = files.filter(file => {
                                                        if (file.size > 10 * 1024 * 1024) { toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน 10MB`); return false; }
                                                        const ok = file.type.startsWith("image/") || file.type === "application/pdf";
                                                        if (!ok) { toast.error(`อนุญาตเฉพาะรูปภาพและ PDF (${file.name})`); return false; }
                                                        return true;
                                                    });
                                                    if (validFiles.length > 0) {
                                                        const opts = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
                                                        const processed = await Promise.all(validFiles.map(async (file: File) => {
                                                            if (file.type.startsWith("image/")) { try { const b = await imageCompression(file, opts); return new File([b], file.name, { type: b.type }); } catch { return file; } }
                                                            return file;
                                                        }));
                                                        setReplyFiles((prev: File[]) => [...prev, ...processed]);
                                                    }
                                                    if (toastId) toast.dismiss(toastId);
                                                    setUploadingFiles(false);
                                                }} />
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* ════ RIGHT: Timeline ════ */}
                            <div className="w-full xl:w-[360px] shrink-0">
                                <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-5 sticky top-24">
                                    <p className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> ไทม์ไลน์สถานะ
                                    </p>
                                    <div className="relative">
                                        {caseData.updates.filter((u: any) => u.actionType === "SYSTEM" || u.actionType === "STATUS_CHANGE").length === 0 && (
                                            <p className="text-slate-400 text-base italic text-center py-6">ยังไม่มีการเปลี่ยนแปลงสถานะ</p>
                                        )}
                                        {caseData.updates.filter((u: any) => u.actionType === "SYSTEM" || u.actionType === "STATUS_CHANGE").map((u: any, idx: number, arr: any[]) => {
                                            const isLast = idx === arr.length - 1;
                                            return (
                                                <div key={u.id} className="flex gap-3 relative">
                                                    {!isLast && <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-100" />}
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 mt-0.5 ${isLast ? "bg-indigo-600 shadow-md shadow-indigo-500/30" : "bg-slate-100"}`}>
                                                        {u.actionType === "STATUS_CHANGE"
                                                            ? <AlertCircle className={`w-4 h-4 ${isLast ? "text-white" : "text-amber-500"}`} />
                                                            : <CheckCircle2 className={`w-4 h-4 ${isLast ? "text-white" : "text-blue-400"}`} />
                                                        }
                                                    </div>
                                                    <div className="flex-1 pb-5">
                                                        <p className={`text-sm font-bold leading-tight ${isLast ? "text-indigo-700" : "text-slate-700"}`}>
                                                            {u.actionType === "STATUS_CHANGE"
                                                                ? <span>เปลี่ยนเป็น <span className="text-slate-900">{getStatusLabel(u.newValue)}</span></span>
                                                                : u.note
                                                            }
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(u.createdAt)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                        </div>{/* end 3-col */}
                    </div>
                )}
            </main>
        </div>
    );
}