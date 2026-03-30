"use client";

import {
    FileText,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Star,
    TrendingUp,
    Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DashboardMetrics {
    total: number;
    open: number;
    inProgress: number;
    waitingInfo: number;
    resolved: number;
    closed: number;
    breachedSLA: number;
    avgResolutionHours: number;
    casesByCategory: { name: string; value: number }[];
    dailyCounts: { date: string; created: number; resolved: number }[];
    staffStats: { name: string; cases: number }[];
    csatAvg: number;
    csatCount: number;
}

export function DashboardClient({ metrics, filter = "DAY", refDateIso }: { metrics: DashboardMetrics | null, filter?: "DAY" | "MONTH" | "YEAR", refDateIso?: string }) {
    const router = useRouter();

    const currentDate = refDateIso ? new Date(refDateIso) : new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const monthInputValue = `${currentYear}-${currentMonth}`;

    if (!metrics) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-slate-400 text-xl font-semibold">ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูล</p>
            </div>
        );
    }

    const kpiCards = [
        { label: "เคสทั้งหมด", value: metrics.total, icon: FileText, valueColor: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
        { label: "เกิน SLA", value: metrics.breachedSLA, icon: AlertTriangle, valueColor: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
        { label: "เวลาเฉลี่ย (ชม.)", value: `${metrics.avgResolutionHours}h`, icon: Clock, valueColor: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
        { label: "รอดำเนินการ", value: metrics.open + metrics.inProgress + metrics.waitingInfo, icon: TrendingUp, valueColor: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
        { label: "SLA สำเร็จ", value: metrics.total > 0 ? `${(((metrics.total - metrics.breachedSLA) / metrics.total) * 100).toFixed(1)}%` : "100%", icon: CheckCircle2, valueColor: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
        { label: "คะแนนพึงพอใจ", value: `${metrics.csatAvg}/5`, icon: Star, valueColor: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    ];

    const statusData = [
        { label: "เปิดใหม่", count: metrics.open, color: "bg-blue-500" },
        { label: "กำลังดำเนินการ", count: metrics.inProgress, color: "bg-yellow-500" },
        { label: "รอข้อมูลเพิ่มเติม", count: metrics.waitingInfo, color: "bg-orange-500" },
        { label: "แก้ไขแล้ว", count: metrics.resolved + metrics.closed, color: "bg-green-500" },
    ];

    const maxCategory = Math.max(...metrics.casesByCategory.map((c) => c.value), 1);
    const maxStaff = Math.max(...metrics.staffStats.map((s) => s.cases), 1);

    const categoryColors = ["bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-cyan-500", "bg-teal-500"];

    return (
        <div className="w-full space-y-8 font-sans">
            {/* Header */}
            <div>
                <h2 className="text-4xl font-extrabold text-white tracking-tight">แดชบอร์ด</h2>
                <p className="text-lg text-slate-400 mt-2">ภาพรวมสถิติและการดำเนินงานของระบบ Helpdesk</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
                {kpiCards.map((card) => (
                    <div key={card.label} className={`bg-[#111a2e] border ${card.border} rounded-3xl p-6 xl:p-8 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300`}>
                        <card.icon className={`w-10 h-10 mb-5 ${card.valueColor} opacity-80`} />
                        <p className="text-sm xl:text-base text-slate-400 font-semibold mb-2 uppercase tracking-wide leading-tight">{card.label}</p>
                        <p className={`text-4xl xl:text-5xl font-black ${card.valueColor}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Status Distribution */}
                <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-3xl p-8 xl:p-10 shadow-2xl">
                    <h3 className="text-2xl font-extrabold text-white mb-8 pb-5 border-b border-[#1e2d4a]">
                        สถานะเคส
                    </h3>
                    <div className="space-y-7">
                        {statusData.map((item) => {
                            const pct = metrics.total > 0 ? ((item.count / metrics.total) * 100).toFixed(1) : "0";
                            return (
                                <div key={item.label} className="flex items-center gap-5">
                                    <span className="text-base font-bold text-slate-300 w-40 shrink-0">{item.label}</span>
                                    <div className="flex-1 bg-[#0b1121] rounded-full h-12 overflow-hidden shadow-inner border border-[#1e2d4a]">
                                        <div
                                            className={`${item.color} h-full rounded-full transition-all duration-700 flex items-center px-4`}
                                            style={{
                                                width: `${metrics.total > 0 ? (item.count / metrics.total) * 100 : 0}%`,
                                                minWidth: item.count > 0 ? "3.5rem" : "0",
                                            }}
                                        >
                                            {item.count > 0 && <span className="text-white text-base font-bold">{item.count}</span>}
                                        </div>
                                    </div>
                                    <span className="text-xl font-black text-slate-400 w-16 text-right shrink-0">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Cases by Category */}
                <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-3xl p-8 xl:p-10 shadow-2xl">
                    <h3 className="text-2xl font-extrabold text-white mb-8 pb-5 border-b border-[#1e2d4a]">
                        เคสตามประเภท
                    </h3>
                    <div className="flex items-end gap-5 h-72 xl:h-80 mt-6">
                        {metrics.casesByCategory.map((cat, idx) => {
                            const height = (cat.value / maxCategory) * 100;
                            return (
                                <div key={cat.name} className="flex-1 flex flex-col items-center justify-end h-full gap-3 group">
                                    <div
                                        className="w-full flex justify-center relative"
                                        style={{ height: `${height}%`, minHeight: cat.value > 0 ? "8px" : "0" }}
                                    >
                                        {cat.value > 0 && (
                                            <span className="text-base text-white font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 absolute -top-14 bg-slate-800 border border-slate-700 px-5 py-2.5 rounded-2xl shadow-xl z-20 whitespace-nowrap translate-y-2 group-hover:translate-y-0 pointer-events-none">
                                                {cat.value}
                                            </span>
                                        )}
                                        <div
                                            className={`w-full h-full ${categoryColors[idx % categoryColors.length]} rounded-t-xl opacity-90 group-hover:opacity-100 group-hover:brightness-110 group-hover:-translate-y-1 transition-all duration-300`}
                                        />
                                    </div>
                                    <span className="text-sm xl:text-base font-semibold text-slate-400 text-center leading-tight mt-2 px-1 break-words w-full" title={cat.name}>
                                        {cat.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Staff Performance */}
            <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-3xl p-8 xl:p-10 shadow-2xl">
                <h3 className="text-2xl font-extrabold text-white mb-8 pb-5 border-b border-[#1e2d4a] flex items-center gap-4">
                    <Users className="w-8 h-8 text-green-400" />
                    ผลงานเจ้าหน้าที่
                </h3>
                {metrics.staffStats.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {metrics.staffStats.map((staff) => (
                            <div key={staff.name} className="bg-[#0b1121] rounded-2xl p-6 xl:p-8 border border-slate-800 shadow-md">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shrink-0">
                                        <span className="text-indigo-400 font-black text-xl">{staff.name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-lg">{staff.name}</p>
                                        <p className="text-slate-400 text-base font-medium mt-1">{staff.cases} เคส</p>
                                    </div>
                                </div>
                                <div className="bg-[#1a2540] rounded-full h-4 overflow-hidden shadow-inner">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                                        style={{ width: `${(staff.cases / maxStaff) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-xl py-8 text-center">ยังไม่มีข้อมูลผลงาน</p>
                )}
            </div>

            {/* Trend Chart */}
            <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-3xl p-8 xl:p-10 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-5 pb-6 border-b border-[#1e2d4a]">
                    <h3 className="text-2xl font-extrabold text-white">แนวโน้มเคส</h3>
                    <div className="flex gap-4 items-center flex-wrap">
                        <div className="flex gap-2 bg-[#0b1121] rounded-xl p-2 border border-slate-800 shadow-inner">
                            <button onClick={() => { router.push("?filter=DAY"); router.refresh(); }} className={`px-6 py-3 text-base font-bold rounded-lg transition-all ${filter === "DAY" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 hover:text-white hover:bg-[#1a2540]"}`}>สัปดาห์</button>
                            <button onClick={() => { router.push("?filter=MONTH"); router.refresh(); }} className={`px-6 py-3 text-base font-bold rounded-lg transition-all ${filter === "MONTH" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 hover:text-white hover:bg-[#1a2540]"}`}>เดือน</button>
                            <button onClick={() => { router.push("?filter=YEAR"); router.refresh(); }} className={`px-6 py-3 text-base font-bold rounded-lg transition-all ${filter === "YEAR" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 hover:text-white hover:bg-[#1a2540]"}`}>ปี</button>
                        </div>

                        {filter === "MONTH" && (
                            <div className="flex items-center gap-3 bg-[#0b1121] px-5 py-3 rounded-xl border border-slate-700 hover:border-indigo-500 transition-colors shadow-inner">
                                <input
                                    type="month"
                                    value={monthInputValue}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            router.push(`?filter=MONTH&date=${e.target.value}-01`);
                                            router.refresh();
                                        }
                                    }}
                                    className="bg-transparent text-white text-base font-bold min-w-[140px] focus:outline-none cursor-pointer [color-scheme:dark]"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-end gap-3 sm:gap-5 h-72 xl:h-80 pt-10">
                    {metrics.dailyCounts.map((day) => {
                        const maxCount = Math.max(...metrics.dailyCounts.map((d) => d.created), 1);
                        const height = (day.created / maxCount) * 100;

                        let displayLabel = day.date;
                        if (filter === "DAY") {
                            try {
                                const d = new Date(day.date);
                                displayLabel = `${d.getDate()} ${d.toLocaleString("th-TH", { weekday: "short" })}`;
                            } catch { displayLabel = day.date.slice(8); }
                        } else if (filter === "MONTH") {
                            try {
                                const d = new Date(day.date);
                                displayLabel = `${d.getDate()}`;
                            } catch { displayLabel = day.date.slice(8); }
                        } else if (filter === "YEAR") {
                            try {
                                displayLabel = `${parseInt(day.date) + 543}`;
                            } catch { displayLabel = day.date; }
                        }

                        return (
                            <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full gap-3 group">
                                <div
                                    className="w-full flex justify-center relative"
                                    style={{ height: `${height}%`, minHeight: day.created > 0 ? "8px" : "0" }}
                                >
                                    {day.created > 0 && (
                                        <span className="text-base text-white font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 absolute -top-14 bg-slate-800 border border-slate-700 px-5 py-2.5 rounded-2xl shadow-2xl z-20 whitespace-nowrap translate-y-2 group-hover:translate-y-0 pointer-events-none">
                                            {day.created}
                                        </span>
                                    )}
                                    <div
                                        className="w-full h-full bg-gradient-to-t from-emerald-600/80 to-emerald-400 group-hover:from-emerald-400 group-hover:to-emerald-200 rounded-t-lg opacity-90 transition-all duration-300 shadow-[0_0_20px_rgba(52,211,153,0.15)] group-hover:shadow-[0_0_25px_rgba(52,211,153,0.35)]"
                                    />
                                </div>
                                <span className="text-sm xl:text-base font-semibold text-slate-400 whitespace-nowrap text-center mt-3" title={displayLabel}>
                                    {displayLabel}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
