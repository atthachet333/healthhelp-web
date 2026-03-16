"use client";

import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    Bell,
    CheckCircle2,
    Clock3,
    FileText,
    Filter,
    LayoutDashboard,
    MessageSquare,
    PlusCircle,
    Search,
    Settings,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Users,
} from "lucide-react";

const kpis = [
    { label: "เคสทั้งหมด", value: "1,284", change: "+12%", icon: FileText, tone: "emerald" },
    { label: "กำลังดำเนินการ", value: "326", change: "+4%", icon: Activity, tone: "amber" },
    { label: "เกิน SLA", value: "18", change: "-6%", icon: AlertTriangle, tone: "rose" },
    { label: "คะแนน CSAT", value: "4.8/5", change: "+0.3", icon: Sparkles, tone: "sky" },
];

const statusCards = [
    { label: "เปิดใหม่", count: 94, color: "from-blue-500 to-cyan-400" },
    { label: "รอดำเนินการ", count: 126, color: "from-amber-500 to-orange-400" },
    { label: "กำลังแก้ไข", count: 200, color: "from-violet-500 to-indigo-400" },
    { label: "ปิดงานแล้ว", count: 864, color: "from-emerald-500 to-teal-400" },
];

const teamStats = [
    { name: "สมหญิง หัวหน้างาน", cases: 41, sla: "98%" },
    { name: "สมชาย ผู้ดูแลระบบ", cases: 36, sla: "96%" },
    { name: "เจ้าหน้าที่ฝ่ายระบบ", cases: 29, sla: "94%" },
];

const urgentTickets = [
    { id: "TK-2026-0316-0081", subject: "ระบบเวชระเบียนเข้าใช้งานไม่ได้", priority: "วิกฤต", owner: "สมชาย ผู้ดูแลระบบ", status: "กำลังดำเนินการ" },
    { id: "TK-2026-0316-0074", subject: "เครื่องพิมพ์ใบแล็บไม่ตอบสนอง", priority: "สูง", owner: "สมหญิง หัวหน้างาน", status: "รอข้อมูลเพิ่มเติม" },
    { id: "TK-2026-0315-0199", subject: "เครือข่ายห้องตรวจช้า", priority: "สูง", owner: "เจ้าหน้าที่ฝ่ายระบบ", status: "เปิดใหม่" },
];

const timeline = [
    { time: "09:15", title: "รับเคสใหม่จากหน้าเว็บ", detail: "มีการแจ้งปัญหาระบบ HIS จากโรงพยาบาลชุมชน", tone: "blue" },
    { time: "09:40", title: "มอบหมายงานให้เจ้าหน้าที่", detail: "กำหนดผู้รับผิดชอบและตั้ง SLA ภายใน 4 ชั่วโมง", tone: "violet" },
    { time: "10:05", title: "เจ้าหน้าที่ตอบกลับผู้แจ้ง", detail: "ขอข้อมูลเพิ่มเติมพร้อมแนบภาพหน้าจอจากผู้ใช้งาน", tone: "emerald" },
    { time: "10:30", title: "แจ้งเตือนเคสเสี่ยงเกิน SLA", detail: "ระบบแจ้งเตือนเคสเร่งด่วนที่ยังไม่อัปเดตเกิน 45 นาที", tone: "rose" },
];

const toneMap = {
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-300",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-300",
    rose: "from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-300",
    sky: "from-sky-500/20 to-sky-500/5 border-sky-500/20 text-sky-300",
} as const;

