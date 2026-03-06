"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/admin-actions";
import { HeartPulse, Loader2, AlertCircle, Lock, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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
            // Store session in localStorage (simplified auth for demo)
            localStorage.setItem("healthhelp_user", JSON.stringify(result.user));
            router.push("/admin/dashboard");
        } else {
            setError(result.error || "เกิดข้อผิดพลาด");
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full filter blur-[128px] opacity-20" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600 rounded-full filter blur-[128px] opacity-20" />

            <div className="relative w-full max-w-lg">
                {/* Back to Home Button */}
                <Link
                    href="/"
                    className="absolute -top-20 left-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors backdrop-blur-sm text-base font-semibold shadow-lg shadow-black/20 border border-slate-600/50"
                >
                    <ArrowLeft className="w-5 h-5" />
                    กลับไปหน้าแจ้งปัญหา
                </Link>

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 glow">
                        <HeartPulse className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">HealthHelp</h1>
                    <p className="text-slate-400">ระบบจัดการเคส • เข้าสู่ระบบเจ้าหน้าที่</p>
                </div>

                {/* Login Card */}
                <div className="glass rounded-2xl p-10 md:p-12">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                <Mail className="w-3.5 h-3.5 inline mr-1" />
                                อีเมล
                            </label>
                            <input
                                name="email"
                                type="email"
                                className="input-field"
                                placeholder="admin@healthhelp.com"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                <Lock className="w-3.5 h-3.5 inline mr-1" />
                                รหัสผ่าน
                            </label>
                            <input
                                name="password"
                                type="password"
                                className="input-field"
                                placeholder="••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg">
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    กำลังเข้าสู่ระบบ...
                                </>
                            ) : (
                                "เข้าสู่ระบบ"
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-10 pt-8 border-t border-slate-700/50">
                        <p className="text-sm text-slate-400 text-center mb-5 font-medium tracking-wide">บัญชีทดสอบ (Demo)</p>
                        <div className="flex flex-wrap justify-center gap-3 text-sm font-medium">
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
                                        const form = document.querySelector("form") as HTMLFormElement;
                                        const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement;
                                        const passInput = form.querySelector('input[name="password"]') as HTMLInputElement;
                                        emailInput.value = cred.email;
                                        passInput.value = cred.pass;
                                    }}
                                    className="px-5 py-2.5 rounded-full bg-slate-800/50 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all border border-slate-700/50 hover:border-slate-500 hover:shadow-md"
                                >
                                    {cred.role}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
