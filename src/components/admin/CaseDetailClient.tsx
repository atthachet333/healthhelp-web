"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Clock,
    User,
    MessageCircle,
    AlertCircle,
    CheckCircle2,
    UserPlus,
    Star,
    Send,
    Loader2,
    Phone,
    Mail,
    MapPin,
    Lock,
    Paperclip,
    X,
    FileText,
    Trash2,
} from "lucide-react";
import {
    getStatusLabel,
    getStatusColor,
    getPriorityLabel,
    getPriorityColor,
    formatDateTime,
    getChannelLabel,
} from "@/lib/utils";
import { addCaseUpdate, assignCase, deleteAttachment } from "@/app/actions/admin-actions";
import { toast } from "react-hot-toast";

interface CaseData {
    id: string;
    caseNo: string;
    problemSummary: string;
    description: string;
    status: string;
    priority: string;
    channel: string;
    trackingCode: string;
    createdAt: string;
    updatedAt: string;
    slaDueAt: string | null;
    resolvedAt: string | null;
    closedAt: string | null;
    reporter: {
        id: string;
        fullName: string;
        phone: string;
        email: string | null;
        lineId: string | null;
        address: string | null;
    };
    category: { id: string; name: string };
    assignee: { id: string; fullName: string } | null;
    updates: {
        id: string;
        actionType: string;
        oldValue: string | null;
        newValue: string | null;
        note: string | null;
        createdAt: string;
        user: { fullName: string; role: string } | null;
        attachments: { id: string; fileName: string; fileUrl: string }[];
    }[];
    csatRating: { score: number; comment: string | null } | null;
}

interface StaffUser {
    id: string;
    fullName: string;
    role: string;
}

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={onClose}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt}
                className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
            <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-xl font-bold transition-colors"
            >
                ✕
            </button>
        </div>
    );
}

