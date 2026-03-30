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
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setLoading(false);
        setSubmitted(true);
    }

    return (
        <div className="theme-light flex flex-col min-h-screen w-full relative">
            {/* Background */}
            <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50/30" />

            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200/60 shadow-sm w-full">
                <div className="w-full max-w-screen-2xl mx-auto px-6 sm:px-10 lg:px-16 py-5 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-600/20">
                            <HeartPulse className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">HealthHelp</h1>
                    </Link>
                    <nav className="hidden md:flex items-center gap-4">
                        <Link href="/" className="px-5 py-3 text-lg font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors">
                            หน้าแรก
                        </Link>
                        <Link href="/track" className="px-5 py-3 text-lg font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors">
                            ติดตามเคส
                        </Link>
                        <Link href="/contact" className="px-5 py-3 text-lg font-bold text-blue-700 bg-blue-50 rounded-xl transition-colors">
                            ติดต่อเรา
                        </Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/login"
                            className="flex items-center gap-2 px-5 py-3 text-lg font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                        >
                            <User className="w-6 h-6" />
                            <span className="hidden sm:inline">เจ้าหน้าที่</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center w-full relative z-10">
                {/* Hero */}
                <div className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 relative overflow-hidden">
                    <div className="w-full max-w-screen-2xl mx-auto px-6 sm:px-10 lg:px-16 py-12 md:py-16 relative">
                        <div className="text-center">
                            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
                                ติดต่อเรา
                            </h2>
                            <p className="text-emerald-100/90 text-xl sm:text-2xl mx-auto text-center">
                                มีคำถามหรือข้อเสนอแนะ? ส่งข้อความถึงเราได้เลย
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="w-full max-w-screen-2xl mx-auto px-6 sm:px-10 lg:px-16 -mt-6 pb-16 relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Contact Info Cards */}
                        <div className="lg:col-span-2 space-y-5">
                            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-7">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                                        <Phone className="w-7 h-7 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold text-slate-800">โทรศัพท์</h3>
                                        <p className="text-slate-700 text-lg font-semibold mt-1">02-xxx-xxxx</p>
                                    </div>
                                </div>
                                <p className="text-base text-slate-500">จันทร์ - ศุกร์ 08:30 - 16:30 น.</p>
                            </div>

                            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-7">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                                        <Mail className="w-7 h-7 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold text-slate-800">อีเมล</h3>
                                        <p className="text-slate-700 text-lg font-semibold mt-1">support@healthhelp.com</p>
                                    </div>
                                </div>
                                <p className="text-base text-slate-500">ตอบกลับภายใน 24 ชั่วโมง</p>
                            </div>

                            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-7">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
                                        <MapPin className="w-7 h-7 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold text-slate-800">ที่อยู่</h3>
                                    </div>
                                </div>
                                <p className="text-base text-slate-500">ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร ชั้น 1 อาคาร 2</p>
                            </div>

                            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-7">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0">
                                        <Clock className="w-7 h-7 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold text-slate-800">เวลาทำการ</h3>
                                        <p className="text-slate-700 text-lg font-semibold mt-1">จันทร์ - ศุกร์</p>
                                    </div>
                                </div>
                                <p className="text-base text-slate-500">08:30 - 16:30 น. (หยุดวันเสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์)</p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
                                <div className="bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-slate-200/80 px-8 sm:px-10 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                                            <MessageSquare className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-extrabold text-slate-800">ส่งข้อความถึงเรา</h3>
                                            <p className="text-slate-500 text-base mt-1">กรอกข้อมูลด้านล่างเพื่อติดต่อเรา</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 sm:p-10">
                                    {submitted ? (
                                        <div className="text-center py-16">
                                            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                                                <CheckCircle2 className="w-12 h-12 text-green-600" />
                                            </div>
                                            <h3 className="text-3xl font-extrabold text-slate-900 mb-3">ส่งข้อความสำเร็จ!</h3>
                                            <p className="text-slate-600 text-lg mb-8">ขอบคุณที่ติดต่อเรา เจ้าหน้าที่จะติดต่อกลับโดยเร็ว</p>
                                            <button
                                                onClick={() => setSubmitted(false)}
                                                className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-lg font-bold hover:bg-emerald-700 transition-colors"
                                            >
                                                ส่งข้อความอีกครั้ง
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="group">
                                                    <label className="block text-base font-bold text-slate-700 mb-2">
                                                        ชื่อ-นามสกุล <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                        </div>
                                                        <input
                                                            name="fullName"
                                                            className="input-field bg-white pl-12 py-4 text-base"
                                                            placeholder="สมชาย ใจดี"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="block text-base font-bold text-slate-700 mb-2">
                                                        เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                        </div>
                                                        <input
                                                            name="phone"
                                                            className="input-field bg-white pl-12 py-4 text-base"
                                                            placeholder="0812345678"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="group">
                                                <label className="block text-base font-bold text-slate-700 mb-2">
                                                    อีเมล <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                    </div>
                                                    <input
                                                        name="email"
                                                        type="email"
                                                        className="input-field bg-white pl-12 py-4 text-base"
                                                        placeholder="email@example.com"
                                                    />
                                                </div>
                                            </div>

                                            <div className="group">
                                                <label className="block text-base font-bold text-slate-700 mb-2">
                                                    หัวข้อ <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    name="subject"
                                                    className="input-field bg-white py-4 text-base"
                                                    placeholder="เรื่องที่ต้องการติดต่อ"
                                                    required
                                                />
                                            </div>

                                            <div className="group">
                                                <label className="block text-base font-bold text-slate-700 mb-2">
                                                    รายละเอียด <span className="text-red-500">*</span>
                                                </label>
                                                <textarea
                                                    name="message"
                                                    className="input-field bg-white py-4 text-base min-h-[160px]"
                                                    placeholder="อธิบายรายละเอียดที่ต้องการสอบถามหรือเสนอแนะ..."
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-3 disabled:opacity-70"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                        กำลังส่ง...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-6 h-6" />
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
                <div className="w-full max-w-screen-2xl mx-auto px-6 sm:px-10 lg:px-16 py-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                <HeartPulse className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-base font-bold text-slate-300">HealthHelp</span>
                        </div>
                        <p className="text-sm text-slate-500">© 2026 HealthHelp - ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร</p>
                        <Link href="/admin/login" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
                            เจ้าหน้าที่ →
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
