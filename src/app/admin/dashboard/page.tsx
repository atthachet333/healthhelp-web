import { LayoutDashboard, Users, Ticket } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-[#070d1a] p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-white flex items-center gap-3 mb-8">
                    <LayoutDashboard className="w-10 h-10 text-blue-500" />
                    ภาพรวมระบบ (Dashboard)
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* กล่องสถิติ 1 */}
                    <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-500/20 rounded-xl">
                                <Ticket className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 font-medium">เคสทั้งหมด</p>
                                <h3 className="text-3xl font-bold text-white">0</h3>
                            </div>
                        </div>
                    </div>

                    {/* กล่องสถิติ 2 */}
                    <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-emerald-500/20 rounded-xl">
                                <Users className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 font-medium">กำลังดำเนินการ</p>
                                <h3 className="text-3xl font-bold text-white">0</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}