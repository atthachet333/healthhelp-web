"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Tag, Clock, Plus, Save, Loader2 } from "lucide-react";
import { getPriorityLabel, getPriorityColor } from "@/lib/utils";
import { createCategory, updateCategory, updateSLARule } from "@/app/actions/admin-actions";

interface Category {
    id: string;
    name: string;
    defaultPriority: string;
    active: boolean;
}

interface SLARule {
    id: string;
    priority: string;
    resolveWithinHours: number;
    notifyBeforeHours: number;
    category: { name: string } | null;
}

export function SettingsClient({
    categories,
    slaRules,
}: {
    categories: Category[];
    slaRules: SLARule[];
}) {
    const router = useRouter();
    const [tab, setTab] = useState<"categories" | "sla">("categories");
    const [newCatName, setNewCatName] = useState("");
    const [newCatPriority, setNewCatPriority] = useState("MEDIUM");
    const [saving, setSaving] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>("");

    useEffect(() => {
        const stored = localStorage.getItem("healthhelp_user");
        if (stored) {
            try {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setCurrentUserId(JSON.parse(stored).id);
            } catch { }
        }
    }, []);

    async function handleAddCategory() {
        if (!newCatName.trim()) return;
        setSaving(true);
        await createCategory(newCatName, newCatPriority, currentUserId);
        setNewCatName("");
        setSaving(false);
        router.refresh();
    }

    async function handleToggleCategory(cat: Category) {
        await updateCategory(cat.id, cat.name, cat.defaultPriority, !cat.active, currentUserId);
        router.refresh();
    }

    async function handleSaveSLA(rule: SLARule, hours: number, notify: number) {
        await updateSLARule(rule.id, hours, notify, currentUserId);
        router.refresh();
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-white flex items-center gap-3 tracking-tight">
                    <Settings className="w-9 h-9 text-indigo-400" />
                    ตั้งค่าระบบ
                </h2>
                <p className="text-slate-400 text-lg mt-2">จัดการหมวดหมู่ปัญหา และ กฎ SLA</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 bg-[#111a2e] border border-[#1e2d4a] p-2 rounded-2xl w-fit">
                <button
                    onClick={() => setTab("categories")}
                    className={`px-7 py-3.5 rounded-xl text-base font-bold transition-all ${tab === "categories" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                        }`}
                >
                    <Tag className="w-5 h-5 inline mr-2" />
                    หมวดหมู่
                </button>
                <button
                    onClick={() => setTab("sla")}
                    className={`px-7 py-3.5 rounded-xl text-base font-bold transition-all ${tab === "sla" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                        }`}
                >
                    <Clock className="w-5 h-5 inline mr-2" />
                    กฎ SLA
                </button>
            </div>

            {tab === "categories" && (
                <div className="space-y-6">
                    {/* Add New Category */}
                    <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-3xl p-8">
                        <h3 className="text-xl font-extrabold text-white mb-5 flex items-center gap-3">
                            <Plus className="w-6 h-6 text-green-400" />
                            เพิ่มหมวดหมู่ใหม่
                        </h3>
                        <div className="flex gap-5 items-end flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <label className="text-base font-bold text-slate-300 mb-2 block">ชื่อหมวดหมู่</label>
                                <input
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    className="input-field py-3.5 text-base"
                                    placeholder="เช่น ปัญหาทางเทคนิค"
                                />
                            </div>
                            <div className="w-48">
                                <label className="text-base font-bold text-slate-300 mb-2 block">ระดับเริ่มต้น</label>
                                <select
                                    value={newCatPriority}
                                    onChange={(e) => setNewCatPriority(e.target.value)}
                                    className="input-field py-3.5 text-base"
                                >
                                    <option value="LOW">ต่ำ</option>
                                    <option value="MEDIUM">ปานกลาง</option>
                                    <option value="HIGH">สูง</option>
                                    <option value="CRITICAL">วิกฤต</option>
                                </select>
                            </div>
                            <button onClick={handleAddCategory} disabled={saving} className="btn-primary py-3.5 px-7 text-base">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                เพิ่ม
                            </button>
                        </div>
                    </div>

                    {/* Category List */}
                    <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-3xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#1e2d4a] bg-[#0b1121]">
                                    <th className="text-left text-sm font-extrabold text-slate-400 uppercase tracking-wider px-7 py-5">ชื่อ</th>
                                    <th className="text-center text-sm font-extrabold text-slate-400 uppercase tracking-wider px-7 py-5">ระดับเริ่มต้น</th>
                                    <th className="text-center text-sm font-extrabold text-slate-400 uppercase tracking-wider px-7 py-5">สถานะ</th>
                                    <th className="text-center text-sm font-extrabold text-slate-400 uppercase tracking-wider px-7 py-5">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1e2d4a]">
                                {categories.map((cat) => (
                                    <tr key={cat.id} className="hover:bg-[#0b1121]/50 transition-colors">
                                        <td className="px-7 py-5 text-white text-base font-semibold">{cat.name}</td>
                                        <td className="px-7 py-5 text-center">
                                            <span className={`badge ${getPriorityColor(cat.defaultPriority)} text-sm`}>
                                                {getPriorityLabel(cat.defaultPriority)}
                                            </span>
                                        </td>
                                        <td className="px-7 py-5 text-center">
                                            <span className={`badge text-sm ${cat.active ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-500"}`}>
                                                {cat.active ? "เปิดใช้" : "ปิดใช้"}
                                            </span>
                                        </td>
                                        <td className="px-7 py-5 text-center">
                                            <button
                                                onClick={() => handleToggleCategory(cat)}
                                                className="text-base font-semibold text-indigo-400 hover:text-white transition-colors px-5 py-2 rounded-xl hover:bg-indigo-500/20"
                                            >
                                                {cat.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === "sla" && (
                <div className="bg-[#111a2e] border border-[#1e2d4a] rounded-3xl p-8">
                    <h3 className="text-xl font-extrabold text-white mb-7 flex items-center gap-3">
                        <Clock className="w-6 h-6 text-cyan-400" />
                        กำหนดเวลา SLA ตามระดับความเร่งด่วน
                    </h3>
                    <div className="space-y-5">
                        {slaRules.map((rule) => (
                            <SLARuleRow key={rule.id} rule={rule} onSave={handleSaveSLA} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function SLARuleRow({
    rule,
    onSave,
}: {
    rule: { id: string; priority: string; resolveWithinHours: number; notifyBeforeHours: number };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSave: (rule: any, hours: number, notify: number) => void;
}) {
    const [hours, setHours] = useState(rule.resolveWithinHours);
    const [notify, setNotify] = useState(rule.notifyBeforeHours);
    const changed = hours !== rule.resolveWithinHours || notify !== rule.notifyBeforeHours;

    return (
        <div className="flex flex-wrap items-center gap-5 bg-[#0b1121] border border-[#1e2d4a] rounded-2xl p-6">
            <span className={`badge ${getPriorityColor(rule.priority)} text-base w-28 justify-center py-2`}>
                {getPriorityLabel(rule.priority)}
            </span>
            <div className="flex items-center gap-3">
                <label className="text-base font-semibold text-slate-400">แก้ไขภายใน</label>
                <input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="input-field w-28 py-2.5 text-center text-base"
                />
                <span className="text-base text-slate-400">ชั่วโมง</span>
            </div>
            <div className="flex items-center gap-3">
                <label className="text-base font-semibold text-slate-400">แจ้งเตือนก่อน</label>
                <input
                    type="number"
                    value={notify}
                    onChange={(e) => setNotify(Number(e.target.value))}
                    className="input-field w-28 py-2.5 text-center text-base"
                />
                <span className="text-base text-slate-400">ชั่วโมง</span>
            </div>
            {changed && (
                <button
                    onClick={() => onSave(rule, hours, notify)}
                    className="btn-primary py-2.5 px-6 text-base"
                >
                    <Save className="w-5 h-5" />
                    บันทึก
                </button>
            )}
        </div>
    );
}
