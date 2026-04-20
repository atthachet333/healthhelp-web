"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/admin-actions";
import {
    HeartPulse, Loader2, AlertCircle, Lock,
    Mail, ArrowLeft, ShieldCheck, Eye, EyeOff,
} from "lucide-react";
import Link from "next/link";
import styles from "./login.module.css";

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
            localStorage.setItem("healthhelp_user", JSON.stringify(result.user));
            const maxAge = 60 * 60 * 24 * 7;

            const userRole = result.user.role;
            document.cookie = "token=true; path=/; max-age=" + maxAge + "; SameSite=Lax";
            document.cookie = "user_role=" + userRole + "; path=/; max-age=" + maxAge + "; SameSite=Lax";

            if (userRole === "ADMIN" || userRole === "SUPERVISOR") {
                router.push("/admin/dashboard");
            } else if (userRole === "STAFF" || userRole === "VIEWER") {
                router.push("/admin/cases");
            } else {
                router.push("/");
            }
        } else {
            setError(result.error || "เกิดข้อผิดพลาด");
            setShake(true);
            setTimeout(() => setShake(false), 600);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#070d1a] via-[#0b1121] to-[#0a1628]" />
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-700 rounded-full filter blur-[180px] opacity-10 pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-700 rounded-full filter blur-[180px] opacity-10 pointer-events-none" />

            <div className="relative w-full max-w-2xl">
                <Link
                    href="/"
                    className="absolute -top-20 left-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-base font-semibold border border-white/10"
                >
                    <ArrowLeft className="w-5 h-5" />
                    กลับหน้าหลัก
                </Link>

                <div className="text-center mb-10">
                    <div className="relative inline-block mb-6">
                        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30">
                            <HeartPulse className="w-16 h-16 text-white" />
                        </div>
                        <div className="absolute -bottom-3 -right-3 w-11 h-11 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-extrabold text-white tracking-tight">HealthHelp</h1>
                    <p className="text-slate-400 text-xl mt-2">ระบบจัดการ • สำหรับเจ้าหน้าที่</p>
                </div>

                <div className={"bg-[#111a2e]/80 backdrop-blur-2xl border border-[#1e2d4a]/80 rounded-3xl p-10 md:p-14 shadow-2xl shadow-black/40 " + (shake ? styles.shakeAnimation : "")}>
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-white mb-2">เข้าสู่ระบบ</h2>
                        <p className="text-slate-400 text-lg">กรุณากรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-7">
                        <div>
                            <label className="block text-lg font-semibold text-slate-300 mb-3">
                                <Mail className="w-5 h-5 inline mr-2 text-blue-400" />
                                อีเมล
                            </label>
                            <input
                                name="email"
                                type="email"
                                placeholder="admin@healthhelp.com"
                                required
                                autoFocus
                                autoComplete="email"
                                className="w-full bg-[#0b1121] border-2 border-[#1e2d4a] focus:border-blue-500 rounded-2xl px-6 py-5 text-white text-xl placeholder:text-slate-600 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-semibold text-slate-300 mb-3">
                                <Lock className="w-5 h-5 inline mr-2 text-indigo-400" />
                                รหัสผ่าน
                            </label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="w-full bg-[#0b1121] border-2 border-[#1e2d4a] focus:border-indigo-500 rounded-2xl px-6 py-5 pr-16 text-white text-xl placeholder:text-slate-600 outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-7 h-7" /> : <Eye className="w-7 h-7" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4">
                                <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
                                <p className="text-red-400 text-lg font-medium">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl text-2xl font-bold shadow-xl shadow-blue-500/20 transition-all"
                        >
                            {loading
                                ? <><Loader2 className="w-7 h-7 animate-spin" /> กำลังตรวจสอบ...</>
                                : <><ShieldCheck className="w-7 h-7" /> เข้าสู่ระบบ</>
                            }
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-700/50">
                        <p className="text-sm text-slate-500 text-center mb-5 font-semibold uppercase tracking-widest">บัญชีทดสอบ (Demo)</p>
                        <div className="flex flex-wrap justify-center gap-3 text-sm">
                            {[
                                { role: "Admin", email: "admin@healthhelp.com", pass: "password123" },
                                { role: "Supervisor", email: "supervisor@healthhelp.com", pass: "password123" },
                                { role: "Staff", email: "staff@healthhelp.com", pass: "password123" },
                                { role: "Viewer", email: "viewer@healthhelp.com", pass: "password123" },
                            ].map((cred) => (
                                <button
                                    key={cred.role}
                                    type="button"
                                    onClick={() => {
                                        const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
                                        const passInput = document.querySelector('input[name="password"]') as HTMLInputElement;
                                        if (emailInput) { emailInput.value = cred.email; emailInput.dispatchEvent(new Event("input", { bubbles: true })); }
                                        if (passInput) { passInput.value = cred.pass; passInput.dispatchEvent(new Event("input", { bubbles: true })); }
                                    }}
                                    className="px-4 py-2 md:px-6 md:py-3 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50 text-sm md:text-base font-semibold"
                                >
                                    {cred.role}
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-slate-600 text-base mt-4">รหัสผ่านทดสอบ: password123</p>
                    </div>
                </div>

                <p className="mt-6 text-center text-slate-600 text-base">
                    🔒 ระบบนี้สำหรับเจ้าหน้าที่เท่านั้น • HealthHelp Admin
                </p>
            </div>
        </div>
    );
}