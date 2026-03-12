"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    Settings,
    LogOut,
    Menu,
    Users,
    PlusCircle,
    Database,
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
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0d1526] border-r border-[#1a2540] flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                {/* Logo */}
                <div className="px-5 py-7 border-b border-[#1a2540]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-white font-bold text-base">IT</span>
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-white leading-tight">Hospital IT</h1>
                            <p className="text-xs text-slate-400 font-medium">helpdesk</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-4 px-4">เมนูหลัก</p>
                    <div className="space-y-2">
                        {filteredNavItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    target={item.target}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-medium ${isActive
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                        : "text-slate-400 hover:text-slate-200 hover:bg-[#1a2540]"
                                        }`}
                                >
                                    <item.icon className="w-[22px] h-[22px]" />
                                    <span className="text-base">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* User info + Logout */}
                <div className="px-4 pb-6 border-t border-[#1a2540] pt-6">
                    <div className="flex items-center gap-3 px-4 mb-5">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <span className="text-base font-bold text-white">{user.fullName.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-200 truncate">{user.fullName}</p>
                            <p className="text-xs text-slate-400 truncate">{roleLabel[user.role] || user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-base font-semibold"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>ออกจากระบบ</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top Header Bar */}
                <header className="sticky top-0 z-30 bg-[#0d1526]/95 backdrop-blur-md border-b border-[#1a2540] px-4 lg:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-lg bg-[#1a2540] text-slate-400 lg:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold text-white hidden lg:block">
                            {filteredNavItems.find(i => pathname === i.href || pathname.startsWith(i.href + "/"))?.label || "Dashboard"}
                        </h2>
                        <div className="flex items-center gap-2 lg:hidden">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                                <span className="text-white font-bold text-[10px]">IT</span>
                            </div>
                            <span className="font-bold text-white text-sm">HealthHelp</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center cursor-pointer">
                            <span className="text-white text-sm font-bold">{user.fullName.charAt(0)}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6 bg-[#0b1121]">{children}</main>
            </div>
        </div>
    );
}
