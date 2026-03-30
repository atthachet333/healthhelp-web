import Link from "next/link";
import { CreateCaseForm } from "@/components/public/CreateCaseForm";
import { FAQSection } from "@/components/public/FAQSection";
import { getCategories } from "@/app/actions/case-actions";
import {
    HeartPulse, Search, Phone, Mail, FileText,
    CheckCircle2, ClipboardList, Headphones,
    ArrowRight, Clock, ShieldCheck, Star,
} from "lucide-react";

export default async function HomePage() {
    const categories = await getCategories();

    return (
        <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50/40 font-sans">

            {/* ── HEADER ──────────────────────────────── */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200/70 shadow-sm w-full">
                <div className="flex items-center justify-center w-full">
                    <div className="w-full max-w-5xl px-6 sm:px-10 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/25">
                                <HeartPulse className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent leading-tight whitespace-nowrap">
                                    HealthHelp
                                </h1>
                                <p className="text-sm text-slate-400 font-medium -mt-0.5">ระบบรับแจ้งปัญหา</p>
                            </div>
                        </Link>

                        <nav className="hidden md:flex items-center gap-2">
                            <Link href="/" className="px-5 py-2.5 text-lg font-semibold text-blue-700 bg-blue-50 rounded-xl border border-blue-200 whitespace-nowrap">
                                หน้าแรก
                            </Link>
                            <Link href="/track" className="px-5 py-2.5 text-lg font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors whitespace-nowrap">
                                ติดตามเคส
                            </Link>
                            <Link href="/contact" className="px-5 py-2.5 text-lg font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors whitespace-nowrap">
                                ติดต่อเรา
                            </Link>
                        </nav>

                        <div className="flex items-center gap-3">
                            <Link href="/track" className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-lg font-semibold text-blue-700 whitespace-nowrap">
                                <Search className="w-5 h-5" /> ติดตาม
                            </Link>
                            <Link href="/admin/login" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-xl text-lg font-bold shadow-md shadow-slate-500/25 hover:scale-[1.02] transition-all whitespace-nowrap">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="hidden sm:inline">เข้าสู่ระบบแอดมิน</span>
                                <span className="sm:hidden">แอดมิน</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── MAIN CONTENT ──────────────────────── */}
            <main className="flex flex-col items-center w-full flex-1">

                {/* ── HERO ─────────────────────────────── */}
                <section className="w-full max-w-5xl px-6 sm:px-10 pt-16 pb-16 flex flex-col items-center text-center gap-10">

                    {/* Service badge */}
                    <span className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 border border-blue-200 rounded-full text-blue-700 font-bold text-lg">
                        <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                        บริการช่วยเหลือพร้อมรับเรื่อง 24 ชั่วโมง
                    </span>

                    {/* Heading + description */}
                    <div className="flex flex-col items-center gap-5 w-full">
                        <h2 className="text-5xl md:text-6xl font-extrabold text-slate-800 leading-tight">
                            แจ้งปัญหาสะดวก&nbsp;
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                ไม่ต้องรอนาน
                            </span>
                        </h2>
                        <p className="text-2xl text-slate-500 font-medium leading-relaxed max-w-3xl">
                            เพียงกรอกข้อมูลไม่กี่ขั้นตอน เจ้าหน้าที่จะติดต่อกลับโดยเร็ว<br className="hidden sm:block" />
                            พร้อมรหัสติดตาม สถานะได้ตลอดเวลา
                        </p>
                    </div>

                    {/* Hero CTA */}
                    <div className="flex flex-col sm:flex-row gap-5 w-full max-w-xl mx-auto">
                        <a
                            href="#new-case"
                            className="flex items-center justify-center gap-3 px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl text-2xl font-extrabold shadow-xl shadow-blue-500/30 hover:shadow-blue-500/45 hover:scale-[1.03] transition-all flex-1"
                        >
                            <ClipboardList className="w-7 h-7 shrink-0" />
                            แจ้งปัญหาใหม่
                        </a>
                        <Link
                            href="/track"
                            className="flex items-center justify-center gap-3 px-8 py-6 bg-white border-2 border-blue-300 text-blue-700 rounded-3xl text-2xl font-extrabold shadow-md hover:border-blue-500 hover:bg-blue-50 transition-all flex-1"
                        >
                            <Search className="w-7 h-7 shrink-0" />
                            ติดตามสถานะ
                        </Link>
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap justify-center gap-4">
                        {[
                            { icon: <ShieldCheck className="w-6 h-6 text-green-600" />, text: "ปลอดภัย น่าเชื่อถือ" },
                            { icon: <Clock className="w-6 h-6 text-blue-600" />, text: "ตอบกลับใน 24 ชม." },
                            { icon: <Star className="w-6 h-6 text-amber-500" />, text: "ความพึงพอใจ 95%" },
                        ].map((b, i) => (
                            <div key={i} className="flex items-center gap-2 text-slate-600 font-semibold text-lg bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm">
                                {b.icon} {b.text}
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── DIVIDER ──────────────────────────── */}
                <div className="w-full max-w-5xl px-6 sm:px-10">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                </div>

                {/* ── 3 QUICK ACTIONS ──────────────────── */}
                <section className="w-full max-w-5xl px-6 sm:px-10 pt-16 pb-20">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <a href="#new-case" className="group flex flex-col items-center gap-6 p-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-3xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all cursor-pointer">
                            <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <ClipboardList className="w-12 h-12 text-white" />
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-extrabold">แจ้งปัญหาใหม่</p>
                                <p className="text-blue-100 text-lg mt-2 font-medium">กรอกข้อมูลรับเรื่องทันที</p>
                            </div>
                            <div className="flex items-center gap-2 text-white/80 text-lg font-bold">
                                กดที่นี่ <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </a>

                        <Link href="/track" className="group flex flex-col items-center gap-6 p-10 bg-white rounded-3xl border-2 border-slate-200 shadow-lg hover:border-green-300 hover:shadow-xl hover:-translate-y-1 transition-all">
                            <div className="w-24 h-24 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                <Search className="w-12 h-12 text-green-600" />
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-extrabold text-slate-800">ติดตามสถานะ</p>
                                <p className="text-slate-500 text-lg mt-2 font-medium">เช็คความคืบหน้าเคส</p>
                            </div>
                            <div className="flex items-center gap-2 text-green-600 text-lg font-bold">
                                กดที่นี่ <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>

                        <Link href="/contact" className="group flex flex-col items-center gap-6 p-10 bg-white rounded-3xl border-2 border-slate-200 shadow-lg hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 transition-all">
                            <div className="w-24 h-24 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                <Headphones className="w-12 h-12 text-indigo-600" />
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-extrabold text-slate-800">ติดต่อเจ้าหน้าที่</p>
                                <p className="text-slate-500 text-lg mt-2 font-medium">โทรหรืออีเมลตรง</p>
                            </div>
                            <div className="flex items-center gap-2 text-indigo-600 text-lg font-bold">
                                กดที่นี่ <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    </div>
                </section>

                {/* ── HOW TO USE ───────────────────────── */}
                <section className="w-full max-w-5xl px-6 sm:px-10 pt-4 pb-20">
                    <div className="text-center mb-16">
                        <span className="inline-block px-6 py-3 bg-blue-50 text-blue-700 font-bold text-lg rounded-full mb-5 border border-blue-200">
                            📋 วิธีใช้งาน
                        </span>
                        <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-800">เพียง 3 ขั้นตอน ง่ายมาก!</h2>
                        <p className="text-slate-500 mt-4 text-xl">ไม่ซับซ้อน ไม่ต้องมีความรู้ด้านคอมพิวเตอร์</p>
                    </div>

                    {/* Step cards — badge now flows inside the card, no absolute positioning */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: "1", icon: <ClipboardList className="w-12 h-12 text-blue-600" />, iconBg: "bg-blue-50 border-blue-200", badge: "bg-blue-600", border: "border-blue-200", title: "แจ้งปัญหา", desc: "กรอกชื่อ เบอร์โทร และอธิบายปัญหาที่พบ ง่ายๆ ไม่ต้องสมัครสมาชิก" },
                            { step: "2", icon: <FileText className="w-12 h-12 text-indigo-600" />, iconBg: "bg-indigo-50 border-indigo-200", badge: "bg-indigo-600", border: "border-indigo-200", title: "รับรหัสติดตาม", desc: "ได้รับรหัสอ้างอิงทันที ใช้รหัสนี้ตรวจสอบความคืบหน้าได้ตลอดเวลา" },
                            { step: "3", icon: <CheckCircle2 className="w-12 h-12 text-green-600" />, iconBg: "bg-green-50 border-green-200", badge: "bg-green-600", border: "border-green-200", title: "รอรับการช่วยเหลือ", desc: "เจ้าหน้าที่จะติดต่อกลับภายใน 24 ชั่วโมง และอัปเดตสถานะให้ทราบ" },
                        ].map((item, i) => (
                            <div key={i} className={`flex flex-col items-center text-center gap-5 pt-10 pb-10 px-8 bg-white rounded-3xl border-2 ${item.border} shadow-md hover:shadow-xl hover:-translate-y-1 transition-all`}>
                                {/* Step number badge — inline at top */}
                                <div className={`w-16 h-16 rounded-2xl ${item.badge} text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shrink-0`}>
                                    {item.step}
                                </div>
                                <div className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center ${item.iconBg}`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-extrabold text-slate-800 mb-3">{item.title}</h3>
                                    <p className="text-slate-500 text-lg leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── DIVIDER ──────────────────────────── */}
                <div className="w-full max-w-5xl px-6 sm:px-10">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                </div>

                {/* ── FORM ─────────────────────────────── */}
                <section id="new-case" className="w-full py-20 bg-gradient-to-b from-transparent to-blue-50/60 flex flex-col items-center px-6 sm:px-10">
                    <div className="w-full max-w-3xl">
                        <div className="text-center mb-12">
                            <span className="inline-block px-6 py-3 bg-blue-50 text-blue-700 font-bold text-lg rounded-full mb-5 border border-blue-200">
                                📝 แจ้งปัญหาใหม่
                            </span>
                            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-800">กรอกข้อมูลด้านล่าง</h2>
                            <p className="text-slate-500 mt-4 text-xl">เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด</p>
                        </div>
                        <div className="bg-white rounded-3xl border-2 border-blue-100 shadow-2xl shadow-blue-500/10 p-8 sm:p-12 w-full">
                            <CreateCaseForm categories={categories} />
                        </div>
                    </div>
                </section>

                {/* ── FAQ ──────────────────────────────── */}
                <div className="w-full max-w-5xl px-6 sm:px-10 py-8">
                    <FAQSection />
                </div>

            </main>

            {/* ── FOOTER ──────────────────────────────── */}
            <footer className="w-full bg-slate-900 text-white mt-8">
                <div className="flex justify-center w-full">
                    <div className="w-full max-w-5xl px-6 sm:px-10 py-16">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                                        <HeartPulse className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-extrabold text-white">HealthHelp</p>
                                        <p className="text-slate-400 text-base">ระบบรับแจ้งปัญหา</p>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-lg leading-relaxed">
                                    ให้บริการรับแจ้งและติดตามปัญหา ด้วยระบบที่ทันสมัย เข้าถึงได้ง่าย เหมาะสำหรับทุกวัย
                                </p>
                            </div>

                            <div>
                                <p className="text-base font-bold text-slate-400 uppercase tracking-widest mb-6">เมนูหลัก</p>
                                <div className="space-y-4">
                                    {[
                                        { href: "/", label: "หน้าแรก" },
                                        { href: "/track", label: "ติดตามสถานะเคส" },
                                        { href: "/contact", label: "ติดต่อเรา" },
                                        { href: "/admin/login", label: "เข้าสู่ระบบเจ้าหน้าที่" },
                                    ].map(link => (
                                        <Link key={link.href} href={link.href} className="block text-slate-400 hover:text-white font-medium text-lg transition-colors">
                                            → {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-base font-bold text-slate-400 uppercase tracking-widest mb-6">ติดต่อเรา</p>
                                <div className="space-y-5">
                                    <a href="tel:02-xxx-xxxx" className="flex items-center gap-3 text-slate-300 hover:text-white font-semibold text-xl transition-colors">
                                        <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                                            <Phone className="w-6 h-6 text-blue-400" />
                                        </div>
                                        02-xxx-xxxx
                                    </a>
                                    <a href="mailto:helpdesk@healthhelp.com" className="flex items-center gap-3 text-slate-300 hover:text-white font-semibold text-lg transition-colors">
                                        <div className="w-11 h-11 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                                            <Mail className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        helpdesk@healthhelp.com
                                    </a>
                                    <div className="flex items-center gap-3 text-slate-400 text-lg">
                                        <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                                            <Clock className="w-6 h-6 text-green-400" />
                                        </div>
                                        จันทร์–ศุกร์ 08.00–17.00 น.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-500 text-base">
                            <p>© 2025 HealthHelp. สงวนลิขสิทธิ์ทุกประการ</p>
                            <p className="flex items-center gap-1.5">
                                <ShieldCheck className="w-5 h-5 text-green-500" />
                                ระบบมีความปลอดภัยและเป็นความลับ
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
