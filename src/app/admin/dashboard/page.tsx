import { getDashboardMetrics } from "@/app/actions/admin-actions";
import { DashboardClient } from "@/components/admin/DashboardClient";

export default async function DashboardPage(props: {
    searchParams: Promise<{ filter?: string, date?: string }>;
}) {
    // Await searchParams for Next.js 15 compatibility
    const searchParams = await props.searchParams;
    const filter = (searchParams.filter as "DAY" | "MONTH" | "YEAR") || "DAY";
    const date = searchParams.date;
    const metrics = await getDashboardMetrics(filter, date);

    return <DashboardClient metrics={metrics} filter={filter} refDateIso={date} />;
}