export function CaseDetailClient({
    caseData,
    staffUsers,
}: {
    caseData: CaseData;
    staffUsers: StaffUser[];
}) {
    const router = useRouter();
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; fileName: string } | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [internalNote, setInternalNote] = useState("");
    const [publicNote, setPublicNote] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [submittingInternal, setSubmittingInternal] = useState(false);
    const [submittingPublic, setSubmittingPublic] = useState(false);
    const [showAssign, setShowAssign] = useState(false);
    const [publicFiles, setPublicFiles] = useState<File[]>([]);
    const [internalFiles, setInternalFiles] = useState<File[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);

    const currentUserRole = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("healthhelp_user") || "{}").role
        : null;
    const isViewer = currentUserRole === "VIEWER";
    const canAssign = currentUserRole === "ADMIN" || currentUserRole === "SUPERVISOR";

    async function handleSubmitInternal() {
        if (!internalNote.trim() && !newStatus && internalFiles.length === 0) return;
        setSubmittingInternal(true);
        const user = JSON.parse(localStorage.getItem("healthhelp_user") || "{}");

        // Handle file uploads
        const uploadedAttachments = [];
        if (internalFiles.length > 0) {
            setUploadingFiles(true);
            try {
                const formData = new FormData();
                internalFiles.forEach(file => formData.append("files", file));
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                if (!uploadRes.ok) throw new Error("Upload failed");
                const uploadData = await uploadRes.json();
                uploadedAttachments.push(...uploadData.files);
            } catch (error) {
                console.error("File upload error:", error);
                toast.error("อัปโหลดไฟล์ไม่สำเร็จ");
                setSubmittingInternal(false);
                setUploadingFiles(false);
                return;
            }
            setUploadingFiles(false);
        }

        const finalNote = internalNote.trim() || (internalFiles.length > 0 ? "ส่งไฟล์แนบ/หลักฐานเพิ่มเติม" : "");
        await addCaseUpdate(caseData.id, user.id, finalNote, newStatus || undefined, false, uploadedAttachments);
        setInternalNote("");
        setInternalFiles([]);
        setNewStatus("");
        setSubmittingInternal(false);
        toast.success("บันทึกข้อมูลและอัปเดตสถานะสำเร็จ");
        router.refresh();
    }

    async function handleSubmitPublic() {
        if (!publicNote.trim() && publicFiles.length === 0) return;
        setSubmittingPublic(true);
        const user = JSON.parse(localStorage.getItem("healthhelp_user") || "{}");

        let uploadedAttachments: any[] = [];

        // ถ้ามีไฟล์ให้ upload ก่อน แล้วสร้างข้อความเดียวที่มีทั้งข้อความและไฟล์ (เหมือนแชท)
        // 🚩 ส่วนที่แก้ไข: วนลูปส่งไฟล์ทีละไฟล์เพื่อให้ตรงกับ API route.ts
        if (publicFiles.length > 0) {
            setUploadingFiles(true);
            try {
                for (const file of publicFiles) {
                    const formData = new FormData();
                    formData.append("file", file); // 👈 แก้จาก "files" เป็น "file"
                    formData.append("caseNo", caseData.caseNo); // 👈 ส่งเลขเคสไปด้วย
                    formData.append("phone", caseData.reporter.phone); // 👈 ส่งเบอร์โทรไปด้วย

                    const uploadRes = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                    });

                    if (!uploadRes.ok) {
                        const errorData = await uploadRes.json();
                        throw new Error(errorData.error || "Upload failed");
                    }

                    const uploadData = await uploadRes.json();
                    
                    // เก็บข้อมูลไฟล์ที่อัปโหลดสำเร็จเข้า Array
                    uploadedAttachments.push({
                        fileUrl: uploadData.fileUrl,
                        fileName: file.name,
                        fileType: file.type
                    });
                }
            } catch (err: any) {
                console.error("Upload error:", err);
                toast.error("อัปโหลดไฟล์ไม่สำเร็จ: " + err.message);
                setUploadingFiles(false);
                setSubmittingPublic(false);
                return;
            }
            setUploadingFiles(false);
        }

        const finalNote = publicNote.trim();
        await addCaseUpdate(caseData.id, user.id, finalNote, undefined, true, uploadedAttachments);
        setPublicNote("");
        setPublicFiles([]);
        setSubmittingPublic(false);
        toast.success("ส่งข้อความถึงผู้แจ้งสำเร็จ");
        router.refresh();
    }

    /* ==== ส่งไฟล์เป็น bubble ใหม่แยก (ฝั่งแอดมิน) ==== */
    async function handleSendFileOnlyAdmin(files: File[]) {
        if (files.length === 0) return;
        setUploadingFiles(true);
        const user = JSON.parse(localStorage.getItem("healthhelp_user") || "{}");
        try {
            const formData = new FormData();
            files.forEach(f => formData.append("files", f));
            const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
            if (!uploadRes.ok) throw new Error("Upload failed");
            const uploadData = await uploadRes.json();
            const uploaded = (uploadData.files || []).map((f: any) => ({ ...f, fileSize: f.fileSize || 0 }));
            await addCaseUpdate(caseData.id, user.id, "แนบไฟล์/รูปภาพเพิ่มเติม", undefined, true, uploaded);
            toast.success("ส่งไฟล์ถึงผู้แจ้งสำเร็จ");
            router.refresh();
        } catch {
            toast.error("อัปโหลดไฟล์ไม่สำเร็จ");
        }
        setUploadingFiles(false);
    }

    async function handleDeleteAttachment() {
        if (!deleteConfirm) return;

        const user = JSON.parse(localStorage.getItem("healthhelp_user") || "{}");
        setDeletingId(deleteConfirm.id);

        try {
            const result = await deleteAttachment(deleteConfirm.id, user.id);

            if (!result.success) {
                toast.error(result.error || "เกิดข้อผิดพลาดในการลบ");
                return;
            }

            toast.success("ลบไฟล์สำเร็จ");
            setDeleteConfirm(null);
            router.refresh();
        } catch (error) {
            console.error("Delete attachment error:", error);
            toast.error("เกิดข้อผิดพลาดในการลบ");
        } finally {
            setDeletingId(null);
        }
    }

    async function handleAssign(assigneeId: string) {
        const user = JSON.parse(localStorage.getItem("healthhelp_user") || "{}");
        await assignCase(caseData.id, assigneeId, user.id);
        setShowAssign(false);
        toast.success("บันทึกการมอบหมายผู้รับผิดชอบสำเร็จ");
        router.refresh();
    }

    function getActionIcon(actionType: string) {
        switch (actionType) {
            case "SYSTEM": return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
            case "STATUS_CHANGE": return <AlertCircle className="w-4 h-4 text-yellow-400" />;
            case "ASSIGN": return <UserPlus className="w-4 h-4 text-green-400" />;
            case "COMMENT": return <MessageCircle className="w-4 h-4 text-indigo-400" />;
            default: return <Clock className="w-4 h-4 text-gray-400" />;
        }
    }

    function removePublicFile(index: number) {
        setPublicFiles(prev => prev.filter((_, i) => i !== index));
    }

    function removeInternalFile(index: number) {
        setInternalFiles(prev => prev.filter((_, i) => i !== index));
    }

    const isSLABreached =
        caseData.slaDueAt &&
        caseData.status !== "RESOLVED" &&
        caseData.status !== "CLOSED" &&
        new Date(caseData.slaDueAt) < new Date();

    return (
        <div className="space-y-6">
            {/* Lightbox */}
            {lightboxSrc && (
                <ImageLightbox
                    src={lightboxSrc}
                    alt="รูปขยาย"
                    onClose={() => setLightboxSrc(null)}
                />
            )}

            {/* Delete Confirm Dialog */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-3xl p-7 sm:p-8 max-w-xl w-full shadow-2xl">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0">
                                <Trash2 className="w-7 h-7 text-red-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">ยืนยันการลบไฟล์</h3>
                        </div>
                        <p className="text-slate-300 text-lg mb-3">แน่ใจหรือไม่ที่จะลบไฟล์นี้?</p>
                        <p className="text-slate-300 text-sm sm:text-base bg-slate-900/50 px-4 py-3 rounded-xl mb-5 break-all">
                            📎 {deleteConfirm.fileName}
                        </p>
                        <p className="text-red-400 text-sm sm:text-base leading-relaxed mb-6">⚠ ไฟล์จะถูกลบออกจากเว็บ, โฟลเดอร์ และชีต Google Sheets ถาวร กู้คืนไม่ได้</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={!!deletingId}
                                className="flex-1 px-5 py-3.5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleDeleteAttachment}
                                disabled={!!deletingId}
                                className="flex-1 px-5 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2.5"
                            >
                                {deletingId ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                ลบไฟล์
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/cases" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-sm font-medium">
                        <ArrowLeft className="w-5 h-5" />
                        ย้อนกลับ
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold text-white font-mono">{caseData.caseNo}</h2>
                            <span className={`badge ${getStatusColor(caseData.status)} text-sm px-3 py-1`}>
                                {getStatusLabel(caseData.status)}
                            </span>
                            <span className={`badge ${getPriorityColor(caseData.priority)} text-sm px-3 py-1`}>
                                {getPriorityLabel(caseData.priority)}
                            </span>
                            {isSLABreached && (
                                <span className="badge bg-red-500/20 text-red-400 text-sm px-3 py-1 animate-pulse-slow">⚠ เกิน SLA</span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            สร้างเมื่อ {formatDateTime(caseData.createdAt)} • ช่องทาง: {getChannelLabel(caseData.channel)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Problem Description */}
                    <div className="card p-6 md:p-8">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-4">{caseData.problemSummary}</h3>
                        <p className="text-slate-300 text-base md:text-lg whitespace-pre-wrap leading-relaxed">
                            {caseData.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                        </p>
                    </div>

                    {/* Timeline */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-400" />
                            ไทม์ไลน์
                        </h3>
                        <div className="space-y-6">
                            {caseData.updates.map((u) => {
                                // Default assumption for CaseDetailClient (Admin view):
                                // If the user who made the update is the same as the assignee/staff, it's an admin reply (right side).
                                // But a simpler logic is: if actionType === "COMMENT" and isPublic and !u.user, it's the reporter (left side).
                                // Actually, any update by !u.user is either SYSTEM or REPORTER. 
                                // Reporter's comment: !u.user && u.actionType === "COMMENT"
                                const isReporterReply = !u.user && u.actionType === "COMMENT";
                                const isSystem = !u.user && u.actionType !== "COMMENT";
                                const isAdminReply = !!u.user;

                                if (isReporterReply) {
                                    return (
                                        <div key={u.id} className="flex justify-start mb-4">
                                            <div className="max-w-[85%] sm:max-w-[75%]">
                                                <div className="flex items-center justify-start gap-2 mb-1">
                                                    <span className="text-sm font-bold text-slate-800">ผู้แจ้ง (คุณ {caseData.reporter.fullName})</span>
                                                    <span className="text-xs text-slate-400">{formatDateTime(u.createdAt)}</span>
                                                </div>
                                                <div className="bg-white border text-slate-800 border-slate-200 rounded-2xl rounded-tl-sm px-5 py-3 shadow-md">
                                                    {u.note && <p className="text-sm sm:text-base leading-relaxed">{u.note}</p>}
                                                    {u.attachments && u.attachments.length > 0 && (
                                                        <div className="mt-3 flex flex-col gap-2">
                                                            {u.attachments.map((file, idx) => (
                                                                <div key={idx} className="relative group/file w-fit">
                                                                    {file.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img
                                                                            src={file.fileUrl}
                                                                            alt={file.fileName}
                                                                            className="max-w-[220px] max-h-[220px] object-cover rounded-xl shadow-md border border-slate-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                                                                            onClick={() => setLightboxSrc(file.fileUrl)}
                                                                        />
                                                                    ) : (
                                                                        <a
                                                                            href={file.fileUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-2 text-xs bg-slate-50 hover:bg-slate-100 text-indigo-700 px-3 py-2 rounded-xl border border-slate-200 transition-colors w-fit"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <FileText className="w-4 h-4 shrink-0 text-indigo-500" />
                                                                            <span className="truncate max-w-[250px] text-slate-700">{file.fileName}</span>
                                                                        </a>
                                                                    )}
                                                                    {/* ปุ่มลบ - เฉพาะ ADMIN/SUPERVISOR */}
                                                                    {canAssign && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setDeleteConfirm({ id: file.id, fileName: file.fileName })}
                                                                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity shadow-md hover:bg-red-700"
                                                                            title="ลบไฟล์นี้"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }


                                if (isAdminReply) {
                                    return (
                                        <div key={u.id} className="flex justify-end mb-4">
                                            <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end">
                                                <div className="flex items-center justify-end gap-2 mb-1 text-right">
                                                    <span className="text-xs text-slate-400">{formatDateTime(u.createdAt)}</span>
                                                    {/* @ts-expect-error - isPublic check */}
                                                    {u.isPublic && u.actionType === "COMMENT" && (
                                                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mr-2">
                                                            PUBLIC
                                                        </span>
                                                    )}
                                                    {u.user?.role && (
                                                        <span className="text-[10px] font-medium text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md">
                                                            {u.user.role}
                                                        </span>
                                                    )}
                                                    <span className="text-sm font-bold text-slate-200">
                                                        {u.user?.fullName}
                                                    </span>
                                                </div>
                                                {/* @ts-expect-error - isPublic check */}
                                                <div className={`rounded-2xl rounded-tr-sm px-5 py-3 shadow-md ${u.actionType === 'COMMENT' && u.isPublic ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 border-slate-700 text-slate-300'} border`}>
                                                    {/* @ts-expect-error - isPublic check */}
                                                    {u.actionType === 'COMMENT' && !u.isPublic && (
                                                        <div className="text-[11px] text-amber-500/80 mb-2 flex items-center justify-end gap-1 font-bold">
                                                            <Lock className="w-3 h-3" /> บันทึกภายใน
                                                        </div>
                                                    )}
                                                    {u.actionType === "STATUS_CHANGE" && (
                                                        <div className="text-xs mb-2 bg-slate-900/50 p-2 rounded-lg inline-block border border-slate-700 w-full text-center">
                                                            <span className={`badge ${getStatusColor(u.oldValue || "")} mr-1`}>
                                                                {getStatusLabel(u.oldValue || "")}
                                                            </span>
                                                            →
                                                            <span className={`badge ${getStatusColor(u.newValue || "")} ml-1`}>
                                                                {getStatusLabel(u.newValue || "")}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {u.actionType === "ASSIGN" && (
                                                        <p className="text-sm font-bold text-green-400 mb-1 text-right">มอบหมายให้: {u.newValue}</p>
                                                    )}
                                                    {u.note && (
                                                        <p className="text-sm sm:text-base leading-relaxed text-right">{u.note}</p>
                                                    )}
                                                    {u.attachments && u.attachments.length > 0 && (
                                                        <div className="mt-3 flex flex-col gap-2 items-end">
                                                            {u.attachments.map((file: any, idx: number) => (
                                                                <div key={idx} className="relative group/file">
                                                                    {file.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img
                                                                            src={file.fileUrl}
                                                                            alt={file.fileName}
                                                                            className="max-w-[220px] max-h-[220px] object-cover rounded-xl shadow-md border border-indigo-500/30 cursor-zoom-in hover:opacity-90 transition-opacity"
                                                                            onClick={() => setLightboxSrc(file.fileUrl)}
                                                                        />
                                                                    ) : (
                                                                        <a
                                                                            href={file.fileUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-2 text-xs bg-slate-900/50 hover:bg-slate-900/80 text-indigo-300 px-3 py-2 rounded-xl border border-indigo-500/30 transition-colors w-fit"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <FileText className="w-4 h-4 shrink-0" />
                                                                            <span className="truncate max-w-[250px]">{file.fileName}</span>
                                                                        </a>
                                                                    )}
                                                                    {/* ปุ่มลบ - เฉพาะ ADMIN/SUPERVISOR */}
                                                                    {canAssign && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setDeleteConfirm({ id: file.id, fileName: file.fileName })}
                                                                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity shadow-md hover:bg-red-700"
                                                                            title="ลบไฟล์นี้"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                // System message (center)
                                return (
                                    <div key={u.id} className="flex justify-center mb-4 my-6">
                                        <div className="bg-slate-800/80 border border-slate-700 text-slate-400 rounded-full px-4 py-1.5 text-xs flex items-center gap-2">
                                            {getActionIcon(u.actionType)}
                                            {u.note} • {formatDateTime(u.createdAt)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Public Reply Box (Inside Chat) */}
                        {!isViewer && (
                            <div className="mt-4 border-t border-indigo-900 pt-4">
                                <h4 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4" />
                                    ตอบกลับผู้ใช้งาน (แชท)
                                </h4>
                                {/* Text + send */}
                                <div className="flex gap-2 items-end mb-2">
                                    <textarea
                                        value={publicNote}
                                        onChange={(e) => setPublicNote(e.target.value)}
                                        className="flex-1 input-field min-h-[60px] py-2.5 text-sm resize-none"
                                        placeholder="พิมพ์ข้อความตอบกลับผู้ใช้งาน..."
                                    />
                                    <button
                                        onClick={handleSubmitPublic}
                                        disabled={(!publicNote.trim() && publicFiles.length === 0) || submittingPublic || uploadingFiles}
                                        className="btn-primary h-auto px-4 py-2.5 flex items-center gap-1.5 min-h-[52px] text-sm disabled:opacity-50"
                                    >
                                        {submittingPublic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        ส่ง
                                    </button>
                                </div>

                                {/* แสดงไฟล์ที่เลือกแนบ (ฝั่งแอดมิน → ผู้ใช้งาน) */}
                                {publicFiles.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-3">
                                        {publicFiles.map((f, i) => (
                                            <div key={i} className="relative group">
                                                {f.type.startsWith("image/") ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={URL.createObjectURL(f)}
                                                        alt={f.name}
                                                        className="w-16 h-16 object-cover rounded-lg border border-indigo-400/60 shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-slate-900 rounded-lg border border-indigo-500/40 flex flex-col items-center justify-center gap-1">
                                                        <FileText className="w-4 h-4 text-indigo-300" />
                                                        <span className="text-[8px] text-indigo-200 px-1 text-center truncate w-full">
                                                            {f.name}
                                                        </span>
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removePublicFile(i)}
                                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* แนบไฟล์ (จะส่งพร้อมข้อความเมื่อกดปุ่ม "ส่ง") */}
                                <label className={`flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-all text-xs font-semibold select-none ${
                                        uploadingFiles
                                            ? "border-indigo-700 bg-indigo-900/20 text-indigo-500 pointer-events-none"
                                            : "border-indigo-600/60 bg-transparent text-indigo-400 hover:bg-indigo-900/30 hover:border-indigo-500 hover:text-indigo-300"
                                    }`}>
                                    {uploadingFiles ? (
                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังอัปโหลดไฟล์...</>
                                    ) : (
                                        <><Paperclip className="w-3.5 h-3.5" /> แนบรูป/ไฟล์</>
                                    )}
                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        disabled={uploadingFiles}
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setPublicFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                            }
                                            e.target.value = "";
                                        }}
                                    />
                                </label>
                            </div>
                        )}
                    </div>


                    {/* Internal Reply Box */}
                    {!isViewer && (
                        <div className="card border border-slate-700/50 bg-slate-800/30">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-slate-400" />
                                บันทึกการทำงานภายใน / เปลี่ยนสถานะ
                            </h3>

                            {internalFiles.length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-3 p-3 bg-slate-900/40 rounded-xl border border-slate-700">
                                    {internalFiles.map((f, i) => (
                                        <div key={i} className="relative group">
                                            {f.type.startsWith("image/") ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={URL.createObjectURL(f)}
                                                    alt={f.name}
                                                    className="w-16 h-16 object-cover rounded-lg border-2 border-slate-600 shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-slate-800 rounded-lg border-2 border-slate-600 flex flex-col items-center justify-center gap-1">
                                                    <FileText className="w-5 h-5 text-slate-400" />
                                                    <span className="text-[8px] text-slate-400 px-1 text-center truncate w-full">{f.name}</span>
                                                </div>
                                            )}
                                            <button onClick={() => removeInternalFile(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="relative mb-4">
                                <textarea
                                    value={internalNote}
                                    onChange={(e) => setInternalNote(e.target.value)}
                                    className="input-field min-h-[80px] w-full bg-slate-900/50 resize-none"
                                    placeholder="พิมพ์บันทึกข้อความภายในระบบ (ผู้แจ้งจะไม่เห็นข้อความนี้)..."
                                />
                            </div>
                            {/* Attach File for Internal */}
                            <label className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 hover:text-white rounded-xl cursor-pointer transition-all text-sm font-semibold select-none">
                                <Paperclip className="w-4 h-4" />
                                📎 แนบไฟล์/รูปภาพ
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) setInternalFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                        e.target.value = '';
                                    }}
                                />
                            </label>

                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="input-field w-auto py-2 bg-slate-900/50"
                                >
                                    <option value="">ไม่เปลี่ยนสถานะ</option>
                                    <option value="OPEN">เปิด</option>
                                    <option value="IN_PROGRESS">กำลังดำเนินการ</option>
                                    <option value="WAITING_INFO">รอข้อมูลเพิ่มเติม</option>
                                    <option value="RESOLVED">แก้ไขแล้ว</option>
                                    <option value="CLOSED">ปิดเคส</option>
                                </select>
                                <button
                                    onClick={handleSubmitInternal}
                                    disabled={(!internalNote.trim() && !newStatus && internalFiles.length === 0) || submittingInternal || uploadingFiles}
                                    className="btn-primary py-2 bg-slate-700 hover:bg-slate-600 shadow-none border border-slate-600"
                                >
                                    {submittingInternal || uploadingFiles ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    บันทึกข้อมูล
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Reporter Info */}
                    <div className="card">
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-indigo-400" />
                            ข้อมูลผู้แจ้ง
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-slate-500 text-xs">ชื่อ-นามสกุล</p>
                                <p className="text-white font-medium">{caseData.reporter.fullName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                <p className="text-slate-300">{caseData.reporter.phone}</p>
                            </div>
                            {caseData.reporter.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                                    <p className="text-slate-300">{caseData.reporter.email}</p>
                                </div>
                            )}
                            {caseData.reporter.lineId && (
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                                    <p className="text-slate-300">{caseData.reporter.lineId}</p>
                                </div>
                            )}
                            {caseData.reporter.address && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                                    <p className="text-slate-300">{caseData.reporter.address}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Case Properties */}
                    <div className="card">
                        <h4 className="text-sm font-bold text-white mb-4">คุณสมบัติเคส</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">ประเภท</span>
                                <span className="text-slate-300">{caseData.category.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">ระดับ</span>
                                <span className={`badge ${getPriorityColor(caseData.priority)} text-[10px]`}>
                                    {getPriorityLabel(caseData.priority)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">ผู้รับผิดชอบ</span>
                                <div className="relative">
                                    {!canAssign ? (
                                        <span className="text-slate-300 font-medium text-right inline-block">
                                            {caseData.assignee?.fullName || "รอมอบหมาย"}
                                        </span>
                                    ) : caseData.assignee ? (
                                        <button
                                            onClick={() => setShowAssign(!showAssign)}
                                            className="text-slate-300 hover:text-indigo-400 transition-colors text-right"
                                        >
                                            {caseData.assignee.fullName}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowAssign(!showAssign)}
                                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                        >
                                            <UserPlus className="w-3 h-3" />
                                            มอบหมาย
                                        </button>
                                    )}
                                    {showAssign && (
                                        <div className="absolute right-0 top-8 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 min-w-[180px]">
                                            {staffUsers.map((s) => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => handleAssign(s.id)}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                                >
                                                    {s.fullName}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {caseData.slaDueAt && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">SLA</span>
                                    <span className={`text-sm ${isSLABreached ? "text-red-400" : "text-slate-300"}`}>
                                        {formatDateTime(caseData.slaDueAt)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-slate-500">Tracking Code</span>
                                <span className="font-mono text-xs text-indigo-400">{caseData.trackingCode}</span>
                            </div>
                        </div>
                    </div>

                    {/* CSAT */}
                    {caseData.csatRating && (
                        <div className="card border-amber-500/30 bg-amber-500/5">
                            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-400" />
                                คะแนนความพึงพอใจ
                            </h4>
                            <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <span
                                        key={s}
                                        className={`text-xl ${s <= caseData.csatRating!.score ? "text-amber-400" : "text-slate-600"}`}
                                    >
                                        ★
                                    </span>
                                ))}
                                <span className="text-white font-bold ml-2">{caseData.csatRating.score}/5</span>
                            </div>
                            {caseData.csatRating.comment && (
                                <p className="text-sm text-slate-400 italic">&ldquo;{caseData.csatRating.comment}&rdquo;</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
