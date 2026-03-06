import { getCases, getStaffUsers } from "@/app/actions/admin-actions";
import { CaseListClient } from "@/components/admin/CaseListClient";

export default async function CasesPage(props: {
    searchParams: Promise<Record<string, string | undefined>>;
}) {
    const searchParams = await props.searchParams;
    const page = parseInt(searchParams.page || "1");
    const status = searchParams.status || "ALL";
    const priority = searchParams.priority || "ALL";
    const search = searchParams.search || "";

    const [casesResult, staffUsers] = await Promise.all([
        getCases({ status, priority, search, page, limit: 20 }),
        getStaffUsers(),
    ]);

    return (
        <CaseListClient
            cases={casesResult.data}
            total={casesResult.total}
            page={casesResult.page}
            totalPages={casesResult.totalPages}
            currentStatus={status}
            currentPriority={priority}
            currentSearch={search}
            staffUsers={staffUsers}
        />
    );
}
