"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    HeartPulse,
    LayoutDashboard,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Users,
    ChevronRight,
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
        { href: "/admin/cases", icon: FileText, label: "จัดการเคส", roles: ["ADMIN", "SUPERVISOR", "STAFF", "VIEWER"] },
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
        <div className="min-h-screen flex">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                {/* Logo */}
                <div className="p-8 border-b border-slate-800 bg-slate-800/20">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center glow-sm shadow-xl">
                            <HeartPulse className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-wide truncate max-w-[200px] mb-1">HealthHelp</h1>
                            <p className="text-sm text-slate-300 font-medium truncate max-w-[200px]">{user.fullName}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{user.email}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-5 mt-2">
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {filteredNavItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl transition-all text-sm font-semibold text-center border ${isActive
                                        ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30 shadow-sm"
                                        : "bg-slate-800/20 text-slate-400 border-slate-700/50 hover:text-slate-200 hover:bg-slate-800"
                                        }`}
                                >
                                    <item.icon className="w-8 h-8 mb-1" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}

                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-800 h-full flex flex-col justify-end">
                        <button
                            onClick={handleLogout}
                            className="w-full flex flex-col items-center justify-center gap-3 p-6 rounded-2xl text-red-500 transition-all text-base font-bold bg-slate-800/20 hover:bg-red-500/10 shadow-sm border border-slate-700/50 hover:border-red-500/30"
                        >
                            <LogOut className="w-8 h-8" />
                            <span>ออกจากระบบ</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="sticky top-0 z-30 lg:hidden bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg bg-slate-800 text-slate-400"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <HeartPulse className="w-5 h-5 text-indigo-400" />
                        <span className="font-bold text-white">HealthHelp</span>
                    </div>
                    <div className="w-9" />
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-8 bg-slate-950">{children}</main>
            </div>
        </div>
    );
}
