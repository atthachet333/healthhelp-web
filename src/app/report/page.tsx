import { CreateCaseForm } from "@/components/public/CreateCaseForm";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, HeartPulse } from "lucide-react";

export default function ReportPage() {
    const mockCategories = [
        { id: "1", name: "ปัญหาฮาร์ดแวร์ (Hardware/คอมพิวเตอร์)" },
        { id: "2", name: "ปัญหาระบบเครือข่าย (Network/Internet)" },
        { id: "3", name: "ปัญหาซอฟต์แวร์ (Software/โปรแกรม)" },
        { id: "4", name: "ภัยคุกคามทางไซเบอร์ (Hacking/ไวรัส)" },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc] w-full">
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm px-6 lg:px-12 py-5 w-full">
                <div className="max-w-8xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-4 text-slate-500 hover:text-blue-600 transition-colors group">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                            <ArrowLeft className="w-7 h-7" />
                        </div>
                        <span className="font-bold text-xl hidden sm:block">กลับหน้าหลัก</span>
                    </Link>

                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <HeartPulse className="w-9 h-9 text-white" />
                        </div>
                        <span className="font-black text-3xl sm:text-4xl text-slate-900 tracking-tighter">HealthHelp Report</span>
                    </div>

                    <div className="flex items-center gap-3 text-base sm:text-lg font-bold text-slate-400 bg-slate-50 px-5 py-2.5 rounded-2xl">
                        <ShieldCheck className="w-7 h-7 text-emerald-500" />
                        <span className="hidden sm:block">Secure Connection</span>
                    </div>
                </div>
            </header>

            {/* 👇 เพิ่ม padding ด้านซ้ายขวา (px-6 lg:px-12) เพื่อไม่ให้ชิดขอบจอเกินไป */}
            <main className="flex-grow w-full flex flex-col items-center pt-12 px-6 lg:px-12 pb-0">

                {/* 👇 ขยายความกว้างสูงสุดเป็น 6XL ให้ฟอร์มดูกว้างสบายตา */}
                <div className="w-full max-w-6xl flex flex-col h-full flex-grow">
                    <div className="mb-12 text-center w-full shrink-0">
                        <div className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-emerald-50 text-emerald-600 font-bold text-base mb-6 border border-emerald-100">
                            <ShieldCheck className="w-6 h-6" /> ระบบเข้ารหัสข้อมูลปลอดภัยสูงสุด
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">แบบฟอร์มแจ้งปัญหา</h1>
                        <p className="text-slate-500 text-xl md:text-2xl font-medium">กรุณากรอกข้อมูลตามขั้นตอนด้านล่าง เพื่อความรวดเร็วในการตรวจสอบ</p>
                    </div>

                    <div className="bg-white rounded-t-[3.5rem] shadow-2xl p-8 sm:p-16 border border-slate-200 border-b-0 w-full mx-auto flex-grow flex flex-col">
                        <CreateCaseForm categories={mockCategories} />
                    </div>
                </div>

            </main>
        </div>
    );
}