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
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500">ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูล</p>
            </div>
        );
    }

    const kpiCards = [
        { label: "เคสทั้งหมด", value: metrics.total, icon: FileText, valueColor: "text-green-400", bg: "bg-green-500/5", border: "border-green-500/20" },
        { label: "เกิน SLA", value: metrics.breachedSLA, icon: AlertTriangle, valueColor: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/20" },
        { label: "เวลาเฉลี่ย", value: `${metrics.avgResolutionHours}h`, icon: Clock, valueColor: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/20" },
        { label: "รอดำเนินการ", value: metrics.open + metrics.inProgress + metrics.waitingInfo, icon: TrendingUp, valueColor: "text-yellow-400", bg: "bg-yellow-500/5", border: "border-yellow-500/20" },
        { label: "SLA สำเร็จ", value: metrics.total > 0 ? `${(((metrics.total - metrics.breachedSLA) / metrics.total) * 100).toFixed(1)}%` : "100%", icon: CheckCircle2, valueColor: "text-indigo-400", bg: "bg-indigo-500/5", border: "border-indigo-500/20" },
        { label: "คะแนนพึงพอใจ", value: `${metrics.csatAvg}/5`, icon: Star, valueColor: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/20" },
    ];

    const statusData = [
        { label: "เปิดใหม่", count: metrics.open, color: "bg-blue-500" },
        { label: "กำลังดำเนินการ", count: metrics.inProgress, color: "bg-yellow-500" },
        { label: "รอข้อมูลเพิ่มเติม", count: metrics.waitingInfo, color: "bg-orange-500" },
        { label: "แก้ไขแล้ว", count: metrics.resolved + metrics.closed, color: "bg-green-500" },
    ];

    const maxCategory = Math.max(...metrics.casesByCategory.map((c) => c.value), 1);
    const maxStaff = Math.max(...metrics.staffStats.map((s) => s.cases), 1);

    // Color palette for category bars
    const categoryColors = ["bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-cyan-500", "bg-teal-500"];

    return (
        <div className="w-full space-y-5">
            {/* Header */}
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    แดชบอร์ด
                </h2>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {kpiCards.map((card) => (
                    <div key={card.label} className={`bg-[#111a2e] border ${card.border} rounded-xl p-5 shadow-lg`}>
                        <p className="text-xs text-slate-400 font-medium mb-3 uppercase tracking-wider">{card.label}</p>
                        <p className={`text-4xl font-extrabold ${card.valueColor}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Status Distribution */}
                <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 shadow-md">
                    <h3 className="text-lg font-bold text-white mb-6">
                        สถานะเคส
                    </h3>
                    <div className="space-y-5">
                        {statusData.map((item) => {
                            const pct = metrics.total > 0 ? ((item.count / metrics.total) * 100).toFixed(1) : "0";
                            return (
                                <div key={item.label} className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-slate-300 w-32">{item.label}</span>
                                    <div className="flex-1 bg-[#0b1121] rounded-full h-8 overflow-hidden shadow-inner">
                                        <div
                                            className={`${item.color} h-full rounded-full transition-all duration-500 relative flex items-center px-3`}
                                            style={{
                                                width: `${metrics.total > 0 ? (item.count / metrics.total) * 100 : 0}%`,
                                                minWidth: item.count > 0 ? "2.5rem" : "0",
                                            }}
                                        >
                                            {item.count > 0 && <span className="text-white text-xs font-bold shadow-sm">{item.count}</span>}
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-400 w-16 text-right">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Cases by Category */}
                <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 shadow-md">
                    <h3 className="text-lg font-bold text-white mb-6">
                        เคสตามประเภท
                    </h3>
                    <div className="flex items-end gap-4 h-64 mt-4">
                        {metrics.casesByCategory.map((cat, idx) => {
                            const height = (cat.value / maxCategory) * 100;
                            return (
                                <div key={cat.name} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
                                    <div
                                        className="w-full flex justify-center relative"
                                        style={{ height: `${height}%`, minHeight: cat.value > 0 ? "6px" : "0" }}
                                    >
                                        {cat.value > 0 && (
                                            <span className="text-sm text-white font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 absolute -top-10 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg shadow-xl z-20 whitespace-nowrap translate-y-2 group-hover:translate-y-0 pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-800">
                                                {cat.value}
                                            </span>
                                        )}
                                        <div
                                            className={`w-full h-full ${categoryColors[idx % categoryColors.length]} rounded-t transition-all duration-500 relative opacity-90 shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:opacity-100 group-hover:brightness-110`}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-slate-400 text-center leading-tight mt-1 px-1 break-words w-full" title={cat.name}>
                                        {cat.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Staff Performance */}
            <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 shadow-md mt-5">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-400" />
                    ผลงานเจ้าหน้าที่
                </h3>
                {metrics.staffStats.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {metrics.staffStats.map((staff) => {
                            return (
                                <div key={staff.name} className="bg-[#0b1121] rounded-xl p-5 border border-slate-800">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-inner">
                                            <span className="text-indigo-400 font-extrabold text-lg">{staff.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold text-base">{staff.name}</p>
                                            <p className="text-slate-400 text-sm font-medium mt-0.5">{staff.cases} เคสที่รับผิดชอบ</p>
                                        </div>
                                    </div>
                                    <div className="bg-[#1a2540] rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-green-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                            style={{ width: `${(staff.cases / maxStaff) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-slate-500 text-base py-4 text-center">ยังไม่มีข้อมูลผลงาน</p>
                )}
            </div>

            {/* Trend Chart */}
            <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-6 mt-5 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <h3 className="text-lg font-bold text-white">
                        แนวโน้มเคส
                    </h3>
                    <div className="flex gap-4 items-center flex-wrap">
                        <div className="flex gap-1.5 bg-[#0b1121] rounded-lg p-1.5 border border-slate-800">
                            <button onClick={() => { router.push("?filter=DAY"); router.refresh(); }} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${filter === "DAY" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "text-slate-400 hover:text-white"}`}>สัปดาห์</button>
                            <button onClick={() => { router.push("?filter=MONTH"); router.refresh(); }} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${filter === "MONTH" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "text-slate-400 hover:text-white"}`}>เดือน</button>
                            <button onClick={() => { router.push("?filter=YEAR"); router.refresh(); }} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${filter === "YEAR" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "text-slate-400 hover:text-white"}`}>ปี</button>
                        </div>

                        {filter === "MONTH" && (
                            <div className="flex items-center gap-2 bg-[#0b1121] px-3 py-2 rounded-lg border border-slate-700 hover:border-indigo-500 transition-colors">
                                <input
                                    type="month"
                                    value={monthInputValue}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            router.push(`?filter=MONTH&date=${e.target.value}-01`);
                                            router.refresh();
                                        }
                                    }}
                                    className="bg-transparent text-white text-sm font-bold min-w-[120px] focus:outline-none cursor-pointer [color-scheme:dark]"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-end gap-2 sm:gap-4 h-64 pt-10">
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
                            <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group">
                                <div
                                    className="w-full flex justify-center relative"
                                    style={{ height: `${height}%`, minHeight: day.created > 0 ? "4px" : "0" }}
                                >
                                    {day.created > 0 && (
                                        <span className="text-sm text-white font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 absolute -top-10 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded shadow-xl z-20 whitespace-nowrap translate-y-2 group-hover:translate-y-0 pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-800">
                                            {day.created}
                                        </span>
                                    )}
                                    <div
                                        className="w-full h-full bg-gradient-to-t from-emerald-600/80 to-emerald-400 group-hover:from-emerald-400 group-hover:to-emerald-200 rounded-t-sm transition-all duration-300 shadow-[0_0_15px_rgba(52,211,153,0.1)] group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]"
                                    />
                                </div>
                                <span className="text-xs font-bold text-slate-400 whitespace-nowrap max-w-[48px] md:max-w-none text-center mt-1" title={displayLabel}>
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
