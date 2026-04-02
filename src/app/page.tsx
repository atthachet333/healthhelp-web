import Link from "next/link";
import {
    AlertTriangle, Search, Lock, Clock, HeartPulse, ShieldCheck, Server, Headset
} from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans selection:bg-blue-500 selection:text-white">

            {/* ─── NAVIGATION ─── */}
            <nav className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-8xl mx-auto px-6 lg:px-12 py-5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
                            <HeartPulse className="w-8 h-8 text-white" />
                        </div>
                        <span className="font-black text-2xl sm:text-3xl text-slate-900 tracking-tighter">Health<span className="text-blue-600">Help</span></span>
                    </div>
                    <Link href="/admin" className="px-8 py-3.5 rounded-full bg-slate-100 border border-slate-200 text-base font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm">
                        สำหรับเจ้าหน้าที่
                    </Link>
                </div>
            </nav>

            {/* ─── MAIN CONTENT ─── */}
            <main className="flex-grow w-full flex flex-col">

                {/* ─── HERO SECTION ─── */}
                <section className="w-full flex-grow flex items-center justify-center py-20 lg:py-28 relative overflow-hidden bg-white">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,transparent_0%,#ffffff_100%)]"></div>
                    <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

                    <div className="max-w-6xl mx-auto px-6 lg:px-12 flex flex-col items-center text-center relative z-10 w-full mt-4">

                        <div className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-slate-900 border border-slate-800 text-white font-bold text-base md:text-lg mb-10 shadow-2xl">
                            <span className="relative flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500"></span>
                            </span>
                            ศูนย์รับแจ้งเหตุความมั่นคงปลอดภัยไซเบอร์ (Health CERT)
                        </div>

                        <h1 className="text-5xl sm:text-6xl md:text-[6rem] font-black text-slate-900 leading-[1.1] mb-8 tracking-tight w-full">
                            ปกป้องระบบสาธารณสุข <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">ตลอด 24 ชั่วโมง</span>
                        </h1>

                        <p className="text-xl md:text-3xl text-slate-500 mb-14 max-w-4xl leading-relaxed font-medium">
                            ศูนย์กลางการรับแจ้งเหตุขัดข้องทางระบบสารสนเทศ และรับมือภัยคุกคามทางไซเบอร์ สำหรับสถานพยาบาลและบุคลากรทางการแพทย์
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto justify-center mb-16">
                            <Link href="/report" className="px-12 py-6 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-2xl shadow-2xl shadow-blue-600/40 transition-all hover:-translate-y-1 flex items-center justify-center gap-3">
                                <AlertTriangle className="w-8 h-8" /> แจ้งปัญหาฉุกเฉิน
                            </Link>
                            <Link href="/track" className="px-12 py-6 w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 rounded-3xl font-black text-2xl shadow-lg transition-all hover:-translate-y-1 flex items-center justify-center gap-3">
                                <Search className="w-8 h-8 text-slate-400" /> ติดตามสถานะเคส
                            </Link>
                        </div>

                        {/* Trust Badges ขยายให้เด่น */}
                        <div className="pt-12 border-t-2 border-slate-100 w-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-slate-600 font-black text-lg md:text-xl">
                            <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100"><ShieldCheck className="w-8 h-8 text-emerald-500" /> ข้อมูลเข้ารหัสปลอดภัย 100%</div>
                            <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100"><Server className="w-8 h-8 text-blue-500" /> สอดคล้องมาตรฐาน SLA</div>
                            <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100"><Headset className="w-8 h-8 text-indigo-500" /> มีวิศวกรดูแลตลอด 24 ชม.</div>
                        </div>
                    </div>
                </section>

                {/* ─── FEATURES SECTION (บังคับให้อยู่ตรงกลางเป๊ะๆ) ─── */}
                <section className="w-full bg-[#f8fafc] py-24 lg:py-32 border-t border-slate-200 flex flex-col items-center">
                    <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center">

                        <div className="text-center w-full max-w-4xl mx-auto mb-20 flex flex-col items-center">
                            <div className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-blue-100 text-blue-700 font-bold text-base mb-6">
                                ฟีเจอร์การทำงาน
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 text-center">บริการที่ตอบโจทย์บุคลากรการแพทย์</h2>
                            <p className="text-xl md:text-2xl text-slate-500 font-medium text-center">ออกแบบเพื่อการจัดการปัญหาไอทีทางการแพทย์โดยเฉพาะ</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full mx-auto">
                            <div className="bg-white p-10 md:p-12 rounded-[2.5rem] border border-slate-200 text-center flex flex-col items-center shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform">
                                <div className="w-24 h-24 rounded-[2rem] bg-blue-50 flex items-center justify-center text-blue-600 mb-8 border border-blue-100 shadow-inner">
                                    <Lock className="w-12 h-12" />
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 mb-4">ความปลอดภัยสูงสุด</h4>
                                <p className="text-slate-500 font-medium leading-relaxed text-lg">
                                    ข้อมูลการแจ้งเหตุและรายละเอียดผู้แจ้ง ถูกเข้ารหัสและรักษาความลับอย่างเข้มงวด
                                </p>
                            </div>

                            <div className="bg-white p-10 md:p-12 rounded-[2.5rem] border border-slate-200 text-center flex flex-col items-center shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform">
                                <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mb-8 border border-indigo-100 shadow-inner">
                                    <Clock className="w-12 h-12" />
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 mb-4">รวดเร็ว ทันใจ</h4>
                                <p className="text-slate-500 font-medium leading-relaxed text-lg">
                                    ระบบคัดกรองและจัดลำดับความสำคัญ เพื่อให้ทีมวิศวกรเข้าแก้ไขได้ทันที
                                </p>
                            </div>

                            <div className="bg-white p-10 md:p-12 rounded-[2.5rem] border border-slate-200 text-center flex flex-col items-center shadow-xl shadow-slate-200/50 hover:-translate-y-2 transition-transform">
                                <div className="w-24 h-24 rounded-[2rem] bg-emerald-50 flex items-center justify-center text-emerald-600 mb-8 border border-emerald-100 shadow-inner">
                                    <HeartPulse className="w-12 h-12" />
                                </div>
                                <h4 className="text-2xl font-black text-slate-900 mb-4">เคียงข้างสถานพยาบาล</h4>
                                <p className="text-slate-500 font-medium leading-relaxed text-lg">
                                    แพลตฟอร์มถูกสร้างขึ้นเพื่ออำนวยความสะดวกให้กับบุคลากรในโรงพยาบาล
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

            </main>

            {/* ─── FOOTER ─── */}
            <footer className="w-full bg-slate-900 py-12 text-center mt-auto">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <HeartPulse className="w-8 h-8 text-blue-500" />
                    <span className="text-2xl font-black text-white tracking-tighter">HealthHelp</span>
                </div>
                <p className="text-slate-400 font-medium text-base">© {new Date().getFullYear()} Cybersecurity for Healthcare. All rights reserved.</p>
            </footer>

        </div>
    );
}