export default function TicketDashboardMockup() {
    return (
        <div className="min-h-screen bg-[#07101f] text-white">
            <div className="flex min-h-screen">
                <aside className="hidden xl:flex w-72 shrink-0 flex-col border-r border-white/5 bg-[#0b1426]">
                    <div className="border-b border-white/5 px-6 py-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
                                <LayoutDashboard className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-base font-bold">HealthHelp Mockup</p>
                                <p className="text-xs text-slate-400">Ticket Management Dashboard</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-6">
                        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">เมนูหลัก</p>
                        <div className="mt-4 space-y-2">
                            {[
                                { icon: LayoutDashboard, label: "Dashboard", active: true },
                                { icon: PlusCircle, label: "สร้าง Ticket ใหม่" },
                                { icon: FileText, label: "รายการ Ticket" },
                                { icon: Users, label: "ทีมงาน" },
                                { icon: Bell, label: "การแจ้งเตือน" },
                                { icon: Settings, label: "ตั้งค่าระบบ" },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                                        item.active
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                    }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </nav>

                    <div className="border-t border-white/5 p-4">
                        <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15">
                                    <ShieldCheck className="h-5 w-5 text-cyan-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-100">Mockup Version</p>
                                    <p className="text-xs text-slate-400">ใช้สำหรับนำเสนอแนวทาง UI</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex-1">
                    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0b1426]/95 backdrop-blur-md">
                        <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                            <div>
                                <p className="text-sm text-slate-400">ภาพรวมระบบจัดการ Ticket</p>
                                <h1 className="mt-1 text-2xl font-bold tracking-tight">Dashboard Mockup</h1>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                                    <Search className="h-4 w-4 text-slate-400" />
                                    <span>ค้นหา Ticket / ผู้แจ้ง / ผู้รับผิดชอบ</span>
                                </div>
                                <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200">
                                    <Filter className="h-4 w-4" />
                                    ตัวกรอง
                                </button>
                                <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20">
                                    <PlusCircle className="h-4 w-4" />
                                    สร้าง Ticket
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="space-y-6 px-5 py-6 lg:px-8">
                        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {kpis.map((item) => (
                                <div
                                    key={item.label}
                                    className={`rounded-3xl border bg-gradient-to-br p-5 shadow-xl shadow-black/10 ${toneMap[item.tone]}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm text-slate-300">{item.label}</p>
                                            <p className="mt-3 text-4xl font-black tracking-tight text-white">{item.value}</p>
                                        </div>
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        {item.change} จากช่วงก่อนหน้า
                                    </div>
                                </div>
                            ))}
                        </section>

                        <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.35fr_0.95fr]">
                            <div className="space-y-6">
                                <div className="rounded-[28px] border border-white/5 bg-[#0d172b] p-6 shadow-2xl shadow-black/10">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold">ภาพรวมสถานะ Ticket</h2>
                                            <p className="mt-1 text-sm text-slate-400">สรุปสถานะสำคัญของเคสที่อยู่ในระบบวันนี้</p>
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                                            <Clock3 className="h-3.5 w-3.5" />
                                            อัปเดตล่าสุด 10:45 น.
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        {statusCards.map((item) => (
                                            <div key={item.label} className="rounded-3xl border border-white/5 bg-[#111d34] p-5">
                                                <div className={`h-2 w-20 rounded-full bg-gradient-to-r ${item.color}`} />
                                                <p className="mt-4 text-sm text-slate-400">{item.label}</p>
                                                <p className="mt-2 text-3xl font-black text-white">{item.count}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 rounded-3xl border border-white/5 bg-[#101a2f] p-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold">Ticket ที่ต้องติดตามด่วน</h3>
                                                <p className="text-sm text-slate-400">รายการตัวอย่างสำหรับ mockup นี้</p>
                                            </div>
                                            <button className="inline-flex items-center gap-1 text-sm font-medium text-cyan-300">
                                                ดูทั้งหมด
                                                <ArrowUpRight className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="mt-4 overflow-hidden rounded-2xl border border-white/5">
                                            <table className="w-full text-left">
                                                <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.16em] text-slate-500">
                                                    <tr>
                                                        <th className="px-4 py-3">Ticket</th>
                                                        <th className="px-4 py-3">หัวข้อ</th>
                                                        <th className="px-4 py-3">ผู้รับผิดชอบ</th>
                                                        <th className="px-4 py-3">สถานะ</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {urgentTickets.map((ticket) => (
                                                        <tr key={ticket.id} className="border-t border-white/5 bg-[#0e182c]">
                                                            <td className="px-4 py-4">
                                                                <div>
                                                                    <p className="font-semibold text-white">{ticket.id}</p>
                                                                    <p className="text-xs text-slate-400">{ticket.priority}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-sm text-slate-200">{ticket.subject}</td>
                                                            <td className="px-4 py-4 text-sm text-slate-300">{ticket.owner}</td>
                                                            <td className="px-4 py-4">
                                                                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                                                                    {ticket.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[28px] border border-white/5 bg-[#0d172b] p-6 shadow-2xl shadow-black/10">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold">ผลงานทีมงาน</h2>
                                            <p className="mt-1 text-sm text-slate-400">ตัวอย่างบัตรสรุปภาระงานของเจ้าหน้าที่</p>
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300">
                                            <Users className="h-3.5 w-3.5" />
                                            Team Overview
                                        </div>
                                    </div>

                                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                                        {teamStats.map((member) => (
                                            <div key={member.name} className="rounded-3xl border border-white/5 bg-[#111d34] p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-lg font-bold text-violet-300">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white">{member.name}</p>
                                                        <p className="text-sm text-slate-400">{member.cases} เคสที่รับผิดชอบ</p>
                                                    </div>
                                                </div>
                                                <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#0b1426]">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                                                        style={{ width: `${Math.min(member.cases * 2.2, 100)}%` }}
                                                    />
                                                </div>
                                                <div className="mt-3 flex items-center justify-between text-xs">
                                                    <span className="text-slate-400">SLA success</span>
                                                    <span className="font-semibold text-emerald-300">{member.sla}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-[28px] border border-white/5 bg-[#0d172b] p-6 shadow-2xl shadow-black/10">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold">กิจกรรมล่าสุด</h2>
                                            <p className="mt-1 text-sm text-slate-400">ตัวอย่าง timeline แบบอ่านง่าย</p>
                                        </div>
                                        <MessageSquare className="h-5 w-5 text-cyan-300" />
                                    </div>

                                    <div className="mt-6 space-y-5">
                                        {timeline.map((item) => (
                                            <div key={`${item.time}-${item.title}`} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className={`h-3 w-3 rounded-full ${item.tone === "blue" ? "bg-blue-500" : item.tone === "violet" ? "bg-violet-500" : item.tone === "emerald" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                                    <div className="mt-2 h-full w-px bg-white/10" />
                                                </div>
                                                <div className="pb-2">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.time}</p>
                                                    <p className="mt-1 font-semibold text-white">{item.title}</p>
                                                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{item.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-[28px] border border-white/5 bg-[#0d172b] p-6 shadow-2xl shadow-black/10">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold">สรุปคุณภาพงาน</h2>
                                            <p className="mt-1 text-sm text-slate-400">ตัวอย่าง insight card สำหรับผู้บริหาร</p>
                                        </div>
                                        <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                                    </div>

                                    <div className="mt-5 space-y-4">
                                        {[
                                            { label: "ปิดงานภายใน SLA", value: "91%", hint: "ดีขึ้นจากสัปดาห์ก่อน" },
                                            { label: "เวลาเฉลี่ยตอบกลับครั้งแรก", value: "14 นาที", hint: "เป้าหมายไม่เกิน 20 นาที" },
                                            { label: "คะแนนความพึงพอใจ", value: "4.8 / 5", hint: "จากแบบประเมินล่าสุด 126 รายการ" },
                                        ].map((item) => (
                                            <div key={item.label} className="rounded-2xl border border-white/5 bg-[#101a2f] p-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <p className="text-sm text-slate-400">{item.label}</p>
                                                        <p className="mt-1 text-2xl font-bold text-white">{item.value}</p>
                                                    </div>
                                                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                                                        {item.hint}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
