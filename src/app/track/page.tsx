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
} from "lucide-react";
import { getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor, formatDateTime } from "@/lib/utils";

export default function TrackPage() {
    const [mode, setMode] = useState<"search" | "result" | "history">("search");
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
        if (!caseData || !userReply.trim()) return;
        setSubmittingReply(true);
        const res = await addPublicCaseUpdate(caseData.trackingCode, userReply);
        if (res.success) {
            setUserReply("");
            // Refresh case data
            const data = await getCaseByTracking(caseData.trackingCode);
            if (data) setCaseData(data);
        } else {
            setError(res.error || "เกิดข้อผิดพลาดในการส่งข้อความ");
        }
        setSubmittingReply(false);
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

    function getActionIcon(actionType: string) {
        switch (actionType) {
            case "SYSTEM": return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
            case "STATUS_CHANGE": return <AlertCircle className="w-4 h-4 text-yellow-400" />;
            case "ASSIGN": return <User className="w-4 h-4 text-green-400" />;
            case "COMMENT": return <MessageCircle className="w-4 h-4 text-indigo-400" />;
            default: return <Clock className="w-4 h-4 text-gray-400" />;
        }
    }

    return (
        <div className="theme-light min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
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

            <main className="w-full flex-grow flex flex-col min-h-[calc(100vh-73px)]">
                {mode === "search" && (
                    <div className="w-full h-full flex-grow flex flex-col items-center justify-start px-6 sm:px-10 pt-10 sm:pt-20 pb-20 bg-white/40 backdrop-blur-md min-h-[calc(100vh-73px)]">
                        <div className="w-full max-w-2xl mx-auto text-center flex flex-col items-center justify-start flex-grow mt-4 sm:mt-10">
                            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-md">
                                <Search className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 px-4 w-full">ติดตามสถานะเคส</h2>
                            <p className="text-sm sm:text-base text-slate-600 mb-8 px-4 w-full">ค้นหาเคสด้วยรหัสติดตามหรือเบอร์โทรศัพท์</p>

                            <form onSubmit={handleSearch} className="w-full">
                                {/* Search Type Tabs */}
                                <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-xl w-full">
                                    <button
                                        type="button"
                                        onClick={() => { setSearchType("tracking"); setSearchValue(""); setError(""); }}
                                        className={`flex-1 py-3 px-4 rounded-lg text-sm sm:text-base font-semibold transition-all shadow-sm ${searchType === "tracking" ? "bg-white text-indigo-600 ring-1 ring-black/5 shadow-md flex items-center justify-center gap-2" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 flex items-center justify-center gap-2"
                                            }`}
                                    >
                                        🔑 รหัสติดตาม
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setSearchType("phone"); setSearchValue(""); setError(""); }}
                                        className={`flex-1 py-3 px-4 rounded-lg text-sm sm:text-base font-semibold transition-all shadow-sm ${searchType === "phone" ? "bg-white text-indigo-600 ring-1 ring-black/5 shadow-md flex items-center justify-center gap-2" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 flex items-center justify-center gap-2"
                                            }`}
                                    >
                                        <Phone className="w-4 h-4" />
                                        เบอร์โทรศัพท์
                                    </button>
                                </div>

                                <div className="relative w-full">
                                    <input
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        className="input-field text-center text-lg sm:text-xl py-4 sm:py-5 tracking-widest font-mono w-full shadow-inner rounded-xl"
                                        placeholder={searchType === "tracking" ? "เช่น ABC12345" : "เช่น 0812345678"}
                                        style={{ letterSpacing: searchType === "tracking" ? "0.15em" : "normal" }}
                                    />
                                </div>
                                {error && (
                                    <p className="text-red-500 text-sm mt-3 flex items-center justify-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </p>
                                )}
                                <div className="w-full">
                                    <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-4 sm:py-5 text-lg font-bold shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-all rounded-xl flex items-center justify-center gap-2">
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                        {loading ? "กำลังค้นหา..." : "ค้นหา"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {mode === "result" && caseData && (
                    <div className="w-full h-full flex-grow flex flex-col items-center justify-start px-2 sm:px-6 md:px-10 pt-8 sm:pt-14 pb-20 bg-white/40 backdrop-blur-md min-h-[calc(100vh-73px)]">
                        <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col">
                            <div className="flex justify-end mb-4 sm:mb-6">
                                <button onClick={() => { setMode("search"); setCaseData(null); }} className="btn-secondary text-sm bg-white hover:bg-slate-50 border-slate-300 px-6 shadow-sm">
                                    <ArrowLeft className="w-4 h-4" />
                                    ค้นหาใหม่
                                </button>
                            </div>

                            {/* Case Header */}
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 sm:p-8 md:p-10 mb-6 sm:mb-8 w-full">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-6 border-b border-slate-100">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 mb-1">เลขที่เคส</p>
                                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{caseData.caseNo}</h3>
                                    </div>
                                    <span className={`badge ${getStatusColor(caseData.status)} text-sm px-5 py-2 rounded-full font-bold shadow-sm`}>
                                        {getStatusLabel(caseData.status)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-slate-500 font-medium mb-1">ประเภท</p>
                                        <p className="font-bold text-slate-800">{caseData.category?.name}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-slate-500 font-medium mb-1">ระดับความเร่งด่วน</p>
                                        <span className={`badge ${getPriorityColor(caseData.priority)} text-xs px-3 py-1 mt-1 block w-max`}>
                                            {getPriorityLabel(caseData.priority)}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-slate-500 font-medium mb-1">วันที่แจ้ง</p>
                                        <p className="font-bold text-slate-800">{formatDateTime(caseData.createdAt)}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-slate-500 font-medium mb-1">ผู้รับผิดชอบ</p>
                                        <p className="font-bold text-slate-800">{caseData.assignee?.fullName || "รอมอบหมาย"}</p>
                                    </div>
                                </div>
                                <div className="mt-8 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
                                    <p className="text-indigo-900/60 text-sm font-bold mb-2 uppercase tracking-wider">หัวข้อปัญหา</p>
                                    <p className="text-slate-900 font-bold text-lg mb-2">{caseData.problemSummary}</p>
                                    {caseData.description && (
                                        <p className="text-slate-600 text-base leading-relaxed">{caseData.description}</p>
                                    )}
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 sm:p-8 md:p-10 mb-6 sm:mb-8 w-full">
                                <h4 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                                    <Clock className="w-6 h-6 text-indigo-500" />
                                    การสนทนาและไทม์ไลน์
                                </h4>
                                <div className="space-y-6">
                                    {caseData.updates?.filter((u: any) => {
                                        // WHITELIST — only show entries safe for the case reporter:
                                        const isSystemEvent = !u.user && u.actionType !== "COMMENT";
                                        const isReporterReply = !u.user && u.actionType === "COMMENT";
                                        const isPublicAdminComment = !!u.user && u.actionType === "COMMENT" && u.isPublic === true;
                                        return isSystemEvent || isReporterReply || isPublicAdminComment;
                                    }).map((u: any, i: number) => {
                                        const isUserReply = !u.user && u.actionType === "COMMENT";
                                        const isSystem = !u.user && u.actionType !== "COMMENT";
                                        const isAdmin = !!u.user;

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
                                                            <p className="text-base sm:text-lg leading-relaxed font-medium">{u.note}</p>
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
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* User Reply Box */}
                                {caseData.status !== "RESOLVED" && caseData.status !== "CLOSED" && (
                                    <div className="mt-8 pt-6 border-t border-slate-200">
                                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                            <MessageCircle className="w-4 h-4 text-indigo-500" />
                                            ตอบกลับ / ให้ข้อมูลเพิ่มเติม
                                        </h4>
                                        <textarea
                                            value={userReply}
                                            onChange={(e) => setUserReply(e.target.value)}
                                            className="input-field min-h-[100px] mb-3 text-sm"
                                            placeholder="พิมพ์ข้อความตอบกลับเจ้าหน้าที่ที่นี่..."
                                        />
                                        <button
                                            onClick={handleUserReply}
                                            disabled={!userReply.trim() || submittingReply}
                                            className="btn-primary w-full sm:w-auto px-8"
                                        >
                                            {submittingReply ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : null}
                                            ส่งข้อความ
                                        </button>
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
                    <div className="w-full h-full flex-grow flex flex-col items-center justify-start px-6 sm:px-10 pt-10 sm:pt-14 pb-20 bg-white/40 backdrop-blur-md min-h-[calc(100vh-73px)]">
                        <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col">
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
            </main>
        </div>
    );
}
