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
        ADMIN: "bg-red-500/20 text-red-400",
        SUPERVISOR: "bg-indigo-500/20 text-indigo-400",
        STAFF: "bg-green-500/20 text-green-400",
        VIEWER: "bg-slate-500/20 text-slate-400",
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-indigo-400" />
                    ผู้ใช้งานระบบ
                </h2>
                <p className="text-slate-500 text-sm">{users.length} ผู้ใช้งาน</p>
            </div>

            <div className="card p-0 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">ชื่อ-นามสกุล</th>
                            <th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">อีเมล</th>
                            <th className="text-center text-xs font-semibold text-slate-400 uppercase px-4 py-3">บทบาท</th>
                            <th className="text-center text-xs font-semibold text-slate-400 uppercase px-4 py-3">สถานะ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                            <span className="text-indigo-400 font-bold text-sm">{user.fullName.charAt(0)}</span>
                                        </div>
                                        <span className="text-white font-medium text-sm">{user.fullName}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-400">{user.email}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`badge ${roleColor[user.role] || ""} text-xs`}>
                                        <Shield className="w-3 h-3 mr-1" />
                                        {roleLabel[user.role] || user.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`badge text-xs ${user.active ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-500"}`}>
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
