import { getCases } from "@/app/actions/admin-actions";
import Link from "next/link";
import { getStatusLabel, getStatusColor, formatDateTime } from "@/lib/utils";

export default async function AdminCasesPage() {
    // 1. เรียกข้อมูล และใส่ค่าเริ่มต้นเป็นอาร์เรย์ว่างป้องกัน Error
    const response = await getCases({});

    // 2. 🛡️ ตรวจสอบว่าข้อมูลที่ได้มาเป็น Array หรือเป็น Object ที่มี property ชื่อ cases
    // วิธีนี้จะช่วยแก้ปัญหา "map is not a function" ได้ครอบคลุมที่สุด
    const cases = Array.isArray(response)
        ? response
        : (response && typeof response === 'object' && 'cases' in response)
            ? (response as any).cases
            : [];

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight">รายการแจ้งปัญหา</h1>
                <div className="text-slate-500 text-sm font-medium bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-700">
                    {/* แก้ไขตัวสะกดจาก lenght เป็น length */}
                    พบทั้งหมด {cases.length} รายการ
                </div>
            </div>

            <div className="bg-slate-800 rounded-[2rem] overflow-hidden border border-slate-700 shadow-2xl shadow-black/20">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900/60 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                            <tr>
                                <th className="p-6">เลขที่เคส</th>
                                <th className="p-6">หัวข้อปัญหา</th>
                                <th className="p-6">สถานะ</th>
                                <th className="p-6">วันที่แจ้ง</th>
                                <th className="p-6 text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {/* 3. 🚀 มั่นใจได้ว่า .map จะไม่พังเพราะเราเช็ค cases เป็น Array แล้วด้านบน */}
                            {cases.map((c: any) => (
                                <tr key={c.id} className="hover:bg-indigo-500/5 transition-all group">
                                    <td className="p-6 font-mono text-indigo-400 font-bold text-sm">{c.caseNo}</td>
                                    <td className="p-6 text-slate-200 font-medium truncate max-w-[280px]">{c.problemSummary}</td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm ${getStatusColor(c.status)}`}>
                                            {getStatusLabel(c.status)}
                                        </span>
                                    </td>
                                    <td className="p-6 text-slate-500 text-xs font-medium">{formatDateTime(c.createdAt)}</td>
                                    <td className="p-6 text-center">
                                        <Link
                                            href={`/admin/cases/${c.id}`}
                                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
                                        >
                                            จัดการเคส
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {cases.length === 0 && (
                    <div className="py-32 text-center flex flex-col items-center gap-4 bg-slate-900/20">
                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-3xl shadow-inner text-slate-600">📂</div>
                        <div className="space-y-1">
                            <p className="text-white font-bold text-lg">ไม่มีรายการในขณะนี้</p>
                            <p className="text-slate-500 text-sm">เมื่อมีการแจ้งปัญหาใหม่ ข้อมูลจะมาปรากฏที่นี่</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}