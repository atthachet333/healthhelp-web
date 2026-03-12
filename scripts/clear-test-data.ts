import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Clearing test data: Cases...');
    const deletedCases = await prisma.case.deleteMany({});
    console.log(`Successfully deleted ${deletedCases.count} cases.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
