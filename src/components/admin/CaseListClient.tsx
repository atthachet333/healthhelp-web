"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Search, ChevronLeft, ChevronRight, Eye,
    UserPlus, Download
} from "lucide-react";
import { getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor, formatDateTime } from "@/lib/utils";
import { useState, useEffect } from "react";
import { assignCase } from "@/app/actions/admin-actions";
import { ImportCasesModal } from "./ImportCasesModal";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";

interface CaseItem {
    id: string;
    caseNo: string;
    problemSummary: string;
    status: string;
    priority: string;
    createdAt: string | Date;
    slaDueAt: string | Date | null;
    reporter: { fullName: string; phone: string };
    category: { name: string };
    assignee: { fullName: string } | null;
}

interface StaffUser {
    id: string;
    fullName: string;
    role: string;
}

interface Props {
    cases: CaseItem[];
    total: number;
    page: number;
    totalPages: number;
    currentStatus: string;
    currentPriority: string;
    currentSearch: string;
    staffUsers: StaffUser[];
}

export function CaseListClient({
    cases,
    total,
    page,
    totalPages,
    currentStatus,
    currentPriority,
    currentSearch,
    staffUsers,
}: Props) {
    const router = useRouter();
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("healthhelp_user");
        if (stored) {
            try {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setCurrentUserRole(JSON.parse(stored).role);
            } catch { }
        }
    }, []);

    const canAssign = currentUserRole === "ADMIN" || currentUserRole === "SUPERVISOR";

    function applyFilter(key: string, value: string) {
        const params = new URLSearchParams();
        if (key === "status") params.set("status", value); else if (currentStatus !== "ALL") params.set("status", currentStatus);
        if (key === "priority") params.set("priority", value); else if (currentPriority !== "ALL") params.set("priority", currentPriority);
        if (key === "search") params.set("search", value); else if (currentSearch) params.set("search", currentSearch);
        params.set("page", "1");
        router.push(`/admin/cases?${params.toString()}`);
    }

    function goToPage(p: number) {
        const params = new URLSearchParams();
        if (currentStatus !== "ALL") params.set("status", currentStatus);
        if (currentPriority !== "ALL") params.set("priority", currentPriority);
        if (currentSearch) params.set("search", currentSearch);
        params.set("page", p.toString());
        router.push(`/admin/cases?${params.toString()}`);
    }

    async function handleAssign(caseId: string, assigneeId: string) {
        const user = JSON.parse(localStorage.getItem("healthhelp_user") || "{}");
        await assignCase(caseId, assigneeId, user.id);
        setAssigningId(null);
        router.refresh();
    }

    function handleExport() {
        if (!cases || cases.length === 0) {
            toast.error("ไม่มีข้อมูลสำหรับส่งออก");
            return;
        }

        try {
            const dataToExport = cases.map((c) => ({
                "Case No": c.caseNo,
                "ปัญหา": c.problemSummary,
                "หมวดหมู่": c.category.name,
                "สถานะ": getStatusLabel(c.status),
                "ความเร่งด่วน": getPriorityLabel(c.priority),
                "ผู้แจ้ง": c.reporter.fullName,
                "เบอร์โทร": c.reporter.phone,
                "ผู้รับผิดชอบ": c.assignee ? c.assignee.fullName : "-",
                "วันที่แจ้ง": formatDateTime(c.createdAt),
                "SLA": c.slaDueAt ? formatDateTime(c.slaDueAt) : "-"
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Cases");
            
            const fileName = `HealthHelp_Cases_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            toast.success("ส่งออกข้อมูลสำเร็จ");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
        }
    }

    function isSLABreached(slaDueAt: string | Date | null, status: string): boolean {
        if (!slaDueAt) return false;
        if (status === "RESOLVED" || status === "CLOSED") return false;
        return new Date(slaDueAt) < new Date();
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white">
                        {currentStatus === "HIDE_DONE" ? "เคสที่กำลังดำเนินการ" : "เคสที่ดำเนินการเสร็จสิ้น"}
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5">{total} เคสตามที่กรอง</p>
                </div>
                <div className="flex items-center gap-3">
                    {canAssign && (
                        <>
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-500 flex items-center gap-2"
                                title="นำเข้าข้อมูลจาก Excel"
                            >
                                <span className="text-xl leading-none -mt-1">+</span> Import
                            </button>
                            <button
                                onClick={handleExport}
                                className="px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 flex items-center gap-2"
                                title="ส่งออกข้อมูลเป็นไฟล์ Excel"
                            >
                                <Download className="w-4 h-4" /> Export
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => applyFilter("status", currentStatus === "HIDE_DONE" ? "SHOW_DONE" : "HIDE_DONE")}
                        className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all ${currentStatus === "HIDE_DONE"
                            ? "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                    >
                        {currentStatus === "HIDE_DONE" ? "เคสที่ดำเนินการเสร็จสิ้น" : "เคสที่กำลังดำเนินการ"}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium shrink-0">
                        <span>Filter bar</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                defaultValue={currentSearch}
                                placeholder="ค้นหา..."
                                className="w-full pl-9 pr-3 py-2 bg-[#0b1121] border border-[#1e2d4a] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") applyFilter("search", (e.target as HTMLInputElement).value);
                                }}
                            />
                        </div>

                        <div className="flex gap-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-500 font-medium">Status</span>
                                <select
                                    value={currentStatus}
                                    onChange={(e) => applyFilter("status", e.target.value)}
                                    className="bg-[#0b1121] border border-[#1e2d4a] rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                                >
                                    <option value="ALL">ทุกสถานะ</option>
                                    <option value="HIDE_DONE">เคสที่กำลังดำเนินการ</option>
                                    <option value="SHOW_DONE">เคสที่ดำเนินการเสร็จสิ้น</option>
                                    <option value="OPEN">เปิด</option>
                                    <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                                    <option value="WAITING_INFO">รอข้อมูล</option>
                                    <option value="RESOLVED">แก้ไขแล้ว</option>
                                    <option value="CLOSED">ปิดเคส</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-500 font-medium">Priority</span>
                                <select
                                    value={currentPriority}
                                    onChange={(e) => applyFilter("priority", e.target.value)}
                                    className="bg-[#0b1121] border border-[#1e2d4a] rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                                >
                                    <option value="ALL">ทุกระดับ</option>
                                    <option value="LOW">ต่ำ</option>
                                    <option value="MEDIUM">ปานกลาง</option>
                                    <option value="HIGH">สูง</option>
                                    <option value="CRITICAL">วิกฤต</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1e2d4a] bg-[#0d1526]">
                                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase px-4 py-3 tracking-wide">Case No</th>
                                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase px-4 py-3 tracking-wide">Summary</th>
                                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase px-4 py-3 tracking-wide">Category</th>
                                <th className="text-center text-[11px] font-semibold text-slate-400 uppercase px-4 py-3 tracking-wide">Status</th>
                                <th className="text-center text-[11px] font-semibold text-slate-400 uppercase px-4 py-3 tracking-wide">Priority</th>
                                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase px-4 py-3 tracking-wide">Assignee</th>
                                <th className="text-left text-[11px] font-semibold text-slate-400 uppercase px-4 py-3 tracking-wide">Created</th>
                                <th className="text-center text-[11px] font-semibold text-slate-400 uppercase px-4 py-3 tracking-wide">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cases.map((c) => (
                                <tr
                                    key={c.id}
                                    className="border-b border-[#1a2540] hover:bg-[#1a2540]/50 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/admin/cases/${c.id}`)}
                                >
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs text-indigo-400 font-medium">{c.caseNo}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-white truncate max-w-[200px]">{c.problemSummary}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-slate-400">{c.category.name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`badge ${getStatusColor(c.status)} text-[10px]`}>
                                            {getStatusLabel(c.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`badge ${getPriorityColor(c.priority)} text-[10px]`}>
                                            {getPriorityLabel(c.priority)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {c.assignee ? (
                                            <span className="text-xs text-slate-300">{c.assignee.fullName}</span>
                                        ) : canAssign ? (
                                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => setAssigningId(assigningId === c.id ? null : c.id)}
                                                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                                >
                                                    <UserPlus className="w-3 h-3" />
                                                    มอบหมาย
                                                </button>
                                                {assigningId === c.id && (
                                                    <div className="absolute top-8 left-0 z-20 bg-[#1a2540] border border-[#1e2d4a] rounded-lg shadow-xl py-1 min-w-[160px]">
                                                        {staffUsers.map((s) => (
                                                            <button
                                                                key={s.id}
                                                                onClick={() => handleAssign(c.id, s.id)}
                                                                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-[#0b1121] hover:text-white transition-colors"
                                                            >
                                                                {s.fullName}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-500 italic">รอมอบหมาย</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</span>
                                        {isSLABreached(c.slaDueAt, c.status) && (
                                            <span className="ml-1.5 badge bg-red-500/20 text-red-400 text-[9px]">SLA</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Link
                                            href={`/admin/cases/${c.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1.5 rounded-lg hover:bg-[#1a2540] text-slate-400 hover:text-white transition-colors inline-flex"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {cases.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                        ไม่พบเคสที่ค้นหา
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => goToPage(page - 1)}
                        disabled={page <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#111a2e] border border-[#1e2d4a] text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => goToPage(p)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${p === page
                                ? "bg-blue-600 text-white"
                                : "bg-[#111a2e] border border-[#1e2d4a] text-slate-400 hover:text-white"
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                    {totalPages > 5 && (
                        <span className="text-slate-500 text-xs px-1">…</span>
                    )}
                    <button
                        onClick={() => goToPage(page + 1)}
                        disabled={page >= totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#111a2e] border border-[#1e2d4a] text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            <ImportCasesModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
        </div>
    );
}
