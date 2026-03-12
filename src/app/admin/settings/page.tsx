import { getAllCategories, getSLARules } from "@/app/actions/admin-actions";
import { SettingsClient } from "@/components/admin/SettingsClient";

export default async function SettingsPage() {
    const [categories, slaRules] = await Promise.all([
        getAllCategories(),
        getSLARules(),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <SettingsClient categories={categories} slaRules={slaRules as any} />;
}
