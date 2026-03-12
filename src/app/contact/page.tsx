"use client";

import { useState } from "react";
import Link from "next/link";
import {
    HeartPulse,
    User,
    Phone,
    Mail,
    MessageSquare,
    Send,
    CheckCircle2,
    Loader2,
    MapPin,
    Clock,
} from "lucide-react";

export default function ContactPage() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        // Simulate form submission
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setLoading(false);
        setSubmitted(true);
    }

    return (
        <div className="theme-light flex flex-col min-h-screen w-full relative">
            {/* Background */}
            <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50/30" />

            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-slate-200/60 shadow-sm w-full">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-600/20">
                            <HeartPulse className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">HealthHelp</h1>
                    </Link>
                    <nav className="hidden md:flex items-center gap-5">
                        <Link href="/" className="px-4 py-2 text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors">
                            หน้าแรก
                        </Link>
                        <Link href="/track" className="px-4 py-2 text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors">
                            ติดตามเคส
                        </Link>
                        <Link href="/contact" className="px-4 py-2 text-base font-semibold text-blue-700 bg-blue-50 rounded-lg transition-colors">
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

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center w-full relative z-10">
                {/* Hero */}
                <div className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 md:py-10 relative">
                        <div className="text-center">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                                ติดต่อเรา
                            </h2>
                            <p className="text-emerald-100/90 text-sm sm:text-base mx-auto text-center">
                                มีคำถามหรือข้อเสนอแนะ? ส่งข้อความถึงเราได้เลย
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 -mt-4 pb-12 relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Contact Info Cards */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white rounded-xl shadow-md border border-slate-200/80 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">โทรศัพท์</h3>
                                        <p className="text-slate-600 text-sm">02-xxx-xxxx</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">จันทร์ - ศุกร์ 08:30 - 16:30 น.</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-md border border-slate-200/80 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">อีเมล</h3>
                                        <p className="text-slate-600 text-sm">support@healthhelp.com</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">ตอบกลับภายใน 24 ชั่วโมง</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-md border border-slate-200/80 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">ที่อยู่</h3>
                                        <p className="text-slate-600 text-sm">ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร สำนักงานปลัดกระทรวง</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">ฝ่ายศูนย์ประสานการรักษาความมั่นคงปลอดภัยไซเบอร์ด้านสาธารณสุข (Health CERT) ชั้น 1 อาคาร 2</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-md border border-slate-200/80 p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">เวลาทำการ</h3>
                                        <p className="text-slate-600 text-sm">จันทร์ - ศุกร์</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">08:30 - 16:30 น. (หยุดวันเสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์)</p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden">
                                <div className="bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-slate-200/80 px-5 sm:px-6 py-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                            <MessageSquare className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800">ส่งข้อความถึงเรา</h3>
                                            <p className="text-slate-500 text-xs">กรอกข้อมูลด้านล่างเพื่อติดต่อเรา</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 sm:p-6">
                                    {submitted ? (
                                        <div className="text-center py-10">
                                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">ส่งข้อความสำเร็จ!</h3>
                                            <p className="text-slate-600 text-sm mb-6">ขอบคุณที่ติดต่อเรา เจ้าหน้าที่จะติดต่อกลับโดยเร็ว</p>
                                            <button
                                                onClick={() => setSubmitted(false)}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                                            >
                                                ส่งข้อความอีกครั้ง
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="group">
                                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                        ชื่อ-นามสกุล <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <User className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                        </div>
                                                        <input
                                                            name="fullName"
                                                            className="input-field bg-white pl-10 py-2.5 text-sm"
                                                            placeholder="สมชาย ใจดี"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                        เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                        </div>
                                                        <input
                                                            name="phone"
                                                            className="input-field bg-white pl-10 py-2.5 text-sm"
                                                            placeholder="0812345678"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="group">
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                    อีเมล <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                    </div>
                                                    <input
                                                        name="email"
                                                        type="email"
                                                        className="input-field bg-white pl-10 py-2.5 text-sm"
                                                        placeholder="email@example.com"
                                                    />
                                                </div>
                                            </div>

                                            <div className="group">
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                    หัวข้อ <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    name="subject"
                                                    className="input-field bg-white py-2.5 text-sm"
                                                    placeholder="เรื่องที่ต้องการติดต่อ"
                                                    required
                                                />
                                            </div>

                                            <div className="group">
                                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                    รายละเอียด <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    name="message"
                                                    className="input-field bg-white py-2.5 text-sm min-h-[120px]"
                                                    placeholder="อธิบายรายละเอียดที่ต้องการสอบถามหรือเสนอแนะ..."
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 px-6 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        กำลังส่ง...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        ส่งข้อความ
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full bg-slate-900 text-slate-400 relative z-10">
                <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                <HeartPulse className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-xs font-semibold text-slate-300">HealthHelp</span>
                        </div>
                        <p className="text-[11px] text-slate-500">© 2026 HealthHelp - ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร</p>
                        <Link href="/admin/login" className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
                            เจ้าหน้าที่ →
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
