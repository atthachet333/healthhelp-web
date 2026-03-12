import { UpdateCaseClient } from "@/components/public/UpdateCaseClient";

export const metadata = {
    title: "ส่งข้อมูลเพิ่มเติม | HealthHelp",
    description: "ส่งไฟล์เอกสาร, รูปภาพ, หรือหลักฐานเพิ่มเติม โดยอ้างอิงจากหมายเลขเคสของคุณ",
};

export default function UpdateCasePage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <main className="flex-1 w-full flex items-center justify-center">
                <UpdateCaseClient />
            </main>
        </div>
    );
}
