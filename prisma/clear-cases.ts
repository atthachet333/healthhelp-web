import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🧹 Clearing all cases and related data...");

    // Only delete case-related data, keeping Users, Categories, and SLAs intact
    await prisma.auditLog.deleteMany();
    await prisma.cSATRating.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.caseUpdate.deleteMany();
    await prisma.$executeRawUnsafe('DELETE FROM "cases"');
    await prisma.reporter.deleteMany();

    console.log("✅ All cases have been wiped. You can now start fresh without affecting Admin emails!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
