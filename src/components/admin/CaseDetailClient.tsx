"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Clock,
    User,
    MessageCircle,
    AlertCircle,
    CheckCircle2,
    UserPlus,
    Star,
    Send,
    Loader2,
    Phone,
    Mail,
    MapPin,
    Lock,
} from "lucide-react";
import {
    getStatusLabel,
    getStatusColor,
    getPriorityLabel,
    getPriorityColor,
    formatDateTime,
    getChannelLabel,
} from "@/lib/utils";
import { addCaseUpdate, assignCase } from "@/app/actions/admin-actions";

interface CaseData {
    id: string;
    caseNo: string;
    problemSummary: string;
    description: string;
    status: string;
    priority: string;
    channel: string;
    trackingCode: string;
    createdAt: string;
    updatedAt: string;
    slaDueAt: string | null;
    resolvedAt: string | null;
    closedAt: string | null;
    reporter: {
        id: string;
        fullName: string;
        phone: string;
        email: string | null;
        lineId: string | null;
        address: string | null;
    };
    category: { id: string; name: string };
    assignee: { id: string; fullName: string } | null;
    updates: {
        id: string;
        actionType: string;
        oldValue: string | null;
        newValue: string | null;
        note: string | null;
        createdAt: string;
        user: { fullName: string; role: string } | null;
        attachments: { id: string; fileName: string; fileUrl: string }[];
    }[];
    csatRating: { score: number; comment: string | null } | null;
}

interface StaffUser {
    id: string;
    fullName: string;
    role: string;
}

