import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Fixing old internal notes...");

    // Set all previous admin comments to internal (isPublic = false) 
    // unless they specifically contain words indicating they are public replies.
    // For safety and to match the user's intent to hide the current leaked notes,
    // we will just set all existing admin comments to isPublic = false.
    const result = await prisma.caseUpdate.updateMany({
        where: {
            userId: { not: null },
            actionType: 'COMMENT',
            isPublic: true
        },
        data: {
            isPublic: false
        }
    });

    console.log(`Updated ${result.count} admin notes to be internal (isPublic = false).`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
