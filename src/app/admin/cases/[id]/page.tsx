import { getCaseById, getStaffUsers } from "@/app/actions/admin-actions";
import { CaseDetailClient } from "@/components/admin/CaseDetailClient";
import { notFound } from "next/navigation";

export default async function CaseDetailPage(props: {
    params: Promise<{ id: string }>;
}) {
    const params = await props.params;
    const [caseData, staffUsers] = await Promise.all([
        getCaseById(params.id),
        getStaffUsers(),
    ]);

    if (!caseData) {
        notFound();
    }

    return <CaseDetailClient caseData={caseData as any} staffUsers={staffUsers} />;
}
