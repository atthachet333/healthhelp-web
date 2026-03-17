import Link from "next/link";
import { CreateCaseForm } from "@/components/public/CreateCaseForm";
import { getCategories } from "@/app/actions/case-actions";
import {
  HeartPulse,
  Search,
  Clock,
  MessageCircle,
  User,
  Bell,
} from "lucide-react";

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <div className="theme-light flex flex-col min-h-screen w-full relative">
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50/30" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-slate-200/60 shadow-sm w-full">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-600/20">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">HealthHelp</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-5">
            <Link href="/" className="px-4 py-2 text-base font-semibold text-blue-700 bg-blue-50 rounded-lg transition-colors">
              หน้าแรก
            </Link>
            <Link href="/track" className="px-4 py-2 text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors">
              ติดตามเคส
            </Link>
            <Link href="/contact" className="px-4 py-2 text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors">
              ติดต่อเรา
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/track"
              className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200/80 rounded-xl text-base font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Search className="w-4 h-4" />
              ติดตาม
            </Link>
            <Link
              href="/admin/login"
              className="flex items-center gap-2 px-4 py-2 text-base font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline">เจ้าหน้าที่</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center w-full relative z-10">
        {/* Hero */}
        <div className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 relative overflow-hidden">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 md:py-10 relative">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-snug">
                แจ้งปัญหา IT และเรื่องอื่นๆ
              </h2>
              <p className="text-blue-100/90 text-sm sm:text-base mx-auto mb-6 leading-relaxed">
                กรอกแบบฟอร์มด้านล่าง ทีมเจ้าหน้าที่จะดำเนินการติดต่อกลับโดยเร็ว
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { icon: Clock, text: "ตอบกลับภายใน 24 ชั่วโมง" },
                  { icon: Search, text: "ติดตามสถานะได้ตลอด 24 ชม." },
                  { icon: Bell, text: "แจ้งเตือนทุกความคืบหน้า" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white font-semibold text-sm sm:text-base">
                    <f.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    {f.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 -mt-4 pb-12 relative z-20">
          <div className="bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-200/80 px-5 sm:px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">แบบฟอร์มแจ้งปัญหา</h3>
                  <p className="text-slate-500 text-xs">กรุณากรอกข้อมูลให้ครบถ้วน เพื่อให้เจ้าหน้าที่ดำเนินการได้รวดเร็ว</p>
                </div>
              </div>
            </div>
            {/* Form Content */}
            <div className="p-5 sm:p-6">
              <CreateCaseForm categories={categories} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-900 text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <HeartPulse className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-slate-300">HealthHelp</span>
            </div>
            <p className="text-[11px] text-slate-500">© 2026 HealthHelp - ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร</p>
            <Link href="/admin/login" className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">
              เจ้าหน้าที่ →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
