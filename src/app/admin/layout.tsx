"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    Settings,
    LogOut,
    Menu,
    Users,
    PlusCircle,
    Database,
    Clock,
    CheckCircle2,
} from "lucide-react";

interface UserSession {
    id: string;
    email: string;
    fullName: string;
    role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<UserSession | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("healthhelp_user");
        if (!stored) {
            router.push("/admin/login");
            return;
        }
        try {
            const parsedUser = JSON.parse(stored);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUser(parsedUser);

            if (pathname.startsWith("/admin/users") && parsedUser.role !== "ADMIN") {
                router.push("/admin/dashboard");
            }
            if (pathname.startsWith("/admin/settings") && !["ADMIN", "SUPERVISOR"].includes(parsedUser.role)) {
                router.push("/admin/dashboard");
            }
        } catch {
            router.push("/admin/login");
        }
    }, [router, pathname]);

    function handleLogout() {
        localStorage.removeItem("healthhelp_user");
        router.push("/admin/login");
    }

    // Don't show layout for login page
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    if (!user) return null;

    const navItems = [
        { href: "/admin/dashboard", icon: LayoutDashboard, label: "แดชบอร์ด", roles: ["ADMIN", "SUPERVISOR", "STAFF", "VIEWER"] },
        { href: "/admin/create", icon: PlusCircle, label: "แจ้งปัญหาใหม่", roles: ["ADMIN", "SUPERVISOR", "STAFF", "VIEWER"] },
        { href: "/admin/cases", icon: FileText, label: "เคสทั้งหมด", roles: ["ADMIN", "SUPERVISOR", "STAFF", "VIEWER"] },
        { href: "/admin/master-data", icon: Database, label: "ฐานข้อมูล", roles: ["ADMIN", "SUPERVISOR"] },
        { href: "/admin/sheet", icon: FileText, label: "Sheet ข้อมูล", roles: ["ADMIN", "SUPERVISOR"], target: "_blank" },
        { href: "/admin/settings", icon: Settings, label: "ตั้งค่า", roles: ["ADMIN", "SUPERVISOR"] },
        { href: "/admin/users", icon: Users, label: "ผู้ใช้งาน", roles: ["ADMIN"] },
    ];

    const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role));

    const roleLabel: Record<string, string> = {
        ADMIN: "ผู้ดูแลระบบ",
        SUPERVISOR: "หัวหน้างาน",
        STAFF: "เจ้าหน้าที่",
        VIEWER: "ผู้ชม",
    };

    return (
        <div className="min-h-screen flex bg-[#0b1121]">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-80 bg-[#0d1526] border-r border-[#1a2540] flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                {/* Logo */}
                <div className="px-6 py-8 border-b border-[#1a2540]">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-white font-bold text-2xl">IT</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white leading-tight">Hospital IT</h1>
                            <p className="text-base text-slate-400 font-medium mt-0.5">helpdesk</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-5 py-7">
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-5 px-2">เมนูหลัก</p>
                    <div className="space-y-1">
                        {filteredNavItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            const isCasesItem = item.href === "/admin/cases";
                            const currentStatus = searchParams.get("status");
                            return (
                                <div key={item.href}>
                                    <Link
                                        href={item.href}
                                        target={item.target}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-semibold text-xl ${
                                            isActive
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                                : "text-slate-300 hover:text-white hover:bg-[#1a2540]"
                                        }`}
                                    >
                                        <item.icon className="w-7 h-7 shrink-0" />
                                        <span>{item.label}</span>
                                    </Link>

                                    {/* Sub-nav: only show under เคสทั้งหมด when on cases pages */}
                                    {isCasesItem && isActive && (
                                        <div className="ml-5 mt-1.5 space-y-1 border-l-2 border-[#1e2d4a] pl-4">
                                            <Link
                                                href="/admin/cases?status=HIDE_DONE"
                                                onClick={() => setSidebarOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-lg font-semibold ${
                                                    currentStatus !== "SHOW_DONE"
                                                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                                                        : "text-slate-400 hover:text-white hover:bg-[#1a2540]"
                                                }`}
                                            >
                                                <Clock className="w-6 h-6 shrink-0" />
                                                กำลังดำเนินการ
                                            </Link>
                                            <Link
                                                href="/admin/cases?status=SHOW_DONE"
                                                onClick={() => setSidebarOpen(false)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-lg font-semibold ${
                                                    currentStatus === "SHOW_DONE"
                                                        ? "bg-green-600/20 text-green-300 border border-green-500/30"
                                                        : "text-slate-400 hover:text-white hover:bg-[#1a2540]"
                                                }`}
                                            >
                                                <CheckCircle2 className="w-6 h-6 shrink-0" />
                                                เคสเสร็จสิ้น
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </nav>

                {/* User info + Logout */}
                <div className="px-5 pb-7 border-t border-[#1a2540] pt-6">
                    <div className="flex items-center gap-4 px-3 mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                            <span className="text-2xl font-bold text-white">{user.fullName.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-lg font-bold text-slate-200 truncate">{user.fullName}</p>
                            <p className="text-base text-slate-400 truncate mt-0.5">{roleLabel[user.role] || user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-lg font-bold"
                    >
                        <LogOut className="w-6 h-6" />
                        <span>ออกจากระบบ</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Top Header Bar */}
                <header className="sticky top-0 z-30 bg-[#0d1526]/95 backdrop-blur-md border-b border-[#1a2540] px-6 lg:px-10 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2.5 rounded-xl bg-[#1a2540] text-slate-400 lg:hidden"
                        >
                            <Menu className="w-7 h-7" />
                        </button>
                        <h2 className="text-3xl font-extrabold text-white hidden lg:block tracking-tight">
                            {filteredNavItems.find(i => pathname === i.href || pathname.startsWith(i.href + "/"))?.label || "Dashboard"}
                        </h2>
                        <div className="flex items-center gap-3 lg:hidden">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                                <span className="text-white font-bold text-base">IT</span>
                            </div>
                            <span className="font-bold text-white text-xl">HealthHelp</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center gap-3 bg-[#1a2540] px-4 py-2.5 rounded-xl border border-[#253354]">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                <span className="text-white text-lg font-bold">{user.fullName.charAt(0)}</span>
                            </div>
                            <div>
                                <p className="text-base font-bold text-white leading-tight">{user.fullName}</p>
                                <p className="text-sm text-slate-400">{roleLabel[user.role] || user.role}</p>
                            </div>
                        </div>
                        <div className="lg:hidden w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center cursor-pointer">
                            <span className="text-white text-lg font-bold">{user.fullName.charAt(0)}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 bg-[#0b1121] overflow-auto">
                    <div className="w-full p-6 md:p-8 lg:p-10 min-h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
