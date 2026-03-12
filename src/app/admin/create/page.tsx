import { getCategories } from "@/app/actions/case-actions";
import { CreateCaseForm } from "@/components/public/CreateCaseForm";

export default async function AdminCreateCasePage() {
    const categories = await getCategories();

    return (
        <div className="w-full overflow-hidden">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    แจ้งปัญหาใหม่
                </h2>
                <p className="text-slate-400 text-sm mt-1">กรอกแบบฟอร์มด้านล่างเพื่อสร้างเคสใหม่ในระบบ</p>
            </div>

            <div className="bg-[#111a2e] rounded-xl border border-[#1e2d4a] overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <h3 className="text-base font-bold text-white">แบบฟอร์มแจ้งปัญหา</h3>
                    <p className="text-blue-100 text-xs">กรุณากรอกข้อมูลให้ครบถ้วน เพื่อให้เจ้าหน้าที่ดำเนินการได้รวดเร็ว</p>
                </div>
                <div className="p-6 theme-light bg-white rounded-b-xl">
                    <CreateCaseForm categories={categories} />
                </div>
            </div>
        </div>
    );
}