export function CaseDetailClient({
    caseData,
    staffUsers,
}: {
    caseData: CaseData;
    staffUsers: StaffUser[];
}) {
    const router = useRouter();
    const [internalNote, setInternalNote] = useState("");
    const [publicNote, setPublicNote] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [submittingInternal, setSubmittingInternal] = useState(false);
    const [submittingPublic, setSubmittingPublic] = useState(false);
    const [showAssign, setShowAssign] = useState(false);

    const currentUserRole = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("healthhelp_user") || "{}").role
        : null;
    const isViewer = currentUserRole === "VIEWER";
    const canAssign = currentUserRole === "ADMIN" || currentUserRole === "SUPERVISOR";

    async function handleSubmitInternal() {
        if (!internalNote.trim() && !newStatus) return;
        setSubmittingInternal(true);
        const user = JSON.parse(localStorage.getItem("healthhelp_user") || "{}");
        await addCaseUpdate(caseData.id, user.id, internalNote, newStatus || undefined, false);
        setInternalNote("");
        setNewStatus("");
        setSubmittingInternal(false);
        router.refresh();
    }

    async function handleSubmitPublic() {
        if (!publicNote.trim()) return;
        setSubmittingPublic(true);
        const user = JSON.parse(localStorage.getItem("healthhelp_user") || "{}");
        await addCaseUpdate(caseData.id, user.id, publicNote, undefined, true);
        setPublicNote("");
        setSubmittingPublic(false);
        router.refresh();
    }

    async function handleAssign(assigneeId: string) {
        const user = JSON.parse(localStorage.getItem("healthhelp_user") || "{}");
        await assignCase(caseData.id, assigneeId, user.id);
        setShowAssign(false);
        router.refresh();
    }

    function getActionIcon(actionType: string) {
        switch (actionType) {
            case "SYSTEM": return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
            case "STATUS_CHANGE": return <AlertCircle className="w-4 h-4 text-yellow-400" />;
            case "ASSIGN": return <UserPlus className="w-4 h-4 text-green-400" />;
            case "COMMENT": return <MessageCircle className="w-4 h-4 text-indigo-400" />;
            default: return <Clock className="w-4 h-4 text-gray-400" />;
        }
    }

    const isSLABreached =
        caseData.slaDueAt &&
        caseData.status !== "RESOLVED" &&
        caseData.status !== "CLOSED" &&
        new Date(caseData.slaDueAt) < new Date();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/cases" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-sm font-medium">
                        <ArrowLeft className="w-5 h-5" />
                        ย้อนกลับ
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold text-white font-mono">{caseData.caseNo}</h2>
                            <span className={`badge ${getStatusColor(caseData.status)} text-sm px-3 py-1`}>
                                {getStatusLabel(caseData.status)}
                            </span>
                            <span className={`badge ${getPriorityColor(caseData.priority)} text-sm px-3 py-1`}>
                                {getPriorityLabel(caseData.priority)}
                            </span>
                            {isSLABreached && (
                                <span className="badge bg-red-500/20 text-red-400 text-sm px-3 py-1 animate-pulse-slow">⚠ เกิน SLA</span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            สร้างเมื่อ {formatDateTime(caseData.createdAt)} • ช่องทาง: {getChannelLabel(caseData.channel)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Problem Description */}
                    <div className="card p-6 md:p-8">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-4">{caseData.problemSummary}</h3>
                        <p className="text-slate-300 text-base md:text-lg whitespace-pre-wrap leading-relaxed">
                            {caseData.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                        </p>
                    </div>

                    {/* Timeline */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-400" />
                            ไทม์ไลน์
                        </h3>
                        <div className="space-y-6">
                            {caseData.updates.map((u) => {
                                // Default assumption for CaseDetailClient (Admin view):
                                // If the user who made the update is the same as the assignee/staff, it's an admin reply (right side).
                                // But a simpler logic is: if actionType === "COMMENT" and isPublic and !u.user, it's the reporter (left side).
                                // Actually, any update by !u.user is either SYSTEM or REPORTER. 
                                // Reporter's comment: !u.user && u.actionType === "COMMENT"
                                const isReporterReply = !u.user && u.actionType === "COMMENT";
                                const isSystem = !u.user && u.actionType !== "COMMENT";
                                const isAdminReply = !!u.user;

                                if (isReporterReply) {
                                    return (
                                        <div key={u.id} className="flex justify-start mb-4">
                                            <div className="max-w-[85%] sm:max-w-[75%]">
                                                <div className="flex items-center justify-start gap-2 mb-1">
                                                    <span className="text-sm font-bold text-slate-800">ผู้แจ้ง (คุณ {caseData.reporter.fullName})</span>
                                                    <span className="text-xs text-slate-400">{formatDateTime(u.createdAt)}</span>
                                                </div>
                                                <div className="bg-white border text-slate-800 border-slate-200 rounded-2xl rounded-tl-sm px-5 py-3 shadow-md">
                                                    <p className="text-sm sm:text-base leading-relaxed">{u.note}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                if (isAdminReply) {
                                    return (
                                        <div key={u.id} className="flex justify-end mb-4">
                                            <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end">
                                                <div className="flex items-center justify-end gap-2 mb-1 text-right">
                                                    <span className="text-xs text-slate-400">{formatDateTime(u.createdAt)}</span>
                                                    {/* @ts-expect-error - isPublic check */}
                                                    {u.isPublic && u.actionType === "COMMENT" && (
                                                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mr-2">
                                                            PUBLIC
                                                        </span>
                                                    )}
                                                    {u.user?.role && (
                                                        <span className="text-[10px] font-medium text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md">
                                                            {u.user.role}
                                                        </span>
                                                    )}
                                                    <span className="text-sm font-bold text-slate-200">
                                                        {u.user?.fullName}
                                                    </span>
                                                </div>
                                                {/* @ts-expect-error - isPublic check */}
                                                <div className={`rounded-2xl rounded-tr-sm px-5 py-3 shadow-md ${u.actionType === 'COMMENT' && u.isPublic ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 border-slate-700 text-slate-300'} border`}>
                                                    {/* @ts-expect-error - isPublic check */}
                                                    {u.actionType === 'COMMENT' && !u.isPublic && (
                                                        <div className="text-[11px] text-amber-500/80 mb-2 flex items-center justify-end gap-1 font-bold">
                                                            <Lock className="w-3 h-3" /> บันทึกภายใน
                                                        </div>
                                                    )}
                                                    {u.actionType === "STATUS_CHANGE" && (
                                                        <div className="text-xs mb-2 bg-slate-900/50 p-2 rounded-lg inline-block border border-slate-700 w-full text-center">
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
                                                        <p className="text-sm font-bold text-green-400 mb-1 text-right">มอบหมายให้: {u.newValue}</p>
                                                    )}
                                                    {u.note && (
                                                        <p className="text-sm sm:text-base leading-relaxed text-right">{u.note}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                // System message (center)
                                return (
                                    <div key={u.id} className="flex justify-center mb-4 my-6">
                                        <div className="bg-slate-800/80 border border-slate-700 text-slate-400 rounded-full px-4 py-1.5 text-xs flex items-center gap-2">
                                            {getActionIcon(u.actionType)}
                                            {u.note} • {formatDateTime(u.createdAt)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Public Reply Box (Inside Chat) */}
                        {!isViewer && (
                            <div className="mt-4 border-t border-slate-800 pt-4">
                                <h4 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4" />
                                    ตอบกลับผู้ใช้งาน (แชท)
                                </h4>
                                <div className="flex gap-2">
                                    <textarea
                                        value={publicNote}
                                        onChange={(e) => setPublicNote(e.target.value)}
                                        className="input-field min-h-[50px] flex-1 py-2 text-sm"
                                        placeholder="พิมพ์ข้อความตอบกลับผู้ใช้งาน..."
                                    />
                                    <button
                                        onClick={handleSubmitPublic}
                                        disabled={!publicNote.trim() || submittingPublic}
                                        className="btn-primary h-auto px-4 self-end"
                                    >
                                        {submittingPublic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Internal Reply Box */}
                    {!isViewer && (
                        <div className="card border border-slate-700/50 bg-slate-800/30">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-slate-400" />
                                บันทึกการทำงานภายใน / เปลี่ยนสถานะ
                            </h3>
                            <textarea
                                value={internalNote}
                                onChange={(e) => setInternalNote(e.target.value)}
                                className="input-field min-h-[80px] mb-4 bg-slate-900/50"
                                placeholder="พิมพ์บันทึกข้อความภายในระบบ (ผู้แจ้งจะไม่เห็นข้อความนี้)..."
                            />
                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="input-field w-auto py-2 bg-slate-900/50"
                                >
                                    <option value="">ไม่เปลี่ยนสถานะ</option>
                                    <option value="OPEN">เปิด</option>
                                    <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                                    <option value="WAITING_INFO">รอข้อมูลเพิ่มเติม</option>
                                    <option value="RESOLVED">แก้ไขแล้ว</option>
                                    <option value="CLOSED">ปิดเคส</option>
                                </select>
                                <button
                                    onClick={handleSubmitInternal}
                                    disabled={(!internalNote.trim() && !newStatus) || submittingInternal}
                                    className="btn-primary py-2 bg-slate-700 hover:bg-slate-600 shadow-none border border-slate-600"
                                >
                                    {submittingInternal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    บันทึกข้อมูล
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Reporter Info */}
                    <div className="card">
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-indigo-400" />
                            ข้อมูลผู้แจ้ง
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-slate-500 text-xs">ชื่อ-นามสกุล</p>
                                <p className="text-white font-medium">{caseData.reporter.fullName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                <p className="text-slate-300">{caseData.reporter.phone}</p>
                            </div>
                            {caseData.reporter.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                                    <p className="text-slate-300">{caseData.reporter.email}</p>
                                </div>
                            )}
                            {caseData.reporter.lineId && (
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                                    <p className="text-slate-300">{caseData.reporter.lineId}</p>
                                </div>
                            )}
                            {caseData.reporter.address && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                                    <p className="text-slate-300">{caseData.reporter.address}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Case Properties */}
                    <div className="card">
                        <h4 className="text-sm font-bold text-white mb-4">คุณสมบัติเคส</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">ประเภท</span>
                                <span className="text-slate-300">{caseData.category.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">ระดับ</span>
                                <span className={`badge ${getPriorityColor(caseData.priority)} text-[10px]`}>
                                    {getPriorityLabel(caseData.priority)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">ผู้รับผิดชอบ</span>
                                <div className="relative">
                                    {!canAssign ? (
                                        <span className="text-slate-300 font-medium text-right inline-block">
                                            {caseData.assignee?.fullName || "รอมอบหมาย"}
                                        </span>
                                    ) : caseData.assignee ? (
                                        <button
                                            onClick={() => setShowAssign(!showAssign)}
                                            className="text-slate-300 hover:text-indigo-400 transition-colors text-right"
                                        >
                                            {caseData.assignee.fullName}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowAssign(!showAssign)}
                                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                        >
                                            <UserPlus className="w-3 h-3" />
                                            มอบหมาย
                                        </button>
                                    )}
                                    {showAssign && (
                                        <div className="absolute right-0 top-8 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 min-w-[180px]">
                                            {staffUsers.map((s) => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => handleAssign(s.id)}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                >
                                                    {s.fullName}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {caseData.slaDueAt && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">SLA</span>
                                    <span className={`text-sm ${isSLABreached ? "text-red-400" : "text-slate-300"}`}>
                                        {formatDateTime(caseData.slaDueAt)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-slate-500">Tracking Code</span>
                                <span className="font-mono text-xs text-indigo-400">{caseData.trackingCode}</span>
                            </div>
                        </div>
                    </div>

                    {/* CSAT */}
                    {caseData.csatRating && (
                        <div className="card border-amber-500/30 bg-amber-500/5">
                            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-400" />
                                คะแนนความพึงพอใจ
                            </h4>
                            <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <span
                                        key={s}
                                        className={`text-xl ${s <= caseData.csatRating!.score ? "text-amber-400" : "text-slate-600"}`}
                                    >
                                        ★
                                    </span>
                                ))}
                                <span className="text-white font-bold ml-2">{caseData.csatRating.score}/5</span>
                            </div>
                            {caseData.csatRating.comment && (
                                <p className="text-sm text-slate-400 italic">&ldquo;{caseData.csatRating.comment}&rdquo;</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
