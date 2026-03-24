"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import imageCompression from "browser-image-compression"; // ระบบบีบอัดรูปภาพ
import {
    ArrowLeft, Clock, User, MessageCircle, AlertCircle, CheckCircle2,
    UserPlus, Star, Send, Loader2, Phone, Mail, MapPin, Lock,
    Paperclip, X, FileText, Trash2, ImageIcon,
} from "lucide-react";
import {
    getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor,
    formatDateTime, getChannelLabel,
} from "@/lib/utils";
import { addCaseUpdate, assignCase, deleteAttachment } from "@/app/actions/admin-actions";
import { toast } from "react-hot-toast";

interface CaseData {
    id: string; caseNo: string; problemSummary: string; description: string;
    status: string; priority: string; channel: string; trackingCode: string;
    createdAt: string; updatedAt: string; slaDueAt: string | null;
    reporter: { id: string; fullName: string; phone: string; email: string | null; lineId: string | null; address: string | null; };
    category: { id: string; name: string };
    assignee: { id: string; fullName: string } | null;
    updates: {
        id: string; actionType: string; note: string | null; createdAt: string;
        user: { fullName: string; role: string } | null;
        attachments: { id: string; fileName: string; fileUrl: string }[];
        isPublic?: boolean; oldValue?: string; newValue?: string;
    }[];
    csatRating: { score: number; comment: string | null } | null;
}

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200" onClick={onClose}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
            <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center font-bold">✕</button>
        </div>
    );
}

