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
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Settings className="w-6 h-6 text-indigo-400" />
                    ตั้งค่าระบบ
                </h2>
                <p className="text-slate-500 text-sm">จัดการหมวดหมู่ปัญหา และ กฎ SLA</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-800 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setTab("categories")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "categories" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                        }`}
                >
                    <Tag className="w-4 h-4 inline mr-1" />
                    หมวดหมู่
                </button>
                <button
                    onClick={() => setTab("sla")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "sla" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                        }`}
                >
                    <Clock className="w-4 h-4 inline mr-1" />
                    กฎ SLA
                </button>
            </div>

            {tab === "categories" && (
                <div className="space-y-4">
                    {/* Add New Category */}
                    <div className="card">
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-green-400" />
                            เพิ่มหมวดหมู่ใหม่
                        </h3>
                        <div className="flex gap-3 items-end flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <label className="text-xs text-slate-500 mb-1 block">ชื่อหมวดหมู่</label>
                                <input
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    className="input-field py-2"
                                    placeholder="เช่น ปัญหาทางเทคนิค"
                                />
                            </div>
                            <div className="w-40">
                                <label className="text-xs text-slate-500 mb-1 block">ระดับเริ่มต้น</label>
                                <select
                                    value={newCatPriority}
                                    onChange={(e) => setNewCatPriority(e.target.value)}
                                    className="input-field py-2"
                                >
                                    <option value="LOW">ต่ำ</option>
                                    <option value="MEDIUM">ปานกลาง</option>
                                    <option value="HIGH">สูง</option>
                                    <option value="CRITICAL">วิกฤต</option>
                                </select>
                            </div>
                            <button onClick={handleAddCategory} disabled={saving} className="btn-primary py-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                เพิ่ม
                            </button>
                        </div>
                    </div>

                    {/* Category List */}
                    <div className="card p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">ชื่อ</th>
                                    <th className="text-center text-xs font-semibold text-slate-400 uppercase px-4 py-3">ระดับเริ่มต้น</th>
                                    <th className="text-center text-xs font-semibold text-slate-400 uppercase px-4 py-3">สถานะ</th>
                                    <th className="text-center text-xs font-semibold text-slate-400 uppercase px-4 py-3">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((cat) => (
                                    <tr key={cat.id} className="border-b border-slate-800">
                                        <td className="px-4 py-3 text-white">{cat.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`badge ${getPriorityColor(cat.defaultPriority)} text-xs`}>
                                                {getPriorityLabel(cat.defaultPriority)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`badge text-xs ${cat.active ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-500"}`}>
                                                {cat.active ? "เปิดใช้" : "ปิดใช้"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleToggleCategory(cat)}
                                                className="text-xs text-slate-400 hover:text-white transition-colors"
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
                <div className="card">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        กำหนดเวลา SLA ตามระดับความเร่งด่วน
                    </h3>
                    <div className="space-y-4">
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
        <div className="flex flex-wrap items-center gap-4 bg-slate-800/50 rounded-xl p-4">
            <span className={`badge ${getPriorityColor(rule.priority)} text-xs w-20 justify-center`}>
                {getPriorityLabel(rule.priority)}
            </span>
            <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">แก้ไขภายใน</label>
                <input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="input-field w-20 py-1 text-center"
                />
                <span className="text-xs text-slate-500">ชั่วโมง</span>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">แจ้งเตือนก่อน</label>
                <input
                    type="number"
                    value={notify}
                    onChange={(e) => setNotify(Number(e.target.value))}
                    className="input-field w-20 py-1 text-center"
                />
                <span className="text-xs text-slate-500">ชั่วโมง</span>
            </div>
            {changed && (
                <button
                    onClick={() => onSave(rule, hours, notify)}
                    className="btn-primary py-1.5 px-3 text-xs"
                >
                    <Save className="w-3 h-3" />
                    บันทึก
                </button>
            )}
        </div>
    );
}
