"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
    {
        q: "ใช้งานฟรีหรือเปล่า?",
        a: "ใช้งานได้ฟรีทุกฟีเจอร์ ไม่มีค่าบริการใดๆ เปิดรับการแจ้งปัญหาตลอด 24 ชั่วโมง",
    },
    {
        q: "รับรหัสติดตามได้จากที่ไหน?",
        a: "หลังจากกรอกข้อมูลและส่งปัญหาเรียบร้อยแล้ว ระบบจะแสดงรหัสติดตาม (Tracking Code) บนหน้าจอ และส่ง SMS แจ้งเตือนไปยังเบอร์โทรที่ท่านลงทะเบียนไว้",
    },
    {
        q: "ใช้เวลานานแค่ไหนกว่าจะได้รับการแก้ไข?",
        a: "ปกติเจ้าหน้าที่จะติดต่อกลับภายใน 24 ชั่วโมงทำการ สำหรับกรณีเร่งด่วนจะได้รับการดูแลเป็นพิเศษ",
    },
    {
        q: "ถ้าลืมรหัสติดตามต้องทำอย่างไร?",
        a: "ท่านสามารถติดต่อเจ้าหน้าที่โดยตรงผ่านหน้า 'ติดต่อเรา' พร้อมแจ้งชื่อและเบอร์โทรที่ลงทะเบียนไว้ เจ้าหน้าที่จะค้นหาเคสให้ท่านได้",
    },
    {
        q: "แจ้งปัญหาได้กี่ช่องทาง?",
        a: "สามารถแจ้งปัญหาได้ผ่านเว็บไซต์นี้ หรือโทรติดต่อโดยตรงที่ 02-xxx-xxxx และผ่านอีเมล helpdesk@healthhelp.com",
    },
];

export function FAQSection() {
    const [open, setOpen] = useState<number | null>(null);

    return (
        <div className="w-full py-20 px-6 sm:px-10">
            <div className="text-center mb-12">
                <span className="inline-block px-5 py-2 bg-indigo-50 text-indigo-700 font-bold text-base rounded-full mb-4 border border-indigo-200">
                    ❓ คำถามที่พบบ่อย
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800">มีข้อสงสัยไหม?</h2>
                <p className="text-slate-500 mt-3 text-lg">เราได้รวบรวมคำถามที่ผู้ใช้งานถามบ่อยไว้ให้แล้ว</p>
            </div>

            <div className="space-y-4 w-full">
                {faqs.map((faq, i) => (
                    <div
                        key={i}
                        className="bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-300 transition-all shadow-sm overflow-hidden"
                    >
                        <button
                            onClick={() => setOpen(open === i ? null : i)}
                            className="w-full flex items-center justify-between px-7 py-5 text-left gap-4"
                        >
                            <span className="text-lg font-bold text-slate-800 leading-snug">{faq.q}</span>
                            <span className="shrink-0 w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                                {open === i
                                    ? <ChevronUp className="w-5 h-5 text-blue-600" />
                                    : <ChevronDown className="w-5 h-5 text-blue-600" />
                                }
                            </span>
                        </button>
                        {open === i && (
                            <div className="px-7 pb-6 text-slate-600 text-base leading-relaxed border-t border-slate-100 pt-4">
                                {faq.a}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
