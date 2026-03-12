import { MasterDataClient } from "@/components/admin/MasterDataClient";

export const metadata = {
    title: "Master Data | HealthHelp",
};

export default async function MasterDataPage() {
    return <MasterDataClient />;
}
