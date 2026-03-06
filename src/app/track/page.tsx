"use client";

import { useState } from "react";
import { getCaseByTracking, getCasesByPhone, submitCSAT } from "@/app/actions/case-actions";
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
    const [caseData, setCaseData] = useState<any>(null);
    const [caseList, setCaseList] = useState<any[]>([]);
    const [error, setError] = useState("");

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
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                            <HeartPulse className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">HealthHelp</h1>
                            <p className="text-xs text-slate-500">ติดตามสถานะเคส</p>
                        </div>
                    </Link>
                    <Link href="/" className="btn-secondary text-sm ml-auto bg-white hover:bg-slate-50 border-slate-300 mr-2 sm:mr-4">
                        <ArrowLeft className="w-4 h-4" />
                        กลับหน้าแจ้งปัญหา
                    </Link>
                </div>
            </header>

            <main className="w-full flex-grow flex flex-col min-h-[calc(100vh-73px)]">
                {mode === "search" && (
                    <div className="w-full h-full flex-grow flex flex-col items-center justify-start px-6 sm:px-10 pt-10 sm:pt-20 pb-20 bg-white/40 backdrop-blur-md min-h-[calc(100vh-73px)]">
                        <div className="max-w-xl w-full mx-auto text-center flex flex-col items-center justify-start flex-grow mt-4 sm:mt-10">
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
                        <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
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
                                    ไทม์ไลน์สถานะ
                                </h4>
                                <div className="relative pl-2">
                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                                    <div className="space-y-6">
                                        {caseData.updates?.map((u: any, i: number) => (
                                            <div key={i} className="relative flex gap-4 pl-10">
                                                <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
                                                    {getActionIcon(u.actionType)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-medium text-slate-800">
                                                            {u.user?.fullName || "ระบบ"}
                                                        </span>
                                                        <span className="text-xs text-slate-400">{formatDateTime(u.createdAt)}</span>
                                                    </div>
                                                    {u.actionType === "STATUS_CHANGE" && (
                                                        <div className="text-xs mb-1">
                                                            <span className={`badge ${getStatusColor(u.oldValue || "")} mr-1`}>
                                                                {getStatusLabel(u.oldValue || "")}
                                                            </span>
                                                            →
                                                            <span className={`badge ${getStatusColor(u.newValue || "")} ml-1`}>
                                                                {getStatusLabel(u.newValue || "")}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {u.actionType === "ASSIGN" && (
                                                        <p className="text-xs text-green-600 mb-1">มอบหมายให้: {u.newValue}</p>
                                                    )}
                                                    {u.note && (
                                                        <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{u.note}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
                        <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
                            <div className="flex justify-end mb-4 sm:mb-6">
                                <button onClick={() => { setMode("search"); setCaseList([]); }} className="btn-secondary text-sm bg-white hover:bg-slate-50 border-slate-300 shadow-sm">
                                    <ArrowLeft className="w-4 h-4" />
                                    ค้นหาใหม่
                                </button>
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 mb-6">ประวัติการแจ้ง ({caseList.length} เคส)</h3>

                            <div className="space-y-3">
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
