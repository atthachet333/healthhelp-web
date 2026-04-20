import { PERMISSIONS } from "@/lib/permissions";
import { getCaseById, getStaffUsers } from "@/app/actions/admin-actions";
import { CaseDetailClient } from "@/components/admin/CaseDetailClient";
import { notFound } from "next/navigation";

export default async function CaseDetailPage(props: {
    params: Promise<{ id: string }>;
}) {
    const params = await props.params;

    // ตรวจสอบ ID ก่อนส่งไปหาฐานข้อมูล ป้องกัน Prisma Error
    if (!params.id || params.id === "cases") {
        notFound();
    }

    const [caseData, staffUsers] = await Promise.all([
        getCaseById(params.id),
        getStaffUsers(),
    ]);

    if (!caseData) {
        notFound();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <CaseDetailClient caseData={caseData as any} staffUsers={staffUsers} />;
}