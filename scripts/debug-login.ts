import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("--- DEBUG ADMIN LOGIN ---");
    const admin = await prisma.user.findUnique({ where: { email: 'admin@healthhelp.com' } });
    if (!admin) {
        console.log("Admin not found in DB!");
        return;
    }
    console.log(`Admin Active: ${admin.active}`);
    console.log(`Admin Hash: ${admin.passwordHash}`);

    // Test the hardcoded password123 against the DB hash
    const isValid = await compare('password123', admin.passwordHash);
    console.log(`password123 matches DB hash?: ${isValid}`);

    // Check staff
    const staff = await prisma.user.findUnique({ where: { email: 'staff@healthhelp.com' } });
    if (staff) {
        console.log(`Staff Hash: ${staff.passwordHash}`);
        const isStaffValid = await compare('password123', staff.passwordHash);
        console.log(`password123 matches staff hash?: ${isStaffValid}`);
    }
}

main().finally(() => prisma.$disconnect());
