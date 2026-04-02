"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import {
    ArrowLeft, Clock, User, AlertCircle,
    UserPlus, Star, Send, Loader2, Phone, Mail, MapPin, Lock,
    Paperclip, FileText, Trash2, ImageIcon, Hash, Calendar,
    ShieldCheck, Tag, Zap, UserCheck,
} from "lucide-react";
import {
    getStatusLabel, getPriorityLabel, getPriorityColor,
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
            <img src={src} alt={alt} className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
            <button onClick={onClose} className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-xl font-bold">✕</button>
        </div>
    );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadgeLarge({ status }: { status: string }) {
    const configs: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
        OPEN: { label: "รอรับเรื่อง", bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/40", dot: "bg-amber-400" },
        IN_PROGRESS: { label: "กำลังดำเนินการ", bg: "bg-blue-500/15", text: "text-blue-300", border: "border-blue-500/40", dot: "bg-blue-400" },
        WAITING_INFO: { label: "รอข้อมูลเพิ่ม", bg: "bg-orange-500/15", text: "text-orange-300", border: "border-orange-500/40", dot: "bg-orange-400" },
        RESOLVED: { label: "แก้ไขแล้ว", bg: "bg-green-500/15", text: "text-green-300", border: "border-green-500/40", dot: "bg-green-400" },
        CLOSED: { label: "ปิดเคส", bg: "bg-slate-500/15", text: "text-slate-400", border: "border-slate-500/40", dot: "bg-slate-500" },
    };
    const cfg = configs[status] ?? { label: status, bg: "bg-slate-500/15", text: "text-slate-400", border: "border-slate-500/40", dot: "bg-slate-500" };
    return (
        <span className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl border-2 text-base font-extrabold tracking-wide ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span className={`w-3 h-3 rounded-full shrink-0 ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-4 py-4 border-b border-[#1e2d4a] last:border-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0 mt-0.5">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <div className="text-base font-bold text-slate-200 break-all">{value}</div>
            </div>
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
    const [publicFiles, setPublicFiles] = useState<File[]>([]);
    const [internalFiles, setInternalFiles] = useState<File[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [assigneeId, setAssigneeId] = useState(caseData.assignee?.id ?? "");
    const [assignLoading, setAssignLoading] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    const currentUser = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("healthhelp_user") || "{}")
        : {};
    const currentUserRole = currentUser?.role ?? null;
    const canAssign = currentUserRole === "ADMIN" || currentUserRole === "SUPERVISOR";

    const slaOk = caseData.slaDueAt ? new Date(caseData.slaDueAt) > new Date() : null;

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
        let attachments: any[] = [];
        if (publicFiles.length > 0) { setUploadingFiles(true); attachments = await handleUpload(publicFiles); setUploadingFiles(false); }
        await addCaseUpdate(caseData.id, currentUser.id, publicNote.trim(), undefined, true, attachments);
        setPublicNote(""); setPublicFiles([]); setSubmittingPublic(false);
        toast.success("ส่งแชทสำเร็จ"); router.refresh();
    }

    async function handleSubmitInternal() {
        if (!internalNote.trim() && !newStatus && internalFiles.length === 0) return;
        setSubmittingInternal(true);
        let attachments: any[] = [];
        if (internalFiles.length > 0) { setUploadingFiles(true); attachments = await handleUpload(internalFiles); setUploadingFiles(false); }
        await addCaseUpdate(caseData.id, currentUser.id, internalNote.trim(), newStatus || undefined, false, attachments);
        setInternalNote(""); setInternalFiles([]); setNewStatus(""); setSubmittingInternal(false);
        toast.success("บันทึกสำเร็จ"); router.refresh();
    }

    async function handleAssign() {
        if (!assigneeId || !canAssign) return;
        setAssignLoading(true);
        const res = await assignCase(caseData.id, assigneeId, currentUser.id);
        if (res.success) { toast.success("มอบหมายเคสสำเร็จ"); router.refresh(); }
        else toast.error(res.error || "เกิดข้อผิดพลาด");
        setAssignLoading(false);
    }

    async function handleDelete() {
        if (!deleteConfirm) return;
        setDeletingId(deleteConfirm.id);
        const res = await deleteAttachment(deleteConfirm.id, currentUser.id);
        if (res.success) { toast.success("ลบไฟล์แล้ว"); setDeleteConfirm(null); router.refresh(); }
        else toast.error("ลบไม่สำเร็จ");
        setDeletingId(null);
    }

    const allAttachments = caseData.updates.flatMap(u => u.attachments || []);

    return (
        <div className="space-y-8 font-sans">
            {lightboxSrc && <ImageLightbox src={lightboxSrc} alt="ขยาย" onClose={() => setLightboxSrc(null)} />}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#111a2e] p-8 rounded-3xl max-w-md w-full border border-[#1e2d4a] shadow-2xl">
                        <h3 className="text-2xl font-bold text-white mb-4">ยืนยันการลบไฟล์แนบ?</h3>
                        <p className="text-slate-400 text-base mb-6 break-all">📎 {deleteConfirm.fileName}</p>
                        <div className="flex gap-4">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors text-lg">ยกเลิก</button>
                            <button onClick={handleDelete} className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-lg">
                                {deletingId ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />} ลบถาวร
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Close Case Confirm Modal */}
            {showCloseConfirm && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#111a2e] p-8 rounded-3xl max-w-lg w-full border-2 border-red-500/40 shadow-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                                <Lock className="w-8 h-8 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-extrabold text-white">ยืนยันการปิดเคส?</h3>
                                <p className="text-slate-400 text-sm mt-1">เคส {caseData.caseNo} จะถูกปิดถาวร</p>
                            </div>
                        </div>
                        <p className="text-slate-300 text-base mb-8 bg-[#0b1121] border border-[#1e2d4a] rounded-2xl p-5 leading-relaxed">
                            เมื่อปิดเคสแล้ว สถานะจะเปลี่ยนเป็น <span className="font-bold text-slate-100">"ปิดเคส"</span> และจะแจ้งผู้แจ้งปัญหาทราบ คุณแน่ใจหรือไม่?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowCloseConfirm(false)}
                                className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors text-lg"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={async () => { setShowCloseConfirm(false); await handleSubmitInternal(); }}
                                disabled={submittingInternal}
                                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-extrabold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 text-lg"
                            >
                                {submittingInternal ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                                ยืนยันปิดเคส
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Top Bar ── */}
            <div className="flex items-center gap-5 flex-wrap">
                <Link href="/admin/cases" className="p-3 bg-[#111a2e] border border-[#1e2d4a] rounded-xl text-slate-300 hover:bg-[#1a2540] hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">{caseData.caseNo}</h2>
                <StatusBadgeLarge status={caseData.status} />
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${getPriorityColor(caseData.priority)}`}>
                    <Zap className="w-4 h-4" />
                    {getPriorityLabel(caseData.priority)}
                </span>
            </div>

            {/* ── Main 2-Column Layout ── */}
            <div className="flex flex-col xl:flex-row gap-8 items-start">

                {/* ════ LEFT (Main Content) ════ */}
                <div className="w-full xl:flex-1 space-y-8 min-w-0">

                    {/* Problem Summary Card */}
                    <div className="bg-[#111a2e] rounded-3xl border border-[#1e2d4a] shadow-lg p-8">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 leading-snug">{caseData.problemSummary}</h3>
                        <p className="text-slate-300 text-lg whitespace-pre-wrap leading-relaxed">{caseData.description || "ไม่มีรายละเอียด"}</p>
                    </div>

                    {/* Chat Timeline */}
                    <div className="bg-[#0b1121] border border-[#1e2d4a] rounded-3xl p-6 h-[500px] sm:h-[600px] overflow-y-auto flex flex-col gap-5">
                        {caseData.updates.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-slate-500 text-lg italic">ยังไม่มีการสื่อสาร</div>
                        )}
                        {caseData.updates.map(u => (
                            <div key={u.id} className={`flex ${u.user ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] p-5 rounded-2xl shadow-md ${u.user
                                        ? u.isPublic
                                            ? "bg-indigo-600 text-white rounded-tr-none"
                                            : "bg-[#1a2540] text-slate-200 border border-[#253354] rounded-tr-none"
                                        : "bg-[#111a2e] text-slate-200 border border-[#1e2d4a] rounded-tl-none"
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2 text-xs opacity-70 font-bold uppercase tracking-wide">
                                        <span>{u.user?.fullName || "ผู้แจ้ง"}</span> •
                                        <span>{formatDateTime(u.createdAt)}</span>
                                        {!u.isPublic && u.user && <Lock className="w-4 h-4 text-amber-400" />}
                                    </div>
                                    {u.note && <p className="text-base sm:text-lg leading-relaxed">{u.note}</p>}
                                    {u.attachments?.map(f => (
                                        <div key={f.id} className="mt-3">
                                            {f.fileUrl.match(/\.(jpeg|jpg|png|webp)$/i)
                                                ? <img src={f.fileUrl} alt="attach" className="w-48 h-48 sm:w-64 sm:h-64 object-cover rounded-xl cursor-zoom-in border border-black/10" onClick={() => setLightboxSrc(f.fileUrl)} />
                                                : <a href={f.fileUrl} target="_blank" className="flex items-center gap-2 text-sm bg-black/20 p-3 rounded-xl"><FileText className="w-5 h-5" /> {f.fileName}</a>
                                            }
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Public Chat Input */}
                    <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-3xl p-6 sm:p-8 space-y-5">
                        <p className="text-sm font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Send className="w-5 h-5 text-indigo-400" />
                            ตอบกลับผู้แจ้ง (ลูกค้าเห็น)
                        </p>
                        <textarea
                            value={publicNote}
                            onChange={e => setPublicNote(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    if ((publicNote.trim() || publicFiles.length > 0) && !submittingPublic && !uploadingFiles) {
                                        handleSubmitPublic();
                                    }
                                }
                            }}
                            placeholder="พิมพ์ข้อความตอบกลับผู้แจ้ง... (กด Enter เพื่อส่ง)"
                            className="w-full bg-[#0b1121] border-2 border-[#1e2d4a] focus:border-indigo-500 rounded-2xl p-5 text-slate-200 placeholder:text-slate-600 text-lg min-h-[120px] outline-none transition-colors"
                        />
                        <div className="flex justify-between items-center">
                            <label className="cursor-pointer text-indigo-400 text-base flex items-center gap-2 hover:text-indigo-300 font-bold bg-indigo-500/10 px-4 py-2 rounded-xl transition-colors">
                                <Paperclip className="w-5 h-5" />
                                {publicFiles.length > 0 ? `${publicFiles.length} ไฟล์เลือกแล้ว` : "แนบไฟล์"}
                                <input type="file" multiple className="hidden" onChange={async e => { if (e.target.files) setPublicFiles(await compressImages(Array.from(e.target.files))); }} />
                            </label>
                            <button
                                onClick={handleSubmitPublic}
                                disabled={(!publicNote.trim() && publicFiles.length === 0) || submittingPublic || uploadingFiles}
                                className="flex items-center gap-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-base font-bold transition-all shadow-md disabled:opacity-60"
                            >
                                {submittingPublic ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                                ส่งข้อความ
                            </button>
                        </div>
                    </div>

                    {/* Internal Note + Status */}
                    <div className="bg-[#0b1121] border border-[#1e2d4a] rounded-3xl p-6 sm:p-8 space-y-5">
                        <p className="text-sm font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Lock className="w-5 h-5 text-slate-400" />
                            บันทึกภายใน / จัดการสถานะ (ลูกค้าไม่เห็น)
                        </p>
                        <textarea
                            value={internalNote}
                            onChange={e => setInternalNote(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    if ((internalNote.trim() || newStatus || internalFiles.length > 0) && !submittingInternal && !uploadingFiles) {
                                        if (newStatus === "CLOSED") {
                                            setShowCloseConfirm(true);
                                        } else {
                                            handleSubmitInternal();
                                        }
                                    }
                                }
                            }}
                            placeholder="โน้ตเฉพาะแอดมิน (ลูกค้าไม่เห็น)... (กด Enter เพื่อบันทึก)"
                            className="w-full bg-[#111a2e] border-2 border-[#1e2d4a] focus:border-indigo-500 rounded-2xl p-5 text-slate-200 placeholder:text-slate-600 text-lg min-h-[120px] outline-none transition-colors"
                        />
                        <div className="flex flex-col sm:flex-row gap-4">
                            <select
                                value={newStatus}
                                onChange={e => setNewStatus(e.target.value)}
                                className="bg-[#111a2e] border-2 border-[#1e2d4a] text-slate-200 rounded-2xl px-5 py-4 text-base font-medium flex-1 outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                            >
                                <option value="">— คงสถานะเดิม —</option>
                                <option value="OPEN">รอรับเรื่อง (OPEN)</option>
                                <option value="IN_PROGRESS">กำลังดำเนินการ (IN_PROGRESS)</option>
                                <option value="WAITING_INFO">รอข้อมูลเพิ่ม (WAITING_INFO)</option>
                                <option value="RESOLVED">แก้ไขแล้ว (RESOLVED)</option>
                                <option value="CLOSED">ปิดเคส (CLOSED)</option>
                            </select>
                            <label className="cursor-pointer text-slate-400 text-base flex items-center gap-2 hover:text-slate-200 font-bold px-4 py-4 bg-[#111a2e] border border-[#1e2d4a] rounded-2xl transition-colors">
                                <Paperclip className="w-5 h-5" />
                                {internalFiles.length > 0 ? `${internalFiles.length} ไฟล์` : "แนบไฟล์"}
                                <input type="file" multiple className="hidden" onChange={async e => { if (e.target.files) setInternalFiles(await compressImages(Array.from(e.target.files))); }} />
                            </label>

                            {/* Show red close-case button when CLOSED is selected; otherwise show normal save */}
                            {newStatus === "CLOSED" ? (
                                <button
                                    onClick={() => setShowCloseConfirm(true)}
                                    disabled={submittingInternal}
                                    className="flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-base font-extrabold transition-all disabled:opacity-60 shadow-lg shadow-red-900/40 animate-pulse"
                                >
                                    <Lock className="w-5 h-5" /> ยืนยันปิดเคส
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmitInternal}
                                    disabled={(!internalNote.trim() && !newStatus && internalFiles.length === 0) || submittingInternal || uploadingFiles}
                                    className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl text-base font-bold transition-all disabled:opacity-60"
                                >
                                    {submittingInternal ? <Loader2 className="animate-spin w-5 h-5" /> : "💾 บันทึกภายใน"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ════ RIGHT: Information Panel (Wider) ════ */}
                <div className="w-full xl:w-[450px] shrink-0 space-y-8">

                    {/* ── Card: Case Info ── */}
                    <div className="bg-[#111a2e] rounded-3xl border border-[#1e2d4a] shadow-lg p-8">
                        <h4 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Hash className="w-5 h-5 text-indigo-400" />
                            ข้อมูลเคส
                        </h4>
                        <div>
                            <InfoRow
                                icon={<Hash className="w-5 h-5 text-indigo-400" />}
                                label="รหัสติดตาม"
                                value={
                                    <span className="font-mono text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-base">
                                        {caseData.trackingCode}
                                    </span>
                                }
                            />
                            <InfoRow
                                icon={<Tag className="w-5 h-5 text-slate-400" />}
                                label="หมวดหมู่"
                                value={caseData.category.name}
                            />
                            <InfoRow
                                icon={<Calendar className="w-5 h-5 text-slate-400" />}
                                label="วันที่แจ้ง"
                                value={formatDateTime(caseData.createdAt)}
                            />
                            <InfoRow
                                icon={<Clock className="w-5 h-5 text-slate-400" />}
                                label="อัปเดตล่าสุด"
                                value={formatDateTime(caseData.updatedAt)}
                            />
                            {caseData.slaDueAt && (
                                <InfoRow
                                    icon={<AlertCircle className={`w-5 h-5 ${slaOk ? "text-green-400" : "text-red-400"}`} />}
                                    label="กำหนด SLA"
                                    value={
                                        <span className={`font-bold ${slaOk ? "text-green-400" : "text-red-400"}`}>
                                            {formatDateTime(caseData.slaDueAt)}
                                            {!slaOk && " ⚠️ เกินกำหนด"}
                                        </span>
                                    }
                                />
                            )}
                            <InfoRow
                                icon={<ShieldCheck className="w-5 h-5 text-slate-400" />}
                                label="ช่องทาง"
                                value={getChannelLabel(caseData.channel)}
                            />
                        </div>
                    </div>

                    {/* ── Card: Reporter Info ── */}
                    <div className="bg-[#111a2e] rounded-3xl border border-[#1e2d4a] shadow-lg p-8">
                        <h4 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-400" />
                            ข้อมูลผู้แจ้ง
                        </h4>
                        <div>
                            <InfoRow
                                icon={<User className="w-5 h-5 text-indigo-400" />}
                                label="ชื่อ-นามสกุล"
                                value={caseData.reporter.fullName}
                            />
                            <InfoRow
                                icon={<Phone className="w-5 h-5 text-green-400" />}
                                label="เบอร์โทรศัพท์"
                                value={
                                    <a href={`tel:${caseData.reporter.phone}`} className="text-indigo-400 hover:text-indigo-300 hover:underline font-bold transition-colors">
                                        {caseData.reporter.phone}
                                    </a>
                                }
                            />
                            {caseData.reporter.email && (
                                <InfoRow
                                    icon={<Mail className="w-5 h-5 text-blue-400" />}
                                    label="อีเมล"
                                    value={
                                        <a href={`mailto:${caseData.reporter.email}`} className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                                            {caseData.reporter.email}
                                        </a>
                                    }
                                />
                            )}
                            {caseData.reporter.address && (
                                <InfoRow
                                    icon={<MapPin className="w-5 h-5 text-rose-400" />}
                                    label="ที่อยู่"
                                    value={caseData.reporter.address}
                                />
                            )}
                        </div>
                    </div>

                    {/* ── Card: Assignee Selector ── */}
                    <div className="bg-[#111a2e] rounded-3xl border border-[#1e2d4a] shadow-lg p-8">
                        <h4 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-indigo-400" />
                            ผู้รับผิดชอบเคส
                        </h4>

                        {/* Current Assignee */}
                        <div className="flex items-center gap-4 mb-5 p-4 bg-[#0b1121] rounded-2xl border border-[#1e2d4a]">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                                <span className="text-white font-extrabold text-xl">
                                    {caseData.assignee ? caseData.assignee.fullName.charAt(0) : "?"}
                                </span>
                            </div>
                            <div>
                                <p className="text-slate-200 font-bold text-base">
                                    {caseData.assignee ? caseData.assignee.fullName : "ยังไม่มีผู้รับผิดชอบ"}
                                </p>
                                <p className="text-slate-500 text-sm mt-1">
                                    {caseData.assignee ? "ผู้รับผิดชอบปัจจุบัน" : "กรุณามอบหมายเคส"}
                                </p>
                            </div>
                        </div>

                        {canAssign ? (
                            <div className="space-y-4">
                                <select
                                    value={assigneeId}
                                    onChange={e => setAssigneeId(e.target.value)}
                                    className="w-full bg-[#0b1121] border-2 border-[#1e2d4a] focus:border-indigo-500 text-slate-200 rounded-2xl px-5 py-4 text-base font-semibold outline-none transition-colors cursor-pointer"
                                >
                                    <option value="">— เลือกผู้รับผิดชอบ —</option>
                                    {staffUsers.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.fullName} ({u.role})
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAssign}
                                    disabled={!assigneeId || assignLoading}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-base font-extrabold transition-all shadow-md"
                                >
                                    {assignLoading
                                        ? <><Loader2 className="w-5 h-5 animate-spin" /> กำลังบันทึก...</>
                                        : <><UserPlus className="w-5 h-5" /> มอบหมาย / เปลี่ยนผู้รับผิดชอบ</>
                                    }
                                </button>
                            </div>
                        ) : (
                            <p className="text-slate-600 text-sm text-center italic py-2 bg-[#0b1121] rounded-xl border border-[#1e2d4a]">
                                เฉพาะ Admin / Supervisor เท่านั้นที่มอบหมายเคสได้
                            </p>
                        )}
                    </div>

                    {/* ── Card: CSAT ── */}
                    {caseData.csatRating && (
                        <div className="bg-[#111a2e] rounded-3xl border border-[#1e2d4a] shadow-lg p-8">
                            <h4 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-400" />
                                ความพึงพอใจ (CSAT)
                            </h4>
                            <div className="flex items-center gap-4">
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`w-8 h-8 ${s <= caseData.csatRating!.score ? "text-amber-400 fill-amber-400" : "text-slate-700 fill-slate-700"}`} />
                                    ))}
                                </div>
                                <span className="text-4xl font-extrabold text-white">{caseData.csatRating.score}<span className="text-xl text-slate-500 font-normal">/5</span></span>
                            </div>
                            {caseData.csatRating.comment && (
                                <p className="text-slate-300 text-base mt-4 italic leading-relaxed bg-[#0b1121] p-4 rounded-xl border border-[#1e2d4a]">"{caseData.csatRating.comment}"</p>
                            )}
                        </div>
                    )}

                    {/* ── Card: Attachments ── */}
                    <div className="bg-[#111a2e] rounded-3xl border border-[#1e2d4a] shadow-lg p-8">
                        <h4 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Paperclip className="w-5 h-5 text-indigo-400" />
                            ไฟล์แนบทั้งหมด ({allAttachments.length})
                        </h4>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {allAttachments.map(f => (
                                <div
                                    key={f.id}
                                    className="group flex items-center gap-4 p-4 bg-[#0b1121] hover:bg-indigo-500/10 border border-[#1e2d4a] hover:border-indigo-500/40 rounded-2xl transition-all cursor-pointer"
                                    onClick={() => f.fileUrl.match(/\.(jpeg|jpg|png|webp)$/i) ? setLightboxSrc(f.fileUrl) : window.open(f.fileUrl)}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-[#111a2e] border border-[#1e2d4a] flex items-center justify-center shrink-0">
                                        {f.fileUrl.match(/\.(jpeg|jpg|png|webp)$/i)
                                            ? <ImageIcon className="w-6 h-6 text-indigo-400" />
                                            : <FileText className="w-6 h-6 text-indigo-400" />
                                        }
                                    </div>
                                    <span className="text-base text-slate-300 truncate flex-1 font-medium">{f.fileName}</span>
                                    {canAssign && (
                                        <button
                                            onClick={e => { e.stopPropagation(); setDeleteConfirm({ id: f.id, fileName: f.fileName }); }}
                                            className="opacity-0 group-hover:opacity-100 p-2.5 bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {allAttachments.length === 0 && (
                                <p className="text-center text-base text-slate-500 py-8 italic bg-[#0b1121] rounded-2xl border border-[#1e2d4a]">ไม่มีไฟล์แนบ</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}