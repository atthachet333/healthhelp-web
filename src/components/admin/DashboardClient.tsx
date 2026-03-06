"use client";

import {
    FileText,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Star,
    TrendingUp,
    BarChart3,
    Users,
    LayoutDashboard,
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
        {
            label: "เคสทั้งหมด",
            value: metrics.total,
            icon: FileText,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
        },
        {
            label: "รอดำเนินการ",
            value: metrics.open + metrics.inProgress + metrics.waitingInfo,
            icon: Clock,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20",
        },
        {
            label: "เกิน SLA",
            value: metrics.breachedSLA,
            icon: AlertTriangle,
            color: "text-red-400",
            bg: "bg-red-500/10",
            border: "border-red-500/20",
        },
        {
            label: "ปิดเคสแล้ว",
            value: metrics.resolved + metrics.closed,
            icon: CheckCircle2,
            color: "text-green-400",
            bg: "bg-green-500/10",
            border: "border-green-500/20",
        },
        {
            label: "เวลาเฉลี่ย (ชม.)",
            value: metrics.avgResolutionHours,
            icon: TrendingUp,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
            border: "border-indigo-500/20",
        },
        {
            label: "CSAT เฉลี่ย",
            value: `${metrics.csatAvg}/5`,
            icon: Star,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
        },
    ];

    const statusData = [
        { label: "เปิดใหม่", count: metrics.open, color: "bg-blue-500" },
        { label: "กำลังดำเนินการ", count: metrics.inProgress, color: "bg-yellow-500" },
        { label: "รอข้อมูล", count: metrics.waitingInfo, color: "bg-orange-500" },
        { label: "แก้ไขแล้ว", count: metrics.resolved, color: "bg-green-500" },
        { label: "ปิดเคส", count: metrics.closed, color: "bg-slate-500" },
    ];

    const maxCategory = Math.max(...metrics.casesByCategory.map((c) => c.value), 1);
    const maxStaff = Math.max(...metrics.staffStats.map((s) => s.cases), 1);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <LayoutDashboard className="w-6 h-6 text-indigo-400" />
                    แดชบอร์ด
                </h2>
                <p className="text-slate-500 text-sm">ภาพรวมระบบจัดการเคส HealthHelp</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {kpiCards.map((card) => (
                    <div key={card.label} className={`card ${card.border} ${card.bg}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                            <span className="text-xs text-slate-400 font-medium">{card.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                        สถานะเคส
                    </h3>
                    <div className="space-y-3">
                        {statusData.map((item) => (
                            <div key={item.label} className="flex items-center gap-3">
                                <span className="text-sm text-slate-400 w-32">{item.label}</span>
                                <div className="flex-1 bg-slate-800 rounded-full h-6 overflow-hidden">
                                    <div
                                        className={`${item.color} h-full rounded-full transition-all duration-500 flex items-center pl-2`}
                                        style={{
                                            width: `${metrics.total > 0 ? (item.count / metrics.total) * 100 : 0}%`,
                                            minWidth: item.count > 0 ? "2rem" : "0",
                                        }}
                                    >
                                        <span className="text-xs text-white font-bold">{item.count}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cases by Category */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        เคสตามประเภท
                    </h3>
                    <div className="space-y-3">
                        {metrics.casesByCategory.map((cat) => (
                            <div key={cat.name} className="flex items-center gap-3">
                                <span className="text-sm text-slate-400 w-36 truncate">{cat.name}</span>
                                <div className="flex-1 bg-slate-800 rounded-full h-6 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full rounded-full transition-all duration-500 flex items-center pl-2"
                                        style={{ width: `${(cat.value / maxCategory) * 100}%`, minWidth: "2rem" }}
                                    >
                                        <span className="text-xs text-white font-bold">{cat.value}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Staff Performance */}
            <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-400" />
                    ประสิทธิภาพเจ้าหน้าที่
                </h3>
                {metrics.staffStats.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {metrics.staffStats.map((staff) => (
                            <div key={staff.name} className="bg-slate-800/50 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                        <span className="text-indigo-400 font-bold">{staff.name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{staff.name}</p>
                                        <p className="text-slate-500 text-xs">{staff.cases} เคส</p>
                                    </div>
                                </div>
                                <div className="bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${(staff.cases / maxStaff) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-sm">ยังไม่มีข้อมูล</p>
                )}
            </div>

            {/* Trend Chart */}
            <div className="card">
                <div className="flex flex-col mb-6 gap-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-indigo-400" />
                        สถิติเคส ({filter === "DAY" ? "สัปดาห์นี้" : filter === "MONTH" ? "รายเดือน" : "รายปี"})
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full">
                        <div className="flex gap-2 bg-slate-800/80 rounded-xl p-2 shadow-inner w-full sm:w-fit">
                            <button onClick={() => { router.push("?filter=DAY"); router.refresh(); }} className={`flex-1 sm:min-w-[120px] py-3 text-lg sm:py-3.5 sm:text-lg font-bold rounded-lg transition-all ${filter === "DAY" ? "bg-indigo-500 text-white shadow-md scale-100" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}>สัปดาห์</button>
                            <button onClick={() => { router.push("?filter=MONTH"); router.refresh(); }} className={`flex-1 sm:min-w-[120px] py-3 text-lg sm:py-3.5 sm:text-lg font-bold rounded-lg transition-all ${filter === "MONTH" ? "bg-indigo-500 text-white shadow-md scale-100" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}>เดือน</button>
                            <button onClick={() => { router.push("?filter=YEAR"); router.refresh(); }} className={`flex-1 sm:min-w-[120px] py-3 text-lg sm:py-3.5 sm:text-lg font-bold rounded-lg transition-all ${filter === "YEAR" ? "bg-indigo-500 text-white shadow-md scale-100" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}>ปี</button>
                        </div>

                        {filter === "MONTH" && (
                            <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
                                <span className="text-slate-400 text-sm font-medium px-2">เลือกเดือน:</span>
                                <input
                                    type="month"
                                    value={monthInputValue}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            router.push(`?filter=MONTH&date=${e.target.value}-01`);
                                            router.refresh();
                                        }
                                    }}
                                    className="bg-transparent text-white font-bold px-2 py-1 focus:outline-none cursor-pointer"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-end gap-1 sm:gap-2 h-40 pt-8 mt-2">
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
                            <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group relative">
                                {day.created > 0 && (
                                    <span className="text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 bg-slate-800 px-2 py-1 rounded-md shadow-md z-10 whitespace-nowrap">
                                        {day.created} เคส
                                    </span>
                                )}
                                <div
                                    className="w-full bg-gradient-to-t from-emerald-600/50 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 rounded-t-sm transition-all duration-300 relative overflow-hidden"
                                    style={{ height: `${height}%`, minHeight: day.created > 0 ? "4px" : "0" }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                                </div>
                                <span className="text-[10px] text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[40px] md:max-w-none text-center" title={displayLabel}>
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
