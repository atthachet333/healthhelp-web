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
                <p className="text-slate-400 text-xl font-semibold animate-pulse">กำลังโหลดข้อมูล หรือไม่สามารถเชื่อมต่อฐานข้อมูลได้...</p>
            </div>
        );
    }

    const kpiCards = [
        { label: "เคสทั้งหมด", value: metrics.total, icon: FileText, valueColor: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", shadowHover: "hover:shadow-emerald-500/20" },
        { label: "เกิน SLA", value: metrics.breachedSLA, icon: AlertTriangle, valueColor: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", shadowHover: "hover:shadow-rose-500/20" },
        { label: "เวลาเฉลี่ย (ชม.)", value: `${metrics.avgResolutionHours}h`, icon: Clock, valueColor: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", shadowHover: "hover:shadow-blue-500/20" },
        { label: "รอดำเนินการ", value: metrics.open + metrics.inProgress + metrics.waitingInfo, icon: TrendingUp, valueColor: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", shadowHover: "hover:shadow-amber-500/20" },
        { label: "SLA สำเร็จ", value: metrics.total > 0 ? `${(((metrics.total - metrics.breachedSLA) / metrics.total) * 100).toFixed(1)}%` : "100%", icon: CheckCircle2, valueColor: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", shadowHover: "hover:shadow-indigo-500/20" },
        { label: "คะแนนพึงพอใจ", value: `${metrics.csatAvg}/5`, icon: Star, valueColor: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", shadowHover: "hover:shadow-yellow-500/20" },
    ];

    const statusData = [
        { label: "เปิดใหม่", count: metrics.open, color: "bg-blue-500 shadow-blue-500/50" },
        { label: "กำลังดำเนินการ", count: metrics.inProgress, color: "bg-amber-500 shadow-amber-500/50" },
        { label: "รอข้อมูลเพิ่มเติม", count: metrics.waitingInfo, color: "bg-orange-500 shadow-orange-500/50" },
        { label: "แก้ไขแล้ว", count: metrics.resolved + metrics.closed, color: "bg-emerald-500 shadow-emerald-500/50" },
    ];

    const maxCategory = Math.max(...metrics.casesByCategory.map((c) => c.value), 1);
    const maxStaff = Math.max(...metrics.staffStats.map((s) => s.cases), 1);

    const categoryColors = [
        "bg-gradient-to-t from-blue-600 to-blue-400 shadow-blue-500/20",
        "bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-indigo-500/20",
        "bg-gradient-to-t from-purple-600 to-purple-400 shadow-purple-500/20",
        "bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-cyan-500/20",
        "bg-gradient-to-t from-teal-600 to-teal-400 shadow-teal-500/20"
    ];

    return (
        <div className="w-full space-y-8 font-sans">
            {/* Header */}
            <div>
                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 w-fit pb-1">
                    แดชบอร์ด
                </h2>
                <p className="text-lg text-slate-400 mt-2 font-medium">ภาพรวมสถิติและการดำเนินงานของระบบ HealthHelp</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
                {kpiCards.map((card) => (
                    <div key={card.label} className={`group bg-[#111a2e] border ${card.border} rounded-3xl p-6 xl:p-8 shadow-xl hover:-translate-y-1 ${card.shadowHover} hover:bg-[#15213a] transition-all duration-300 relative overflow-hidden`}>
                        {/* Glow effect พื้นหลังบางๆ ตอน hover */}
                        <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full ${card.bg} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                        <div className="relative z-10">
                            <card.icon className={`w-10 h-10 mb-5 ${card.valueColor} opacity-80 group-hover:scale-110 transition-transform duration-300`} />
                            <p className="text-sm xl:text-base text-slate-400 font-semibold mb-2 uppercase tracking-wide leading-tight">{card.label}</p>
                            <p className={`text-4xl xl:text-5xl font-black ${card.valueColor} drop-shadow-md`}>{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Status Distribution */}
                <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-3xl p-8 xl:p-10 shadow-2xl hover:border-[#2a3f66] transition-colors duration-300">
                    <h3 className="text-2xl font-extrabold text-white mb-8 pb-5 border-b border-[#1e2d4a] flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-indigo-400" />
                        สถานะเคส
                    </h3>
                    <div className="space-y-7">
                        {statusData.map((item) => {
                            const pct = metrics.total > 0 ? ((item.count / metrics.total) * 100).toFixed(1) : "0";
                            return (
                                <div key={item.label} className="flex items-center gap-5 group">
                                    <span className="text-base font-bold text-slate-300 w-40 shrink-0 group-hover:text-white transition-colors">{item.label}</span>
                                    <div className="flex-1 bg-[#0b1121] rounded-full h-12 overflow-hidden shadow-inner border border-[#1e2d4a]">
                                        <div
                                            className={`${item.color} h-full rounded-full transition-all duration-1000 ease-out flex items-center px-4 shadow-lg`}
                                            style={{
                                                width: `${metrics.total > 0 ? (item.count / metrics.total) * 100 : 0}%`,
                                                minWidth: item.count > 0 ? "3.5rem" : "0",
                                            }}
                                        >
                                            {item.count > 0 && <span className="text-white text-base font-bold drop-shadow-md">{item.count}</span>}
                                        </div>
                                    </div>
                                    <span className="text-xl font-black text-slate-400 w-16 text-right shrink-0 group-hover:text-slate-300 transition-colors">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Cases by Category */}
                <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-3xl p-8 xl:p-10 shadow-2xl hover:border-[#2a3f66] transition-colors duration-300">
                    <h3 className="text-2xl font-extrabold text-white mb-8 pb-5 border-b border-[#1e2d4a] flex items-center gap-3">
                        <FileText className="w-6 h-6 text-cyan-400" />
                        เคสตามประเภท
                    </h3>
                    <div className="flex items-end gap-3 sm:gap-5 h-72 xl:h-80 mt-6">
                        {metrics.casesByCategory.map((cat, idx) => {
                            const height = (cat.value / maxCategory) * 100;
                            return (
                                <div key={cat.name} className="flex-1 flex flex-col items-center justify-end h-full gap-3 group relative">
                                    <div
                                        className="w-full flex justify-center relative"
                                        style={{ height: `${height}%`, minHeight: cat.value > 0 ? "8px" : "0" }}
                                    >
                                        {cat.value > 0 && (
                                            <span className="text-base text-white font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 absolute -top-14 bg-slate-800 border border-slate-600 px-5 py-2.5 rounded-2xl shadow-xl z-20 whitespace-nowrap translate-y-2 group-hover:translate-y-0 pointer-events-none">
                                                {cat.value}
                                            </span>
                                        )}
                                        <div
                                            className={`w-full h-full ${categoryColors[idx % categoryColors.length]} rounded-t-xl opacity-80 group-hover:opacity-100 group-hover:brightness-125 group-hover:-translate-y-1 transition-all duration-300 shadow-lg`}
                                        />
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold text-slate-400 text-center leading-tight mt-2 px-1 break-words w-full h-10 group-hover:text-slate-200 transition-colors" title={cat.name}>
                                        {cat.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Staff Performance */}
            <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-3xl p-8 xl:p-10 shadow-2xl hover:border-[#2a3f66] transition-colors duration-300">
                <h3 className="text-2xl font-extrabold text-white mb-8 pb-5 border-b border-[#1e2d4a] flex items-center gap-4">
                    <Users className="w-8 h-8 text-emerald-400" />
                    ผลงานเจ้าหน้าที่
                </h3>
                {metrics.staffStats.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {metrics.staffStats.map((staff) => (
                            <div key={staff.name} className="group bg-[#0b1121] rounded-2xl p-6 xl:p-8 border border-[#1e2d4a] hover:border-emerald-500/50 hover:bg-[#131d33] transition-all duration-300 shadow-md">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0 group-hover:scale-105 transition-transform">
                                        <span className="text-emerald-400 font-black text-xl">{staff.name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-lg group-hover:text-emerald-300 transition-colors">{staff.name}</p>
                                        <p className="text-slate-400 text-base font-medium mt-1">{staff.cases} เคส</p>
                                    </div>
                                </div>
                                <div className="bg-[#1a2540] rounded-full h-4 overflow-hidden shadow-inner">
                                    <div
                                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                                        style={{ width: `${(staff.cases / maxStaff) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-xl py-8 text-center bg-[#0b1121] rounded-2xl border border-[#1e2d4a]">ยังไม่มีข้อมูลผลงานในขณะนี้</p>
                )}
            </div>

            {/* Trend Chart */}
            <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-3xl p-8 xl:p-10 shadow-2xl hover:border-[#2a3f66] transition-colors duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-5 pb-6 border-b border-[#1e2d4a]">
                    <h3 className="text-2xl font-extrabold text-white flex items-center gap-3">
                        <Clock className="w-6 h-6 text-blue-400" />
                        แนวโน้มเคส
                    </h3>
                    <div className="flex gap-4 items-center flex-wrap">
                        <div className="flex gap-2 bg-[#0b1121] rounded-xl p-1.5 border border-[#1e2d4a] shadow-inner">
                            <button onClick={() => { router.push("?filter=DAY"); router.refresh(); }} className={`px-6 py-2.5 text-sm sm:text-base font-bold rounded-lg transition-all duration-300 ${filter === "DAY" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 hover:text-white hover:bg-[#1a2540]"}`}>สัปดาห์</button>
                            <button onClick={() => { router.push("?filter=MONTH"); router.refresh(); }} className={`px-6 py-2.5 text-sm sm:text-base font-bold rounded-lg transition-all duration-300 ${filter === "MONTH" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 hover:text-white hover:bg-[#1a2540]"}`}>เดือน</button>
                            <button onClick={() => { router.push("?filter=YEAR"); router.refresh(); }} className={`px-6 py-2.5 text-sm sm:text-base font-bold rounded-lg transition-all duration-300 ${filter === "YEAR" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 hover:text-white hover:bg-[#1a2540]"}`}>ปี</button>
                        </div>

                        {filter === "MONTH" && (
                            <div className="flex items-center gap-3 bg-[#0b1121] px-5 py-2.5 rounded-xl border border-[#1e2d4a] hover:border-indigo-500 transition-colors shadow-inner">
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

                <div className="flex items-end gap-2 sm:gap-4 h-72 xl:h-80 pt-10">
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
                            <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full gap-3 group relative">
                                <div
                                    className="w-full flex justify-center relative"
                                    style={{ height: `${height}%`, minHeight: day.created > 0 ? "8px" : "0" }}
                                >
                                    {day.created > 0 && (
                                        <span className="text-sm sm:text-base text-white font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 absolute -top-14 bg-slate-800 border border-slate-600 px-4 py-2 rounded-xl shadow-xl z-20 whitespace-nowrap translate-y-2 group-hover:translate-y-0 pointer-events-none">
                                            {day.created}
                                        </span>
                                    )}
                                    <div
                                        className="w-full h-full bg-gradient-to-t from-indigo-600/80 to-indigo-400 group-hover:from-indigo-400 group-hover:to-indigo-300 rounded-t-lg opacity-80 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                                    />
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-slate-400 whitespace-nowrap text-center mt-2 group-hover:text-slate-200 transition-colors" title={displayLabel}>
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