export function CaseDetailClient({ caseData, staffUsers }: { caseData: CaseData; staffUsers: any[] }) {
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

    const currentUserRole = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("healthhelp_user") || "{}").role : null;
    const canAssign = currentUserRole === "ADMIN" || currentUserRole === "SUPERVISOR";

    // 🖼️ ฟังก์ชันช่วยบีบอัดรูปภาพ
    const compressImages = async (files: File[]) => {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        const hasImage = files.some(f => f.type.startsWith("image/"));
        if (hasImage) toast.loading("กำลังบีบอัดรูปภาพ...", { id: "compress" });

        const processed = await Promise.all(files.map(async (file) => {
            if (file.type.startsWith("image/")) {
                try {
                    const compressed = await imageCompression(file, options);
                    return new File([compressed], file.name, { type: compressed.type });
                } catch { return file; }
            }
            return file;
        }));

        toast.dismiss("compress");
        return processed;
    };

    async function handleUpload(files: File[]) {
        const uploaded = [];
        for (const file of files) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("caseNo", caseData.caseNo);
            formData.append("phone", caseData.reporter.phone);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            uploaded.push({ fileUrl: data.fileUrl, fileName: file.name, fileType: file.type });
        }
        return uploaded;
    }

    async function handleSubmitPublic() {
        if (!publicNote.trim() && publicFiles.length === 0) return;
        setSubmittingPublic(true);
        const user = JSON.parse(localStorage.getItem("healthhelp_user") || "{}");
        let attachments: any[] = [];
        if (publicFiles.length > 0) {
            setUploadingFiles(true);
            attachments = await handleUpload(publicFiles);
            setUploadingFiles(false);
        }
        await addCaseUpdate(caseData.id, user.id, publicNote.trim(), undefined, true, attachments);
        setPublicNote(""); setPublicFiles([]); setSubmittingPublic(false);
        toast.success("ส่งแชทสำเร็จ"); router.refresh();
    }

    async function handleSubmitInternal() {
        if (!internalNote.trim() && !newStatus && internalFiles.length === 0) return;
        setSubmittingInternal(true);
        const user = JSON.parse(localStorage.getItem("healthhelp_user") || "{}");
        let attachments: any[] = [];
        if (internalFiles.length > 0) {
            setUploadingFiles(true);
            attachments = await handleUpload(internalFiles);
            setUploadingFiles(false);
        }
        await addCaseUpdate(caseData.id, user.id, internalNote.trim(), newStatus || undefined, false, attachments);
        setInternalNote(""); setInternalFiles([]); setNewStatus(""); setSubmittingInternal(false);
        toast.success("บันทึกสำเร็จ"); router.refresh();
    }

    async function handleDelete() {
        if (!deleteConfirm) return;
        setDeletingId(deleteConfirm.id);
        const user = JSON.parse(localStorage.getItem("healthhelp_user") || "{}");
        const res = await deleteAttachment(deleteConfirm.id, user.id);
        if (res.success) { toast.success("ลบไฟล์แล้ว"); setDeleteConfirm(null); router.refresh(); }
        else toast.error("ลบไม่สำเร็จ");
        setDeletingId(null);
    }

    const allAttachments = caseData.updates.flatMap(u => u.attachments || []);

    return (
        <div className="space-y-6">
            {lightboxSrc && <ImageLightbox src={lightboxSrc} alt="ขยาย" onClose={() => setLightboxSrc(null)} />}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-slate-800 p-8 rounded-3xl max-w-md w-full border border-slate-700 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">ยืนยันการลบไฟล์แนบ?</h3>
                        <p className="text-slate-400 text-sm mb-6 break-all">📎 {deleteConfirm.fileName}</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold">ยกเลิก</button>
                            <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                                {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} ลบถาวร
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4">
                <Link href="/admin/cases" className="p-2 bg-slate-800 rounded-xl text-white hover:bg-slate-700 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
                <h2 className="text-2xl font-bold text-white font-mono">{caseData.caseNo}</h2>
                <span className={`badge ${getStatusColor(caseData.status)}`}>{getStatusLabel(caseData.status)}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-6">
                        <h3 className="text-xl font-bold text-white mb-2">{caseData.problemSummary}</h3>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{caseData.description || "ไม่มีรายละเอียด"}</p>
                    </div>

                    {/* Chat Timeline */}
                    <div className="card p-6 h-[450px] overflow-y-auto custom-scrollbar flex flex-col gap-4 bg-slate-900/40">
                        {caseData.updates.map(u => (
                            <div key={u.id} className={`flex ${u.user ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${u.user ? (u.isPublic ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700') : 'bg-white text-slate-800'} rounded-tr-none`}>
                                    <div className="flex items-center gap-2 mb-1 text-[10px] opacity-60 font-bold uppercase">
                                        <span>{u.user?.fullName || "ผู้แจ้ง"}</span> • <span>{formatDateTime(u.createdAt)}</span>
                                        {!u.isPublic && u.user && <Lock className="w-3 h-3 text-amber-500" />}
                                    </div>
                                    <p className="text-sm leading-relaxed">{u.note}</p>
                                    {u.attachments?.map(f => (
                                        <div key={f.id} className="mt-2">
                                            {f.fileUrl.match(/\.(jpeg|jpg|png|webp)$/i) ?
                                                <img src={f.fileUrl} alt="attach" className="w-40 h-40 object-cover rounded-xl cursor-zoom-in border border-black/10" onClick={() => setLightboxSrc(f.fileUrl)} /> :
                                                <a href={f.fileUrl} target="_blank" className="flex items-center gap-2 text-xs bg-black/10 p-2 rounded-lg"><FileText className="w-4 h-4" /> {f.fileName}</a>
                                            }
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input */}
                    <div className="card p-4 space-y-4">
                        <textarea value={publicNote} onChange={e => setPublicNote(e.target.value)} placeholder="พิมพ์ข้อความตอบกลับผู้แจ้ง..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm min-h-[80px] focus:border-indigo-500 outline-none" />
                        <div className="flex justify-between items-center">
                            <label className="cursor-pointer text-indigo-400 text-xs flex items-center gap-2 hover:text-indigo-300 font-bold">
                                <Paperclip className="w-4 h-4" /> {publicFiles.length > 0 ? `${publicFiles.length} ไฟล์` : 'แนบไฟล์ให้ลูกค้า'}
                                <input type="file" multiple className="hidden" onChange={async e => { if (e.target.files) setPublicFiles(await compressImages(Array.from(e.target.files))); }} />
                            </label>
                            <button onClick={handleSubmitPublic} disabled={submittingPublic || uploadingFiles} className="btn-primary px-8 py-2.5 rounded-xl font-bold flex items-center gap-2">
                                {submittingPublic ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />} ส่งแชท
                            </button>
                        </div>
                    </div>

                    {/* Internal Record */}
                    <div className="card p-6 border-slate-700 bg-slate-800/20">
                        <h4 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">บันทึกภายใน / จัดการสถานะ</h4>
                        <textarea value={internalNote} onChange={e => setInternalNote(e.target.value)} placeholder="โน้ตเฉพาะแอดมิน (ลูกค้าไม่เห็น)..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm mb-4" />
                        <div className="flex gap-3">
                            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 text-sm flex-1 outline-none">
                                <option value="">คงเดิม</option><option value="OPEN">เปิด</option><option value="IN_PROGRESS">ดำเนินการ</option><option value="RESOLVED">แก้แล้ว</option><option value="CLOSED">ปิดเคส</option>
                            </select>
                            <button onClick={handleSubmitInternal} disabled={submittingInternal} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                                {submittingInternal ? <Loader2 className="animate-spin w-4 h-4" /> : "บันทึกภายใน"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card p-6">
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><User className="w-4 h-4 text-indigo-400" /> ข้อมูลผู้แจ้ง</h4>
                        <div className="space-y-3 text-sm">
                            <p className="text-white font-bold">{caseData.reporter.fullName}</p>
                            <p className="text-slate-400">{caseData.reporter.phone}</p>
                        </div>
                    </div>

                    {/* 🗂️ Sidebar: All Files List */}
                    <div className="card p-6">
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Paperclip className="w-4 h-4 text-indigo-400" /> ไฟล์แนบทั้งหมด ({allAttachments.length})</h4>
                        <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                            {allAttachments.map(f => (
                                <div key={f.id} className="group relative flex items-center gap-3 p-3 bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-indigo-500 transition-all cursor-pointer" onClick={() => f.fileUrl.match(/\.(jpeg|jpg|png|webp)$/i) ? setLightboxSrc(f.fileUrl) : window.open(f.fileUrl)}>
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                                        {f.fileUrl.match(/\.(jpeg|jpg|png|webp)$/i) ? <ImageIcon className="w-4 h-4 text-indigo-400" /> : <FileText className="w-4 h-4 text-indigo-400" />}
                                    </div>
                                    <span className="text-[11px] text-slate-300 truncate flex-1 font-medium">{f.fileName}</span>
                                    {canAssign && <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: f.id, fileName: f.fileName }); }} className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>}
                                </div>
                            ))}
                            {allAttachments.length === 0 && <p className="text-center text-xs text-slate-600 py-4 italic">ไม่มีไฟล์แนบ</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}