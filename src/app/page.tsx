import Link from "next/link";
import { CreateCaseForm } from "@/components/public/CreateCaseForm";
import { getCategories } from "@/app/actions/case-actions";
import {
  HeartPulse,
  Search,
  Shield,
  Clock,
  MessageCircle,
} from "lucide-react";

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <div className="theme-light flex flex-col min-h-screen w-full bg-slate-50 relative">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-indigo-50 via-slate-50 to-cyan-50" />
      <div className="fixed top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float z-0" />
      <div className="fixed bottom-20 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float z-0" style={{ animationDelay: "3s" }} />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-white/20 shadow-sm w-full">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">HealthHelp</h1>
              <p className="text-xs text-slate-500 font-medium">ระบบแจ้งเหตุและติดตามปัญหา</p>
            </div>
          </div>
          <div className="flex items-center gap-4 pr-4 sm:pr-8 md:pr-12 lg:pr-16">
            <Link
              href="/track"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors"
            >
              <Search className="w-4 h-4" />
              ติดตามสถานะ
            </Link>
            <Link
              href="/admin/login"
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              เจ้าหน้าที่
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content: Centered vertically and horizontally */}
      <main className="flex-grow flex flex-col items-center justify-center w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16 md:pt-32 md:pb-24 relative z-10">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
          {/* Header text */}
          <div className="text-center mb-10 w-full max-w-3xl px-4 sm:px-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-indigo-100 shadow-sm text-indigo-600 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              ระบบรับแจ้งปัญหาออนไลน์ 24 ชั่วโมง
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-2 sm:mb-3 leading-tight px-2 sm:px-0">
              แจ้งปัญหาของคุณ
            </h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 drop-shadow-sm mb-6 sm:mb-8">
              เราพร้อมช่วยเหลือ
            </h3>
            <p className="text-sm sm:text-base md:text-xl text-slate-600 w-full max-w-3xl mx-auto mb-10 font-medium px-4 sm:px-8">
              กรอกข้อมูลด้านล่างเพื่อแจ้งปัญหา เจ้าหน้าที่จะดำเนินการติดต่อกลับ พร้อมติดตามสถานะได้ตลอดเวลา
            </p>

            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              {[
                { icon: Clock, text: "ตอบกลับภายใน 24 ชม." },
                { icon: Search, text: "ติดตามสถานะได้ตลอด" },
                { icon: MessageCircle, text: "แจ้งเตือนอัตโนมัติ" },
              ].map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white shadow-sm border border-slate-200/60 text-slate-700 text-sm font-medium"
                >
                  <f.icon className="w-4 h-4 text-blue-500" />
                  {f.text}
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-4 md:mt-8 w-[95%] sm:w-full max-w-4xl mx-auto">
            <div className="bg-blue-100 border-b border-blue-200 px-8 sm:px-12 py-6 sm:py-8">
              <h3 className="text-xl sm:text-2xl font-bold text-black flex items-center justify-center md:justify-start gap-4">
                <MessageCircle className="w-6 h-6 text-blue-600" />
                แบบฟอร์มแจ้งปัญหา
              </h3>
              <p className="text-slate-800 text-sm mt-2 text-center md:text-left max-w-2xl font-medium">
                กรุณากรอกข้อมูลให้ครบถ้วน เพื่อให้เจ้าหน้าที่ดำเนินการได้อย่างรวดเร็ว
              </p>
            </div>
            <div className="p-8 sm:p-12 md:p-14">
              <CreateCaseForm categories={categories} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-400 py-8 px-4 text-center text-sm relative z-10">
        <p className="font-medium tracking-wide">© 2026 HealthHelp - ระบบแจ้งเหตุและติดตามปัญหา</p>
        <p className="mt-3">
          <Link href="/admin/login" className="text-indigo-400 hover:text-indigo-300 transition-colors inline-block pb-1 border-b border-indigo-400/30 hover:border-indigo-300">
            เข้าสู่ระบบเจ้าหน้าที่
          </Link>
        </p>
      </footer>
    </div>
  );
}
