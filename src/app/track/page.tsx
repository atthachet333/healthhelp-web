"use client";

import { useState } from "react";
import { getCaseByTracking, getCasesByPhone, submitCSAT, addPublicCaseUpdate } from "@/app/actions/case-actions";
import Link from "next/link";
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
<<<<<<< HEAD
    Paperclip,
    X,
=======
>>>>>>> e676da9595a22026898b785d54bf7e7ced02fe69
    ImageIcon,
    Send,
} from "lucide-react";
import { getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor, formatDateTime } from "@/lib/utils";

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
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
    const [mode, setMode] = useState<"search" | "result" | "history">("search");
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [searchType, setSearchType] = useState<"tracking" | "phone">("tracking");
    const [searchValue, setSearchValue] = useState("");
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [caseData, setCaseData] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [caseList, setCaseList] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [userReply, setUserReply] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);
    const [userFiles, setUserFiles] = useState<File[]>([]);
    const [uploadingUserFiles, setUploadingUserFiles] = useState(false);

    // CSAT state
    const [csatScore, setCsatScore] = useState(0);
    const [csatComment, setCsatComment] = useState("");
    const [csatSubmitting, setCsatSubmitting] = useState(false);
    const [csatDone, setCsatDone] = useState(false);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!searchValue.trim()) return;

        setLoading(true);
        setError("");

        if (searchType === "tracking") {
            const data = await getCaseByTracking(searchValue.trim().toUpperCase());
            if (data) {
                setCaseData(data);
                setMode("result");
            } else {
                setError("ไม่พบเคสจากรหัสติดตามนี้ กรุณาตรวจสอบอีกครั้ง");
            }
        } else {
            const data = await getCasesByPhone(searchValue.trim());
            if (data.length > 0) {
                setCaseList(data);
                setMode("history");
            } else {
                setError("ไม่พบประวัติการแจ้งจากเบอร์โทรนี้");
            }
        }
        setLoading(false);
    }

    async function handleUserReply() {
        if (!caseData || (!userReply.trim() && userFiles.length === 0)) return;
        setSubmittingReply(true);
<<<<<<< HEAD
        const res = await addPublicCaseUpdate(caseData.trackingCode, userReply, []);
        if (res.success) {
            setUserReply("");
=======

        let uploadedAttachments: any[] = [];

        // ถ้ามีไฟล์ ให้ upload ก่อน แล้วค่อยสร้างข้อความเดียวที่มีทั้งข้อความและไฟล์ (เหมือนแชท)
        if (userFiles.length > 0) {
            setUploadingUserFiles(true);
            try {
                const formData = new FormData();
                userFiles.forEach((f) => formData.append("files", f));
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                if (!uploadRes.ok) throw new Error("upload failed");
                const uploadData = await uploadRes.json();
                uploadedAttachments = (uploadData.files || []).map((f: any) => ({
                    ...f,
                    fileSize: f.fileSize || 0,
                }));
            } catch {
                setError("อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่");
                setSubmittingReply(false);
                setUploadingUserFiles(false);
                return;
            }
            setUploadingUserFiles(false);
        }

        const res = await addPublicCaseUpdate(caseData.trackingCode, userReply, uploadedAttachments);
        if (res.success) {
            setUserReply("");
            setUserFiles([]);
>>>>>>> e676da9595a22026898b785d54bf7e7ced02fe69
            const data = await getCaseByTracking(caseData.trackingCode);
            if (data) setCaseData(data);
        } else {
            setError(res.error || "เกิดข้อผิดพลาดในการส่งข้อความ");
        }
        setSubmittingReply(false);
    }

    /* ========= ส่งไฟล์เป็น bubble ใหม่แยก ========= */
    async function handleSendFileOnly(files: File[]) {
        if (!caseData || files.length === 0) return;
        setUploadingUserFiles(true);
        try {
            const formData = new FormData();
            files.forEach(f => formData.append("files", f));
            const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
            if (!uploadRes.ok) throw new Error("upload failed");
            const uploadData = await uploadRes.json();
            const uploadedAttachments = (uploadData.files || []).map((f: any) => ({ ...f, fileSize: f.fileSize || 0 }));
            const res = await addPublicCaseUpdate(caseData.trackingCode, "", uploadedAttachments);
            if (res.success) {
                setUserFiles([]);
                const data = await getCaseByTracking(caseData.trackingCode);
                if (data) setCaseData(data);
            } else {
                setError(res.error || "เกิดข้อผิดพลาด");
            }
        } catch (err) {
            setError("อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่");
        }
        setUploadingUserFiles(false);
    }

    async function handleCSAT() {
        if (!caseData || csatScore === 0) return;
        setCsatSubmitting(true);
        const res = await submitCSAT(caseData.trackingCode, { score: csatScore, comment: csatComment });
        setCsatSubmitting(false);
        if (res.success) {
            setCsatDone(true);
        } else {
            setError(res.error || "เกิดข้อผิดพลาด");
        }
    }

    const heroTitle = mode === "search" ? "ติดตามเคส" : mode === "history" ? "ประวัติการแจ้ง" : "รายละเอียดเคส";
    const heroSubtitle = mode === "search"
        ? "ค้นหาสถานะเคสด้วยรหัสติดตามหรือเบอร์โทรศัพท์"
        : mode === "history"
            ? "ตรวจสอบรายการเคสที่เคยแจ้งไว้จากเบอร์โทรศัพท์"
            : "ติดตามความคืบหน้า พูดคุยกับเจ้าหน้าที่ และดูสถานะล่าสุด";

    return (
        <div className="theme-light flex flex-col min-h-screen w-full relative">
            <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50/30" />
            {/* Lightbox */}
            {lightboxSrc && (
                <ImageLightbox
                    src={lightboxSrc}
                    alt="รูปขยาย"
                    onClose={() => setLightboxSrc(null)}
                />
            )}
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-slate-200/60 shadow-sm w-full">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-600/20">
                            <HeartPulse className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">HealthHelp</h1>
                    </Link>
                    <nav className="hidden md:flex items-center gap-5">
                        <Link href="/" className="px-4 py-2 text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors">
                            หน้าแรก
                        </Link>
                        <Link href="/track" className="px-4 py-2 text-base font-semibold text-blue-700 bg-blue-50 rounded-lg transition-colors">
                            ติดตามเคส
                        </Link>
                        <Link href="/contact" className="px-4 py-2 text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors">
                            ติดต่อเรา
                        </Link>
                    </nav>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/admin/login"
                            className="flex items-center gap-2 px-4 py-2 text-base font-medium text-slate-500 hover:text-blue-600 transition-colors"
                        >
                            <User className="w-5 h-5" />
                            <span className="hidden sm:inline">เจ้าหน้าที่</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center w-full relative z-10">
                <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 md:py-10 relative">
                        <div className="text-center">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                                {heroTitle}
                            </h2>
                            <p className="text-blue-100/90 text-sm sm:text-base mx-auto text-center">
                                {heroSubtitle}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 -mt-4 pb-12 relative z-20">
                {mode === "search" && (
                    <div className="w-full flex justify-center pt-2 sm:pt-4">
                        <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden">
                            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200/80 px-5 sm:px-6 py-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Search className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">ค้นหาสถานะเคส</h3>
                                        <p className="text-slate-500 text-xs">ค้นหาด้วยรหัสติดตามหรือเบอร์โทรศัพท์</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSearch} className="w-full p-5 sm:p-6">
                                {/* Search Type Tabs */}
                                <div className="flex gap-2 mb-6 bg-slate-100 p-2 rounded-2xl w-full">
                                    <button
                                        type="button"
                                        onClick={() => { setSearchType("tracking"); setSearchValue(""); setError(""); }}
                                        className={`flex-1 py-3.5 px-4 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2 ${searchType === "tracking" ? "bg-white text-indigo-600 shadow-md" : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        🔑 รหัสติดตาม
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setSearchType("phone"); setSearchValue(""); setError(""); }}
                                        className={`flex-1 py-3.5 px-4 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2 ${searchType === "phone" ? "bg-white text-indigo-600 shadow-md" : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        <Phone className="w-5 h-5" />
                                        เบอร์โทรศัพท์
                                    </button>
                                </div>

                                <div className="relative w-full">
                                    <input
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        className="input-field text-center text-xl sm:text-2xl py-5 sm:py-6 tracking-widest font-mono w-full shadow-inner rounded-2xl"
                                        placeholder={searchType === "tracking" ? "เช่น ABC12345" : "เช่น 0812345678"}
                                        style={{ letterSpacing: searchType === "tracking" ? "0.15em" : "normal" }}
                                    />
                                </div>
                                {error && (
                                    <p className="text-red-500 text-base mt-4 flex items-center justify-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </p>
                                )}
                                <div className="w-full">
                                    <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-5 sm:py-6 text-xl font-bold shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-all rounded-2xl flex items-center justify-center gap-3">
                                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                                        {loading ? "กำลังค้นหา..." : "ค้นหาเคส"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {mode === "result" && caseData && (
                    <div className="w-full flex justify-center pt-2 sm:pt-4">
                        <div className="w-full max-w-4xl mx-auto flex flex-col">
                            <div className="flex justify-end mb-4 sm:mb-6">
                                <button onClick={() => { setMode("search"); setCaseData(null); }} className="btn-secondary text-base bg-white hover:bg-slate-50 border-slate-300 px-6 shadow-sm">
                                    <ArrowLeft className="w-5 h-5" />
                                    ค้นหาใหม่
                                </button>
                            </div>

                            {/* Case Header */}
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 sm:p-8 mb-5 w-full">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
                                    <div>
                                        <p className="text-base font-semibold text-slate-500 mb-1">เลขที่เคส</p>
                                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{caseData.caseNo}</h3>
                                    </div>
                                    <span className={`badge ${getStatusColor(caseData.status)} text-base px-5 py-2 rounded-xl font-bold shadow-sm`}>
                                        {getStatusLabel(caseData.status)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-slate-500 text-sm font-semibold mb-1.5">ประเภท</p>
                                        <p className="font-bold text-slate-800 text-base leading-snug">{caseData.category?.name}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-slate-500 text-sm font-semibold mb-1.5">ความเร่งด่วน</p>
                                        <span className={`badge ${getPriorityColor(caseData.priority)} text-sm mt-1 block w-max`}>
                                            {getPriorityLabel(caseData.priority)}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-slate-500 text-sm font-semibold mb-1.5">วันที่แจ้ง</p>
                                        <p className="font-bold text-slate-800 text-sm leading-snug">{formatDateTime(caseData.createdAt)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-slate-500 text-sm font-semibold mb-1.5">ผู้รับผิดชอบ</p>
                                        <p className="font-bold text-slate-800 text-base leading-snug">{caseData.assignee?.fullName || "รอมอบหมาย"}</p>
                                    </div>
                                </div>
                                <div className="mt-5 bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100/60">
                                    <p className="text-indigo-600 text-sm font-bold mb-2 uppercase tracking-wider">หัวข้อปัญหา</p>
                                    <p className="text-slate-900 font-bold text-lg mb-2 leading-snug">{caseData.problemSummary}</p>
                                    {caseData.description && (
                                        <p className="text-slate-600 text-base leading-relaxed">{caseData.description}</p>
                                    )}
                                </div>
                            </div>

                            {/* Timeline */}
<<<<<<< HEAD
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 sm:p-8 md:p-10 mb-6 sm:mb-8 w-full">
                                {/* ── Conversation Timeline ── */}
                                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-indigo-600 to-teal-600 px-5 py-3 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-white" />
                                        <h4 className="text-base font-bold text-white tracking-wide">การสนทนาและไทม์ไลน์</h4>
=======
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-5 sm:p-7 mb-5 w-full">
                                {/* ── Conversation Timeline ── */}
                                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-indigo-600 to-teal-600 px-6 py-4 flex items-center gap-3">
                                        <Clock className="w-6 h-6 text-white shrink-0" />
                                        <h4 className="text-lg font-bold text-white tracking-wide">การสนทนาและไทม์ไลน์</h4>
>>>>>>> e676da9595a22026898b785d54bf7e7ced02fe69
                                    </div>
                                    {/* Messages area */}
                                    <div className="bg-slate-50 p-4 space-y-6">
                                    {caseData.updates?.filter((u: any) => {
                                        // WHITELIST — only show entries safe for the case reporter:
                                        const isSystemEvent = !u.user && u.actionType !== "COMMENT";
                                        const isReporterReply = !u.user && u.actionType === "COMMENT";
                                        const isPublicAdminComment = !!u.user && u.actionType === "COMMENT" && u.isPublic === true;
                                        return isSystemEvent || isReporterReply || isPublicAdminComment;
                                    }).map((u: any, i: number) => {
                                        const isUserReply = !u.user && u.actionType === "COMMENT";
                                        const isSystem = !u.user && u.actionType !== "COMMENT";
                                        // ── ผู้แจ้ง (ขวา) ─────────────────────────────────────
                                        if (isUserReply) {
                                            return (
                                                <div key={i} className="flex justify-end mb-5">
                                                    <div className="max-w-[85%] sm:max-w-[70%]">
                                                        {/* Label */}
                                                        <div className="flex items-center justify-end gap-2 mb-1.5 pr-1">
                                                            <span className="text-xs text-slate-500">{formatDateTime(u.createdAt)}</span>
                                                            <span className="inline-flex items-center gap-1 text-sm font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                                                                👤 คุณ (ผู้แจ้ง)
                                                            </span>
                                                        </div>
                                                        {/* Bubble */}
                                                        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none px-5 py-4 shadow-lg border-2 border-indigo-700">
<<<<<<< HEAD
                                                            <p className="text-base sm:text-lg leading-relaxed font-medium">{u.note}</p>
                                                            {u.attachments && u.attachments.length > 0 && (
                                                                <div className="mt-3 flex flex-col gap-2">
                                                                    {u.attachments.map((file: any, idx: number) => (
                                                                        <a
                                                                            key={idx}
                                                                            href={file.fileUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-2 text-xs bg-indigo-800/50 hover:bg-indigo-700/50 text-indigo-100 px-3 py-2 rounded-lg border border-indigo-500/30 transition-colors w-fit max-w-[200px]"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            {file.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                                <img src={file.fileUrl} alt={file.fileName} className="mt-1 max-w-[150px] max-h-[150px] object-cover rounded shadow" />
                                                                            ) : (
                                                                                <>
                                                                                    <FileText className="w-4 h-4 shrink-0" />
                                                                                    <span className="truncate">{file.fileName}</span>
                                                                                </>
                                                                            )}
                                                                        </a>
=======
                                                            {u.note && <p className="text-base sm:text-lg leading-relaxed font-medium">{u.note}</p>}
                                                            {u.attachments && u.attachments.length > 0 && (
                                                                <div className="mt-3 flex flex-col gap-2">
                                                                    {u.attachments.map((file: any, idx: number) => (
                                                                        file.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                                            // eslint-disable-next-line @next/next/no-img-element
                                                                            <img
                                                                                key={idx}
                                                                                src={file.fileUrl}
                                                                                alt={file.fileName}
                                                                                className="mt-1 max-w-[220px] max-h-[220px] object-cover rounded-xl shadow-md cursor-zoom-in hover:opacity-90 transition-opacity"
                                                                                onClick={() => setLightboxSrc(file.fileUrl)}
                                                                            />
                                                                        ) : (
                                                                            <a
                                                                                key={idx}
                                                                                href={file.fileUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex items-center gap-2 text-xs bg-indigo-800/50 hover:bg-indigo-700/50 text-indigo-100 px-3 py-2 rounded-lg border border-indigo-500/30 transition-colors w-fit"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <FileText className="w-4 h-4 shrink-0" />
                                                                                <span className="truncate max-w-[200px]">{file.fileName}</span>
                                                                            </a>
                                                                        )
>>>>>>> e676da9595a22026898b785d54bf7e7ced02fe69
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // ── ระบบ / เจ้าหน้าที่ (ซ้าย) ─────────────────────────
                                        const senderLabel = isSystem
                                            ? "⚙️ ระบบ"
                                            : `🧑‍💼 เจ้าหน้าที่: ${u.user?.fullName}`;
                                        const bubbleBg   = isSystem
                                            ? "bg-slate-100 border-slate-300 text-slate-700"
                                            : "bg-teal-700 border-teal-800 text-white";
                                        const labelColor = isSystem
                                            ? "text-slate-600 bg-slate-200"
                                            : "text-teal-800 bg-teal-100";
                                        const avatarBg   = isSystem
                                            ? "bg-slate-200 text-slate-500"
                                            : "bg-teal-600 text-white";

                                        return (
                                            <div key={i} className="flex justify-start mb-5">
                                                <div className="max-w-[85%] sm:max-w-[70%] flex gap-3">
                                                    {/* Avatar */}
                                                    <div className={`mt-6 shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${avatarBg}`}>
                                                        {isSystem ? "⚙" : "👨‍💼"}
                                                    </div>
                                                    <div className="flex-1">
                                                        {/* Label */}
                                                        <div className="flex items-center gap-2 mb-1.5 pl-1">
                                                            <span className={`inline-flex items-center text-sm font-bold px-2.5 py-0.5 rounded-full ${labelColor}`}>
                                                                {senderLabel}
                                                            </span>
                                                            <span className="text-xs text-slate-400">{formatDateTime(u.createdAt)}</span>
                                                        </div>
                                                        {/* Bubble */}
                                                        <div className={`rounded-2xl rounded-tl-none px-5 py-4 shadow-md border-2 ${bubbleBg}`}>
                                                            {u.actionType === "STATUS_CHANGE" && (
                                                                <div className="flex items-center gap-2 flex-wrap mb-3 bg-white/20 rounded-xl px-3 py-2 w-max border border-white/30">
                                                                    <span className={`badge ${getStatusColor(u.oldValue || "")} text-sm px-3 py-1 font-bold`}>
                                                                        {getStatusLabel(u.oldValue || "")}
                                                                    </span>
                                                                    <span className="font-bold text-lg">→</span>
                                                                    <span className={`badge ${getStatusColor(u.newValue || "")} text-sm px-3 py-1 font-bold`}>
                                                                        {getStatusLabel(u.newValue || "")}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {u.note && (
                                                                <p className="text-base sm:text-lg leading-relaxed font-medium">{u.note}</p>
                                                            )}
                                                            {u.attachments && u.attachments.length > 0 && (
                                                                <div className="mt-3 flex flex-col gap-2">
                                                                    {u.attachments.map((file: any, idx: number) => {
<<<<<<< HEAD
                                                                        if (file.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
=======
                                                                        if (file.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
>>>>>>> e676da9595a22026898b785d54bf7e7ced02fe69
                                                                            return (
                                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                                <img
                                                                                    key={idx}
                                                                                    src={file.fileUrl}
                                                                                    alt={file.fileName}
<<<<<<< HEAD
                                                                                    className="max-w-[300px] max-h-[300px] object-cover rounded-lg shadow-md border border-black/20 cursor-pointer hover:opacity-90 transition-opacity"
=======
                                                                                    className="max-w-[220px] max-h-[220px] object-cover rounded-xl shadow-md border border-black/20 cursor-zoom-in hover:opacity-90 transition-opacity"
                                                                                    onClick={() => setLightboxSrc(file.fileUrl)}
>>>>>>> e676da9595a22026898b785d54bf7e7ced02fe69
                                                                                />
                                                                            );
                                                                        } else if (file.fileUrl.match(/\.pdf$/i)) {
                                                                            return (
                                                                                <embed
                                                                                    key={idx}
                                                                                    src={file.fileUrl}
                                                                                    type="application/pdf"
                                                                                    width="300"
                                                                                    height="400"
                                                                                    className="border border-black/20 rounded-lg shadow-md"
                                                                                />
                                                                            );
                                                                        } else {
                                                                            return (
                                                                                <a
                                                                                    key={idx}
                                                                                    href={file.fileUrl}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center gap-2 text-xs bg-black/10 hover:bg-black/20 text-current px-3 py-2 rounded-lg border border-black/10 transition-colors w-fit"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    <FileText className="w-4 h-4 shrink-0" />
                                                                                    <span className="truncate max-w-[250px]">{file.fileName}</span>
                                                                                </a>
                                                                            );
                                                                        }
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    </div>{/* close messages area */}
                                </div>{/* close rounded card */}

                                {/* User Reply Box */}
                                {caseData.status !== "RESOLVED" && caseData.status !== "CLOSED" && (
                                    <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 shadow-md overflow-hidden">
                                        {/* Header */}
                                        <div className="bg-indigo-600 px-5 py-3 flex items-center gap-2">
                                            <MessageCircle className="w-5 h-5 text-white" />
                                            <h4 className="text-base font-bold text-white">ตอบกลับ / ให้ข้อมูลเพิ่มเติม</h4>
                                        </div>
                                        <div className="p-4">
<<<<<<< HEAD
                                            {/* Text area + Send text button */}
=======
                                            {/* Text area + Send button */}
>>>>>>> e676da9595a22026898b785d54bf7e7ced02fe69
                                            <div className="flex gap-2 items-end mb-3">
                                                <textarea
                                                    value={userReply}
                                                    onChange={(e) => setUserReply(e.target.value)}
                                                    className="flex-1 input-field min-h-[90px] text-base resize-none"
                                                    placeholder="พิมพ์ข้อความตอบกลับเจ้าหน้าที่..."
                                                />
                                                <button
                                                    onClick={handleUserReply}
<<<<<<< HEAD
                                                    disabled={!userReply.trim() || submittingReply}
                                                    className="btn-primary px-5 py-3 text-base font-bold flex items-center gap-2 self-end disabled:opacity-50 min-h-[52px]"
=======
                                                    disabled={(!userReply.trim() && userFiles.length === 0) || submittingReply || uploadingUserFiles}
                                                    className="btn-primary px-6 py-3.5 text-lg font-bold flex items-center gap-2 self-end disabled:opacity-50 min-h-[56px] rounded-2xl"
>>>>>>> e676da9595a22026898b785d54bf7e7ced02fe69
                                                >
                                                    {submittingReply ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                                    ส่ง
                                                </button>
                                            </div>

<<<<<<< HEAD
                                            {/* Divider */}
                                            <div className="flex items-center gap-3 my-3">
                                                <hr className="flex-1 border-indigo-200" />
                                                <span className="text-xs text-indigo-400 font-semibold">หรือแนบรูป / ไฟล์</span>
                                                <hr className="flex-1 border-indigo-200" />
                                            </div>

                                            {/* File-only send: pick & instantly send as separate bubble */}
                                            <label className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all font-semibold text-sm select-none ${
=======
                                            {/* แสดงไฟล์ที่เลือกแนบ (preview) */}
                                            {userFiles.length > 0 && (
                                                <div className="mb-3 flex flex-wrap gap-3">
                                                    {userFiles.map((f, idx) => (
                                                        <div key={idx} className="relative group">
                                                            {f.type.startsWith("image/") ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={URL.createObjectURL(f)}
                                                                    alt={f.name}
                                                                    className="w-16 h-16 object-cover rounded-lg border border-indigo-200 shadow-sm"
                                                                />
                                                            ) : (
                                                                <div className="w-16 h-16 bg-indigo-50 rounded-lg border border-indigo-200 flex flex-col items-center justify-center gap-1">
                                                                    <FileText className="w-4 h-4 text-indigo-400" />
                                                                    <span className="text-[9px] text-indigo-700 px-1 text-center truncate w-full">
                                                                        {f.name}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => setUserFiles(prev => prev.filter((_, i) => i !== idx))}
                                                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Divider */}
                                            <div className="flex items-center gap-3 my-4">
                                                <hr className="flex-1 border-indigo-200" />
                                                <span className="text-sm text-indigo-400 font-semibold">หรือแนบรูป / ไฟล์</span>
                                                <hr className="flex-1 border-indigo-200" />
                                            </div>

                                            {/* เลือกไฟล์แนบ */}
                                            <label className={`flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all font-semibold text-base select-none ${
>>>>>>> e676da9595a22026898b785d54bf7e7ced02fe69
                                                uploadingUserFiles
                                                    ? "border-indigo-300 bg-indigo-100 text-indigo-400 pointer-events-none"
                                                    : "border-indigo-400 bg-white text-indigo-600 hover:bg-indigo-50 hover:border-indigo-500"
                                            }`}>
                                                {uploadingUserFiles ? (
<<<<<<< HEAD
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> กำลังอัปโหลด...</>
                                                ) : (
                                                    <><ImageIcon className="w-4 h-4" /> 📎 แนบรูป / ไฟล์ (ส่งเป็นข้อความใหม่ทันที)</>
=======
                                                    <><Loader2 className="w-5 h-5 animate-spin" /> กำลังอัปโหลด...</>
                                                ) : (
                                                    <><ImageIcon className="w-5 h-5" /> 📎 แนบรูป / ไฟล์</>
>>>>>>> e676da9595a22026898b785d54bf7e7ced02fe69
                                                )}
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*,.pdf,.doc,.docx"
                                                    disabled={uploadingUserFiles}
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files.length > 0) {
                                                            const files = Array.from(e.target.files);
<<<<<<< HEAD
                                                            handleSendFileOnly(files);
=======
                                                            setUserFiles(prev => [...prev, ...files]);
>>>>>>> e676da9595a22026898b785d54bf7e7ced02fe69
                                                        }
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </label>
                                            <p className="text-xs text-slate-400 mt-2 text-center">รองรับรูปภาพ .jpg .png และไฟล์ .pdf ขนาดไม่เกิน 10MB</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* CSAT Section */}
                            {(caseData.status === "RESOLVED" || caseData.status === "CLOSED") && !caseData.csatRating && !csatDone && (
                                <div className="bg-white rounded-2xl shadow-lg border border-indigo-200 p-6">
                                    <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                                        <Star className="w-5 h-5 text-yellow-500" />
                                        ให้คะแนนการบริการ
                                    </h4>
                                    <p className="text-slate-600 text-sm mb-4">คุณพอใจกับการแก้ไขปัญหานี้มากน้อยเพียงใด?</p>

                                    <div className="flex gap-2 mb-4 justify-center">
                                        {[1, 2, 3, 4, 5].map((score) => (
                                            <button
                                                key={score}
                                                onClick={() => setCsatScore(score)}
                                                className={`w-12 h-12 rounded-xl text-xl transition-all ${csatScore >= score
                                                    ? "bg-yellow-400 text-yellow-900 scale-110"
                                                    : "bg-slate-100 text-slate-400 hover:bg-yellow-100"
                                                    }`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        value={csatComment}
                                        onChange={(e) => setCsatComment(e.target.value)}
                                        className="input-field min-h-[80px] mb-4"
                                        placeholder="ความคิดเห็นเพิ่มเติม (ไม่บังคับ)"
                                    />

                                    <button
                                        onClick={handleCSAT}
                                        disabled={csatScore === 0 || csatSubmitting}
                                        className="btn-primary w-full"
                                    >
                                        {csatSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        ส่งคะแนน
                                    </button>
                                </div>
                            )}

                            {(csatDone || caseData.csatRating) && (
                                <div className="bg-green-50 rounded-2xl border border-green-200 p-6 text-center">
                                    <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
                                    <p className="font-bold text-green-800">ขอบคุณสำหรับการให้คะแนน!</p>
                                    {caseData.csatRating && (
                                        <p className="text-green-600 text-sm mt-1">คะแนน: {"★".repeat(caseData.csatRating.score)}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {mode === "history" && (
                    <div className="w-full flex justify-center pt-2 sm:pt-4">
                        <div className="w-full max-w-7xl mx-auto flex flex-col">
                            <div className="flex justify-end mb-4 sm:mb-6">
                                <button onClick={() => { setMode("search"); setCaseList([]); }} className="btn-secondary text-sm bg-white hover:bg-slate-50 border-slate-300 shadow-sm">
                                    <ArrowLeft className="w-4 h-4" />
                                    ค้นหาใหม่
                                </button>
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 mb-6">ประวัติการแจ้ง ({caseList.length} เคส)</h3>

                            <div className="space-y-3">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {caseList.map((c: any) => (
                                    <div
                                        key={c.id}
                                        onClick={async () => {
                                            const data = await getCaseByTracking(c.trackingCode);
                                            if (data) { setCaseData(data); setMode("result"); }
                                        }}
                                        className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-mono font-bold text-slate-900">{c.caseNo}</span>
                                            <span className={`badge ${getStatusColor(c.status)} text-xs`}>
                                                {getStatusLabel(c.status)}
                                            </span>
                                        </div>
                                        <p className="text-slate-700 text-sm mb-1">{c.problemSummary}</p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>{c.category?.name}</span>
                                            <span>{formatDateTime(c.createdAt)}</span>
                                            <span className={`badge ${getPriorityColor(c.priority)} text-xs`}>
                                                {getPriorityLabel(c.priority)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </main>
            <footer className="w-full bg-slate-900 text-slate-400 relative z-10">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                <HeartPulse className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-slate-300">HealthHelp</span>
                        </div>
                        <p className="text-[11px] text-slate-500">© 2026 HealthHelp - ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร</p>
                        <Link href="/admin/login" className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
                            เจ้าหน้าที่ →
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
