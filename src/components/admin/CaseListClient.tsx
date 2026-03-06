"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Search, Filter, ChevronLeft, ChevronRight, Eye, User,
    UserPlus,
    FileText,
} from "lucide-react";
import { getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor, formatDateTime } from "@/lib/utils";
import { useState, useEffect } from "react";
import { assignCase } from "@/app/actions/admin-actions";

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

    useEffect(() => {
        const stored = localStorage.getItem("healthhelp_user");
        if (stored) {
            try {
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

    function isSLABreached(slaDueAt: string | Date | null, status: string): boolean {
        if (!slaDueAt) return false;
        if (status === "RESOLVED" || status === "CLOSED") return false;
        return new Date(slaDueAt) < new Date();
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-indigo-400" />
                        จัดการเคส
                    </h2>
                    <p className="text-slate-500 text-sm">{total} เคสทั้งหมด</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card flex flex-wrap gap-4 items-center">
                <Filter className="w-5 h-5 text-slate-500" />

                <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        defaultValue={currentSearch}
                        placeholder="ค้นหาเลขเคส, ชื่อ, เบอร์โทร..."
                        className="input-field pl-12 py-2 w-full"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") applyFilter("search", (e.target as HTMLInputElement).value);
                        }}
                    />
                </div>

                <select
                    value={currentStatus}
                    onChange={(e) => applyFilter("status", e.target.value)}
                    className="input-field w-auto py-2"
                >
                    <option value="ALL">ทุกสถานะ</option>
                    <option value="OPEN">เปิด</option>
                    <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                    <option value="WAITING_INFO">รอข้อมูล</option>
                    <option value="RESOLVED">แก้ไขแล้ว</option>
                    <option value="CLOSED">ปิดเคส</option>
                </select>

                <select
                    value={currentPriority}
                    onChange={(e) => applyFilter("priority", e.target.value)}
                    className="input-field w-auto py-2"
                >
                    <option value="ALL">ทุกระดับ</option>
                    <option value="LOW">ต่ำ</option>
                    <option value="MEDIUM">ปานกลาง</option>
                    <option value="HIGH">สูง</option>
                    <option value="CRITICAL">วิกฤต</option>
                </select>
            </div>

            {/* Table */}
            <div className="card overflow-x-auto p-0">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">เลขเคส</th>
                            <th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">หัวข้อ</th>
                            <th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">ผู้แจ้ง</th>
                            <th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">ประเภท</th>
                            <th className="text-center text-xs font-semibold text-slate-400 uppercase px-4 py-3">ระดับ</th>
                            <th className="text-center text-xs font-semibold text-slate-400 uppercase px-4 py-3">สถานะ</th>
                            <th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">ผู้รับ</th>
                            <th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">SLA</th>
                            <th className="text-center text-xs font-semibold text-slate-400 uppercase px-4 py-3">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cases.map((c) => (
                            <tr
                                key={c.id}
                                className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer"
                                onClick={() => router.push(`/admin/cases/${c.id}`)}
                            >
                                <td className="px-4 py-3">
                                    <span className="font-mono text-sm text-indigo-400 font-medium">{c.caseNo}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-sm text-white truncate max-w-[200px]">{c.problemSummary}</p>
                                    <p className="text-xs text-slate-500">{formatDateTime(c.createdAt)}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="text-sm text-slate-300">{c.reporter.fullName}</p>
                                    <p className="text-xs text-slate-500">{c.reporter.phone}</p>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-xs text-slate-400">{c.category.name}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`badge ${getPriorityColor(c.priority)} text-[10px]`}>
                                        {getPriorityLabel(c.priority)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`badge ${getStatusColor(c.status)} text-[10px]`}>
                                        {getStatusLabel(c.status)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {c.assignee ? (
                                        <span className="text-sm text-slate-300">{c.assignee.fullName}</span>
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
                                                <div className="absolute top-8 left-0 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 min-w-[180px]">
                                                    {staffUsers.map((s) => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => handleAssign(c.id, s.id)}
                                                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
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
                                    {isSLABreached(c.slaDueAt, c.status) ? (
                                        <span className="badge bg-red-500/20 text-red-400 text-[10px]">เกิน SLA</span>
                                    ) : c.slaDueAt ? (
                                        <span className="text-xs text-slate-500">{formatDateTime(c.slaDueAt)}</span>
                                    ) : (
                                        <span className="text-xs text-slate-600">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <Link
                                        href={`/admin/cases/${c.id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors inline-flex"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {cases.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                                    ไม่พบเคสที่ค้นหา
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        หน้า {page} จาก {totalPages} ({total} เคส)
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => goToPage(page - 1)}
                            disabled={page <= 1}
                            className="btn-secondary py-2 px-3 disabled:opacity-30"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => goToPage(page + 1)}
                            disabled={page >= totalPages}
                            className="btn-secondary py-2 px-3 disabled:opacity-30"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
