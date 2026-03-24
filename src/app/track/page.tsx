"use client";

import { useState } from "react";
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
                <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                            <HeartPulse className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tight">
                            HealthHelp
                        </span>
                    </Link>
                    <Link href="/" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors hidden sm:block">
                        กลับหน้าหลัก
                    </Link>
                </div>
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {lightboxSrc && (
                    <ImageLightbox
                        src={lightboxSrc}
                        alt="รูปขยาย"
                        onClose={() => setLightboxSrc(null)}
                    />
                )}

                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">ติดตามสถานะการแจ้งปัญหา</h1>
                    <p className="text-slate-500 text-lg">ตรวจสอบความคืบหน้า ให้ข้อมูลเพิ่มเติม หรือประเมินผลการให้บริการ</p>
                </div>

                <div className="max-w-2xl mx-auto">
                    {/* Search Form */}
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-slate-100 mb-8">
                        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
                            <button
                                type="button"
                                onClick={() => { setSearchType("tracking"); setSearchValue(""); setError(""); setCaseData(null); setCasesList([]); }}
                                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${searchType === "tracking" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                ค้นหาด้วยรหัสติดตาม
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSearchType("phone"); setSearchValue(""); setError(""); setCaseData(null); setCasesList([]); }}
                                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${searchType === "phone" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                ค้นหาด้วยเบอร์โทร
                            </button>
                        </div>

                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    placeholder={searchType === "tracking" ? "เช่น a1b2c3d4" : "เช่น 0812345678"}
                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium placeholder:font-normal"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all active:scale-95 flex items-center justify-center min-w-[140px] shadow-lg shadow-indigo-600/30 disabled:opacity-70 disabled:active:scale-100"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ค้นหาเลย"}
                            </button>
                        </form>

                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}
                    </div>

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
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                            <div className="p-6 sm:p-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b border-slate-100">
                                    <div>
                                        <p className="text-sm font-bold tracking-widest text-indigo-600 mb-1 uppercase">เลขที่เคส</p>
                                        <h2 className="text-3xl font-black text-slate-900 font-mono tracking-tight">{caseData.caseNo}</h2>
                                    </div>
                                    <div className="flex flex-col items-start sm:items-end gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${getStatusColor(caseData.status).replace('bg-opacity-10', 'bg-opacity-20')} border`}>
                                                {getStatusLabel(caseData.status)}
                                            </span>
                                        </div>
                                        {needsCSAT && (
                                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 animate-pulse">
                                                รอการประเมินจากท่าน
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500 mb-1">ประเภท</p>
                                        <p className="font-bold text-slate-800">{caseData.category.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500 mb-1">ความเร่งด่วน</p>
                                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${getPriorityColor(caseData.priority)}`}>
                                            {getPriorityLabel(caseData.priority)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500 mb-1">วันที่แจ้ง</p>
                                        <p className="font-medium text-slate-800 text-sm">{formatDateTime(caseData.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500 mb-1">ผู้รับผิดชอบ</p>
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                                            {caseData.assignee ? (
                                                <><User className="w-4 h-4 text-indigo-500" /> {caseData.assignee.fullName}</>
                                            ) : (
                                                <span className="text-slate-400 italic">อยู่ระหว่างมอบหมาย</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-100">
                                    <p className="text-sm font-bold text-indigo-600 mb-2">หัวข้อปัญหา</p>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{caseData.problemSummary}</h3>
                                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                                        {caseData.description || <span className="text-slate-400 italic">ไม่มีรายละเอียดเพิ่มเติม</span>}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CSAT Form */}
                        {needsCSAT && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-lg shadow-amber-100">
                                <h3 className="text-xl font-bold text-amber-900 mb-2 flex items-center gap-2">
                                    <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                                    ประเมินความพึงพอใจ
                                </h3>
                                <p className="text-amber-800 text-sm mb-6">เคสนี้ได้รับการแก้ไขแล้ว กรุณาให้คะแนนเพื่อปิดเคสสมบูรณ์</p>

                                <div className="flex flex-col items-center mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        {[1, 2, 3, 4, 5].map((score) => (
                                            <button
                                                key={score}
                                                onClick={() => setCsatScore(score)}
                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${csatScore >= score ? "bg-amber-400 text-white shadow-md scale-110" : "bg-white text-slate-300 hover:bg-amber-100"}`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-sm font-bold text-amber-700">{csatScore === 0 ? "แตะดาวเพื่อให้คะแนน" : csatScore === 5 ? "ยอดเยี่ยมมาก!" : csatScore >= 3 ? "ดี" : "ต้องปรับปรุง"}</p>
                                </div>

                                <textarea
                                    value={csatComment}
                                    onChange={(e) => setCsatComment(e.target.value)}
                                    placeholder="ข้อเสนอแนะเพิ่มเติม (ถ้ามี)..."
                                    className="w-full p-4 rounded-2xl border border-amber-200 bg-white focus:ring-4 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all resize-none min-h-[100px] mb-4 text-sm"
                                />

                                <button
                                    onClick={handleSubmitCSAT}
                                    disabled={csatScore === 0 || submittingCSAT}
                                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50 flex items-center justify-center"
                                >
                                    {submittingCSAT ? <Loader2 className="w-5 h-5 animate-spin" /> : "ส่งคำประเมินและปิดเคส"}
                                </button>
                            </div>
                        )}

                        {/* CSAT Display */}
                        {caseData.csatRating && (
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-center gap-6 justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-emerald-900 mb-1 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        เคสนี้ปิดสมบูรณ์แล้ว
                                    </h3>
                                    <p className="text-emerald-700 text-sm">ขอบคุณที่ใช้บริการ HealthHelp</p>
                                </div>
                                <div className="flex flex-col items-center bg-white py-3 px-6 rounded-2xl shadow-sm border border-emerald-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">คะแนนของคุณ</p>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <span key={s} className={`text-2xl ${s <= caseData.csatRating.score ? "text-amber-400 drop-shadow-sm" : "text-slate-200"}`}>★</span>
                                        ))}
                                    </div>
                                    {caseData.csatRating.comment && (
                                        <p className="text-sm italic text-slate-500 mt-2 max-w-[200px] truncate">&ldquo;{caseData.csatRating.comment}&rdquo;</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Chat / Timeline Container */}
                        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                            {/* Header Chat */}
                            <div className="bg-slate-800 p-4 shrink-0 flex items-center gap-3">
                                <Clock className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-lg font-bold text-white tracking-wide">การสนทนาและไทม์ไลน์</h3>
                            </div>

                            {/* Timeline Messages Area (Scrollable) */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
                                {caseData.updates.filter((u: any) => u.actionType === "SYSTEM" || u.actionType === "STATUS_CHANGE" || (u.actionType === "COMMENT" && u.isPublic)).map((u: any) => {
                                    const isSystem = u.actionType !== "COMMENT";
                                    const isAdminReply = u.user !== null;

                                    // System Message
                                    if (isSystem) {
                                        return (
                                            <div key={u.id} className="flex justify-center my-6">
                                                <div className="bg-white border border-slate-200 text-slate-500 shadow-sm rounded-full px-5 py-2 text-xs font-medium flex items-center gap-2 transition-transform hover:scale-105">
                                                    {getActionIcon(u.actionType)}
                                                    {u.actionType === "STATUS_CHANGE" ? (
                                                        <span>เปลี่ยนสถานะจาก <b>{getStatusLabel(u.oldValue)}</b> เป็น <b className="text-slate-700">{getStatusLabel(u.newValue)}</b></span>
                                                    ) : (
                                                        <span>{u.note}</span>
                                                    )}
                                                    <span className="text-slate-400 ml-1">• {formatDateTime(u.createdAt)}</span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // User Reply (Right side)
                                    if (!isAdminReply) {
                                        return (
                                            <div key={u.id} className="flex justify-end mb-4 group">
                                                <div className="max-w-[85%] sm:max-w-[70%] flex flex-col items-end">
                                                    <div className="flex items-center gap-2 mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-xs font-semibold text-slate-500">{formatDateTime(u.createdAt)}</span>
                                                        <span className="text-sm font-bold text-indigo-700">คุณ</span>
                                                    </div>
                                                    <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-md shadow-indigo-600/20">
                                                        {u.note && <p className="text-[15px] leading-relaxed">{u.note}</p>}
                                                        {u.attachments && u.attachments.length > 0 && (
                                                            <div className="mt-3 flex flex-col gap-2 items-end">
                                                                {u.attachments.map((file: any, idx: number) => (
                                                                    <div key={idx} className="relative w-fit">
                                                                        {file.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                                            // eslint-disable-next-line @next/next/no-img-element
                                                                            <img
                                                                                src={file.fileUrl}
                                                                                alt={file.fileName}
                                                                                className="max-w-[200px] max-h-[200px] object-cover rounded-xl shadow-sm border-2 border-indigo-400/30 cursor-zoom-in hover:opacity-90 transition-all active:scale-95"
                                                                                onClick={() => setLightboxSrc(file.fileUrl)}
                                                                            />
                                                                        ) : (
                                                                            <a
                                                                                href={file.fileUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex items-center gap-2 text-xs bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2.5 rounded-xl border border-indigo-500 transition-colors w-fit shadow-sm"
                                                                            >
                                                                                <FileText className="w-4 h-4 shrink-0 text-indigo-300" />
                                                                                <span className="truncate max-w-[200px]">{file.fileName}</span>
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Admin Reply (Left side)
                                    return (
                                        <div key={u.id} className="flex justify-start mb-4 group">
                                            <div className="max-w-[85%] sm:max-w-[70%]">
                                                <div className="flex items-center gap-2 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                                                        <User className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800">
                                                        เจ้าหน้าที่: <span className="text-slate-600">{u.user.fullName}</span>
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-400">{formatDateTime(u.createdAt)}</span>
                                                </div>
                                                <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm ml-8">
                                                    {u.note && <p className="text-[15px] leading-relaxed">{u.note}</p>}
                                                    {u.attachments && u.attachments.length > 0 && (
                                                        <div className="mt-3 flex flex-col gap-2">
                                                            {u.attachments.map((file: any, idx: number) => (
                                                                <div key={idx} className="relative w-fit">
                                                                    {file.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img
                                                                            src={file.fileUrl}
                                                                            alt={file.fileName}
                                                                            className="max-w-[200px] max-h-[200px] object-cover rounded-xl shadow-sm border border-slate-200 cursor-zoom-in hover:opacity-90 transition-all active:scale-95"
                                                                            onClick={() => setLightboxSrc(file.fileUrl)}
                                                                        />
                                                                    ) : (
                                                                        <a
                                                                            href={file.fileUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-2 text-xs bg-slate-50 hover:bg-slate-100 text-indigo-700 px-4 py-2.5 rounded-xl border border-slate-200 transition-colors w-fit shadow-sm"
                                                                        >
                                                                            <FileText className="w-4 h-4 shrink-0 text-indigo-500" />
                                                                            <span className="truncate max-w-[200px] font-medium">{file.fileName}</span>
                                                                        </a>
                                                                    )}
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

                            {/* Chat Input Area (Fixed at bottom) */}
                            {caseData.status !== "CLOSED" && (
                                <div className="bg-white border-t border-indigo-100 p-4 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                                    <div className="flex items-center gap-2 mb-3 px-2">
                                        <MessageCircle className="w-4 h-4 text-indigo-600" />
                                        <h4 className="text-sm font-bold text-indigo-900 tracking-wide">ตอบกลับ / ให้ข้อมูลเพิ่มเติม</h4>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1 relative">
                                            <textarea
                                                value={replyNote}
                                                onChange={(e) => setReplyNote(e.target.value)}
                                                placeholder="พิมพ์ข้อความตอบกลับเจ้าหน้าที่..."
                                                className="w-full bg-slate-50 border-2 border-indigo-100 rounded-2xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all resize-none min-h-[56px] text-[15px] placeholder:text-slate-400 custom-scrollbar"
                                                rows={1}
                                            />
                                        </div>
                                        <button
                                            onClick={handleSubmitReply}
                                            disabled={(!replyNote.trim() && replyFiles.length === 0) || submittingReply || uploadingFiles}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px] h-14 sm:h-auto"
                                        >
                                            {submittingReply ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> ส่ง</>}
                                        </button>
                                    </div>

                                    {/* Preview selected files */}
                                    {replyFiles.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                            {replyFiles.map((f, i) => (
                                                <div key={i} className="relative group">
                                                    {f.type.startsWith("image/") ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={URL.createObjectURL(f)}
                                                            alt={f.name}
                                                            className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 bg-white rounded-xl border border-indigo-200 shadow-sm flex flex-col items-center justify-center gap-1.5 p-1">
                                                            <FileText className="w-5 h-5 text-indigo-400" />
                                                            <span className="text-[9px] text-slate-500 px-1 text-center w-full truncate font-medium">{f.name}</span>
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(i)}
                                                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-500 hover:scale-110"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* 🛑 เพิ่มระบบบีบอัดรูปภาพตรงนี้ (User Track Page) */}
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="w-full flex items-center">
                                            <div className="flex-1 border-t border-slate-200"></div>
                                            <span className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">หรือแนบรูป / ไฟล์</span>
                                            <div className="flex-1 border-t border-slate-200"></div>
                                        </div>
                                    </div>

                                    <label className={`mt-3 flex items-center justify-center gap-2 w-full py-3.5 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-sm font-bold select-none ${uploadingFiles
                                            ? "border-indigo-300 bg-indigo-50 text-indigo-400 pointer-events-none"
                                            : "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-600 hover:shadow-inner"
                                        }`}>
                                        {uploadingFiles ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> กำลังประมวลผลไฟล์...</>
                                        ) : (
                                            <><Paperclip className="w-4 h-4" /> แนบรูป / ไฟล์ <span className="text-slate-400 font-normal ml-1 text-xs">(รองรับ .jpg, .png, .pdf)</span></>
                                        )}
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            disabled={uploadingFiles}
                                            onChange={async (e) => {
                                                if (!e.target.files || e.target.files.length === 0) return;

                                                const files = Array.from(e.target.files);
                                                e.target.value = "";

                                                setUploadingFiles(true);
                                                const hasImage = files.some(f => f.type.startsWith("image/"));
                                                const toastId = hasImage ? toast.loading("กำลังบีบอัดรูปภาพให้เล็กลง...") : undefined;

                                                const validFiles = files.filter(file => {
                                                    if (file.size > 10 * 1024 * 1024) {
                                                        toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน 10MB`);
                                                        return false;
                                                    }
                                                    const isValidType = file.type.startsWith("image/") || file.type === "application/pdf";
                                                    if (!isValidType) {
                                                        toast.error(`อนุญาตเฉพาะไฟล์รูปภาพและ PDF เท่านั้น (${file.name})`);
                                                        return false;
                                                    }
                                                    return true;
                                                });

                                                if (validFiles.length > 0) {
                                                    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
                                                    const processedFiles = await Promise.all(
                                                        validFiles.map(async (file) => {
                                                            if (file.type.startsWith("image/")) {
                                                                try {
                                                                    const compressedBlob = await imageCompression(file, options);
                                                                    return new File([compressedBlob], file.name, {
                                                                        type: compressedBlob.type,
                                                                        lastModified: Date.now(),
                                                                    });
                                                                } catch (error) {
                                                                    return file;
                                                                }
                                                            }
                                                            return file;
                                                        })
                                                    );
                                                    setReplyFiles(prev => [...prev, ...processedFiles]);
                                                }

                                                if (toastId) toast.dismiss(toastId);
                                                setUploadingFiles(false);
                                            }}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}