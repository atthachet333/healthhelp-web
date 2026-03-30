"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/admin-actions";
import {
    HeartPulse, Loader2, AlertCircle, Lock,
    Mail, ArrowLeft, ShieldCheck, Eye, EyeOff,
} from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [shake, setShake] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        const result = await loginAction(email, password);
        setLoading(false);

        if (result.success && result.user) {
            // เก็บข้อมูล session ไว้ใน localStorage
            localStorage.setItem("healthhelp_user", JSON.stringify(result.user));
            // เซ็ต cookie admin_auth=true เพื่อให้ middleware ตรวจสอบได้
            const maxAge = 60 * 60 * 24 * 7; // 7 วัน
            document.cookie = `admin_auth=true; path=/; max-age=${maxAge}; SameSite=Lax`;
            router.push("/admin/dashboard");
        } else {
            setError(result.error || "เกิดข้อผิดพลาด");
            setShake(true);
            setTimeout(() => setShake(false), 600);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#070d1a] via-[#0b1121] to-[#0a1628]" />
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-700 rounded-full filter blur-[160px] opacity-10 pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-700 rounded-full filter blur-[160px] opacity-10 pointer-events-none" />

            <div className="relative w-full max-w-md">
                <Link
                    href="/"
                    className="absolute -top-16 left-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-sm font-semibold border border-white/10"
                >
                    <ArrowLeft className="w-4 h-4" />
                    กลับหน้าหลัก
                </Link>

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="relative inline-block mb-5">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30">
                            <HeartPulse className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">HealthHelp</h1>
                    <p className="text-slate-400 text-base mt-1.5">ระบบจัดการ • สำหรับเจ้าหน้าที่</p>
                </div>

                {/* Card */}
                <div
                    className="bg-[#111a2e]/80 backdrop-blur-2xl border border-[#1e2d4a]/80 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/40"
                    style={shake ? { animation: "shake 0.5s ease-in-out" } : {}}
                >
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-1">เข้าสู่ระบบ</h2>
                        <p className="text-slate-400 text-sm">กรุณากรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                <Mail className="w-3.5 h-3.5 inline mr-1.5 text-blue-400" />
                                อีเมล
                            </label>
                            <input
                                name="email"
                                type="email"
                                placeholder="admin@healthhelp.com"
                                required
                                autoFocus
                                autoComplete="email"
                                className="w-full bg-[#0b1121] border-2 border-[#1e2d4a] focus:border-blue-500 rounded-2xl px-5 py-4 text-white text-base placeholder:text-slate-600 outline-none transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                <Lock className="w-3.5 h-3.5 inline mr-1.5 text-indigo-400" />
                                รหัสผ่าน
                            </label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="w-full bg-[#0b1121] border-2 border-[#1e2d4a] focus:border-indigo-500 rounded-2xl px-5 py-4 pr-12 text-white text-base placeholder:text-slate-600 outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                <p className="text-red-400 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/20 transition-all"
                        >
                            {loading
                                ? <><Loader2 className="w-5 h-5 animate-spin" /> กำลังตรวจสอบ...</>
                                : <><ShieldCheck className="w-5 h-5" /> เข้าสู่ระบบ</>
                            }
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div className="mt-8 pt-7 border-t border-slate-700/50">
                        <p className="text-xs text-slate-500 text-center mb-4 font-semibold uppercase tracking-widest">บัญชีทดสอบ (Demo)</p>
                        <div className="flex flex-wrap justify-center gap-2.5 text-sm">
                            {[
                                { role: "Admin", email: "admin@healthhelp.com", pass: "password123" },
                                { role: "Supervisor", email: "supervisor@healthhelp.com", pass: "password123" },
                                { role: "Staff", email: "staff@healthhelp.com", pass: "password123" },
                            ].map((cred) => (
                                <button
                                    key={cred.role}
                                    type="button"
                                    onClick={() => {
                                        const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
                                        const passInput = document.querySelector<HTMLInputElement>('input[name="password"]');
                                        if (emailInput) { emailInput.value = cred.email; emailInput.dispatchEvent(new Event("input", { bubbles: true })); }
                                        if (passInput) { passInput.value = cred.pass; passInput.dispatchEvent(new Event("input", { bubbles: true })); }
                                    }}
                                    className="px-4 py-2 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50 text-xs font-semibold"
                                >
                                    {cred.role}
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-slate-600 text-xs mt-3">รหัสผ่านทดสอบ: password123</p>
                    </div>
                </div>

                <p className="mt-5 text-center text-slate-600 text-xs">
                    🔒 ระบบนี้สำหรับเจ้าหน้าที่เท่านั้น • HealthHelp Admin
                </p>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%,100%{transform:translateX(0)}
                    15%{transform:translateX(-8px)}
                    30%{transform:translateX(8px)}
                    45%{transform:translateX(-5px)}
                    60%{transform:translateX(5px)}
                    75%{transform:translateX(-2px)}
                    90%{transform:translateX(2px)}
                }
            `}</style>
        </div>
    );
}
