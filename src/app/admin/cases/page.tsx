export const dynamic = 'force-dynamic';

import { getCases } from "@/app/actions/admin-actions";
import Link from "next/link";
import { getStatusLabel, getStatusColor, formatDateTime } from "@/lib/utils";
import {
    LayoutList, Calendar, Clock, CheckCircle2,
    AlertCircle, TrendingUp, Activity,
} from "lucide-react";

interface PageProps {
    searchParams: Promise<{ status?: string }>;
}

export default async function AdminCasesPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;
    const rawStatus = resolvedParams?.status ?? "";
    const currentStatus: "HIDE_DONE" | "SHOW_DONE" =
        rawStatus === "SHOW_DONE" ? "SHOW_DONE" : "HIDE_DONE";

    // ดึงข้อมูล tab ปัจจุบัน
    const response = await getCases({ status: currentStatus });
    const cases: any[] = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.cases)
            ? (response as any).cases
            : [];

    // ดึงข้อมูลทั้งหมด (ไม่กรอง) สำหรับ summary cards
    const allResponse = await getCases({ status: "HIDE_DONE" });
    const allActiveCases: any[] = Array.isArray(allResponse)
        ? allResponse
        : Array.isArray((allResponse as any)?.cases)
            ? (allResponse as any).cases
            : [];
    const doneResponse = await getCases({ status: "SHOW_DONE" });
    const allDoneCases: any[] = Array.isArray(doneResponse)
        ? doneResponse
        : Array.isArray((doneResponse as any)?.cases)
            ? (doneResponse as any).cases
            : [];

    const totalAll = allActiveCases.length + allDoneCases.length;
    const totalPending = allActiveCases.length;
    const totalDone = allDoneCases.length;

    const isDoneView = currentStatus === "SHOW_DONE";

    const filteredCases = isDoneView
        ? cases.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED")
        : cases.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED");

    return (
        <div className="w-full py-8 md:py-10 flex flex-col gap-8 font-sans">

            {/* ── Dashboard Summary Cards ─────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Card 1: เคสทั้งหมด */}
                <div className="relative overflow-hidden bg-[#111a2e] border border-[#1e2d4a] rounded-3xl p-6 shadow-lg hover:shadow-xl hover:border-blue-500/40 transition-all group">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-2">เคสทั้งหมด</p>
                            <p className="text-5xl font-extrabold text-white leading-none">{totalAll}</p>
                            <p className="text-slate-500 text-sm mt-2 font-medium">รายการในระบบ</p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:bg-blue-500/25 transition-colors">
                            <Activity className="w-7 h-7 text-blue-400" />
                        </div>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-[#0b1121] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: "100%" }} />
                    </div>
                    {/* Glow */}
                    <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-blue-500/8 blur-2xl" />
                </div>

                {/* Card 2: รอดำเนินการ */}
                <div className="relative overflow-hidden bg-[#111a2e] border border-[#1e2d4a] rounded-3xl p-6 shadow-lg hover:shadow-xl hover:border-amber-500/40 transition-all group">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-2">รอดำเนินการ</p>
                            <p className="text-5xl font-extrabold text-amber-400 leading-none">{totalPending}</p>
                            <p className="text-slate-500 text-sm mt-2 font-medium">
                                {totalPending > 0 ? (
                                    <span className="text-amber-400/80">⚠️ ต้องการความสนใจ</span>
                                ) : (
                                    <span className="text-green-400/80">✓ ไม่มีเคสค้าง</span>
                                )}
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:bg-amber-500/25 transition-colors">
                            <AlertCircle className="w-7 h-7 text-amber-400" />
                        </div>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-[#0b1121] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all"
                            style={{ width: totalAll > 0 ? `${Math.round((totalPending / totalAll) * 100)}%` : "0%" }}
                        />
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-amber-500/8 blur-2xl" />
                </div>

                {/* Card 3: แก้ไขเสร็จสิ้น */}
                <div className="relative overflow-hidden bg-[#111a2e] border border-[#1e2d4a] rounded-3xl p-6 shadow-lg hover:shadow-xl hover:border-green-500/40 transition-all group">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-2">แก้ไขเสร็จสิ้น</p>
                            <p className="text-5xl font-extrabold text-green-400 leading-none">{totalDone}</p>
                            <p className="text-slate-500 text-sm mt-2 font-medium">
                                {totalAll > 0
                                    ? `${Math.round((totalDone / totalAll) * 100)}% ของทั้งหมด`
                                    : "ยังไม่มีเคสเสร็จ"}
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0 group-hover:bg-green-500/25 transition-colors">
                            <CheckCircle2 className="w-7 h-7 text-green-400" />
                        </div>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-[#0b1121] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                            style={{ width: totalAll > 0 ? `${Math.round((totalDone / totalAll) * 100)}%` : "0%" }}
                        />
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-green-500/8 blur-2xl" />
                </div>
            </div>

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="space-y-1.5">
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        {isDoneView
                            ? <CheckCircle2 className="w-9 h-9 text-green-400" />
                            : <Clock className="w-9 h-9 text-indigo-400" />
                        }
                        {isDoneView ? "เคสเสร็จสิ้น" : "กำลังดำเนินการ"}
                    </h1>
                    <p className="text-base lg:text-lg font-medium text-slate-400">
                        {isDoneView
                            ? "เคสที่แก้ไขเสร็จสิ้นและปิดการดำเนินการแล้ว (RESOLVED / CLOSED)"
                            : "เคสที่อยู่ระหว่างรอรับและดำเนินการแก้ไข (OPEN / IN_PROGRESS / WAITING_INFO)"
                        }
                    </p>
                </div>

                {/* Count badge */}
                <div className="flex items-center gap-3 bg-[#111a2e] border border-indigo-500/30 px-6 py-3.5 rounded-2xl shadow-md self-start sm:self-center">
                    <span className="relative flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500" />
                    </span>
                    <span className="text-slate-300 text-lg font-semibold">
                        ทั้งหมด <span className="text-indigo-400 font-extrabold mx-1">{filteredCases.length}</span> รายการ
                    </span>
                </div>
            </div>

            {/* ── Case List ── */}
            {filteredCases.length > 0 ? (
                <div className="space-y-4">
                    {filteredCases.map((c: any) => (
                        <div
                            key={c.id}
                            className="bg-[#111a2e] rounded-3xl border border-[#1e2d4a] shadow-sm hover:shadow-xl hover:border-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex"
                        >
                            {/* Accent bar */}
                            <div className={`w-2 shrink-0 rounded-l-3xl ${isDoneView
                                ? "bg-gradient-to-b from-green-500 to-emerald-400"
                                : "bg-gradient-to-b from-indigo-500 to-indigo-400"
                                }`} />

                            {/* Case No */}
                            <div className="flex items-center justify-center px-6 py-6 border-r border-[#1e2d4a] shrink-0 w-44">
                                <div className="font-mono text-indigo-400 font-extrabold bg-indigo-500/15 border border-indigo-500/25 px-4 py-2.5 rounded-xl text-base text-center shadow-sm">
                                    {c.caseNo}
                                </div>
                            </div>

                            {/* Problem title + date */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center px-7 py-6 border-r border-[#1e2d4a]">
                                <p
                                    className="text-white font-bold text-xl leading-snug truncate"
                                    title={c.problemSummary}
                                >
                                    {c.problemSummary}
                                </p>
                                <p className="flex items-center gap-2 text-slate-400 text-base mt-2 font-medium">
                                    <Calendar className="w-4 h-4 shrink-0" />
                                    {formatDateTime(c.createdAt)}
                                </p>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center justify-center px-6 py-6 border-r border-[#1e2d4a] shrink-0 w-52">
                                <StatusBadgeLarge status={c.status} />
                            </div>

                            {/* Action */}
                            <div className="flex items-center justify-center px-6 py-6 shrink-0">
                                <Link
                                    href={`/admin/cases/${c.id}`}
                                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-base font-bold transition-all shadow-md shadow-indigo-200 hover:shadow-indigo-300/50 whitespace-nowrap"
                                >
                                    จัดการเคส
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-40 text-center bg-[#111a2e] border border-[#1e2d4a] rounded-3xl shadow-sm">
                    <div className="w-24 h-24 mb-8 bg-[#0b1121] rounded-3xl flex items-center justify-center text-5xl shadow-inner border border-[#1e2d4a]">
                        {isDoneView ? "✅" : "🗂️"}
                    </div>
                    <h3 className="text-2xl font-extrabold text-white mb-3">
                        {isDoneView ? "ไม่มีเคสที่เสร็จสิ้น" : "ไม่มีเคสที่กำลังดำเนินการ"}
                    </h3>
                    <p className="text-slate-500 max-w-sm text-base leading-relaxed">
                        {isDoneView
                            ? "ยังไม่มีเคสที่ถูกปิดหรือแก้ไขเสร็จสิ้น"
                            : "ขณะนี้ไม่มีปัญหาที่รอดำเนินการ หากมีการแจ้งปัญหาใหม่จะปรากฏที่นี่"
                        }
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Status Badge Component ──
function StatusBadgeLarge({ status }: { status: string }) {
    const configs: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
        OPEN: {
            label: "รอรับเรื่อง",
            bg: "bg-amber-50",
            text: "text-amber-700",
            border: "border-amber-300",
            dot: "bg-amber-400",
        },
        IN_PROGRESS: {
            label: "กำลังดำเนินการ",
            bg: "bg-blue-50",
            text: "text-blue-700",
            border: "border-blue-300",
            dot: "bg-blue-500",
        },
        WAITING_INFO: {
            label: "รอข้อมูลเพิ่ม",
            bg: "bg-orange-50",
            text: "text-orange-700",
            border: "border-orange-300",
            dot: "bg-orange-400",
        },
        RESOLVED: {
            label: "แก้ไขแล้ว",
            bg: "bg-green-50",
            text: "text-green-700",
            border: "border-green-300",
            dot: "bg-green-500",
        },
        CLOSED: {
            label: "ปิดเคส",
            bg: "bg-slate-100",
            text: "text-slate-600",
            border: "border-slate-300",
            dot: "bg-slate-400",
        },
    };

    const cfg = configs[status] ?? {
        label: status,
        bg: "bg-slate-100",
        text: "text-slate-600",
        border: "border-slate-300",
        dot: "bg-slate-400",
    };

    return (
        <span
            className={`
                inline-flex items-center gap-2.5
                px-5 py-3
                rounded-2xl border-2
                text-base font-extrabold tracking-wide
                ${cfg.bg} ${cfg.text} ${cfg.border}
                shadow-sm
            `}
        >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}