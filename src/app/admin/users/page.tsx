import { getAllUsers } from "@/app/actions/admin-actions";
import { Users, Shield } from "lucide-react";

export default async function UsersPage() {
    const users = await getAllUsers();

    const roleLabel: Record<string, string> = {
        ADMIN: "ผู้ดูแลระบบ",
        SUPERVISOR: "หัวหน้างาน",
        STAFF: "เจ้าหน้าที่",
        VIEWER: "ผู้ชม",
    };

    const roleColor: Record<string, string> = {
        ADMIN: "bg-red-500/20 text-red-400 border border-red-500/30",
        SUPERVISOR: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
        STAFF: "bg-green-500/20 text-green-400 border border-green-500/30",
        VIEWER: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-white flex items-center gap-3 tracking-tight">
                    <Users className="w-9 h-9 text-indigo-400" />
                    ผู้ใช้งานระบบ
                </h2>
                <p className="text-slate-400 text-lg mt-2">{users.length} ผู้ใช้งานทั้งหมด</p>
            </div>

            {/* Table */}
            <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-3xl shadow-2xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#0b1121] border-b border-[#1e2d4a]">
                        <tr>
                            <th className="text-left text-sm font-extrabold text-slate-400 uppercase tracking-widest px-8 py-6">ชื่อ-นามสกุล</th>
                            <th className="text-left text-sm font-extrabold text-slate-400 uppercase tracking-widest px-8 py-6">อีเมล</th>
                            <th className="text-center text-sm font-extrabold text-slate-400 uppercase tracking-widest px-8 py-6">บทบาท</th>
                            <th className="text-center text-sm font-extrabold text-slate-400 uppercase tracking-widest px-8 py-6">สถานะ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2d4a]">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-indigo-500/5 transition-colors duration-200">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                            <span className="text-indigo-400 font-black text-xl">{user.fullName.charAt(0)}</span>
                                        </div>
                                        <span className="text-white font-bold text-lg">{user.fullName}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-slate-400 text-base">{user.email}</td>
                                <td className="px-8 py-6 text-center">
                                    <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-bold ${roleColor[user.role] || ""}`}>
                                        <Shield className="w-4 h-4" />
                                        {roleLabel[user.role] || user.role}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className={`inline-flex items-center px-5 py-2.5 rounded-xl text-base font-bold border ${user.active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}>
                                        {user.active ? "เปิดใช้งาน" : "ระงับ"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
