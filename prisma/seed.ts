import { PrismaClient, Role, Priority, CaseStatus, Channel, ActionType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Clear existing data
    await prisma.auditLog.deleteMany();
    await prisma.cSATRating.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.caseUpdate.deleteMany();
    await prisma.$executeRawUnsafe('DELETE FROM "cases"');
    await prisma.sLARule.deleteMany();
    await prisma.category.deleteMany();
    await prisma.reporter.deleteMany();
    // Create Users
    const defaultPassword = await hash("password123", 10);

    const admin = await prisma.user.upsert({
        where: { email: "admin@healthhelp.com" },
        update: { passwordHash: defaultPassword, role: Role.ADMIN },
        create: {
            email: "admin@healthhelp.com",
            passwordHash: defaultPassword,
            fullName: "ผู้ดูแลระบบ (Admin)",
            role: Role.ADMIN,
        },
    });

    const supervisor = await prisma.user.upsert({
        where: { email: "supervisor@healthhelp.com" },
        update: { passwordHash: defaultPassword, role: Role.SUPERVISOR },
        create: {
            email: "supervisor@healthhelp.com",
            passwordHash: defaultPassword,
            fullName: "หัวหน้างาน (Supervisor)",
            role: Role.SUPERVISOR,
        },
    });

    const staff1 = await prisma.user.upsert({
        where: { email: "staff@healthhelp.com" },
        update: { passwordHash: defaultPassword, role: Role.STAFF },
        create: {
            email: "staff@healthhelp.com",
            passwordHash: defaultPassword,
            fullName: "เจ้าหน้าที่ (Staff)",
            role: Role.STAFF,
        },
    });

    const staff2 = await prisma.user.upsert({
        where: { email: "staff2@healthhelp.com" },
        update: { passwordHash: defaultPassword, role: Role.STAFF },
        create: {
            email: "staff2@healthhelp.com",
            passwordHash: defaultPassword,
            fullName: "เจ้าหน้าที่ 2 (Staff 2)",
            role: Role.STAFF,
        },
    });

    await prisma.user.upsert({
        where: { email: "viewer@healthhelp.com" },
        update: { passwordHash: defaultPassword, role: Role.VIEWER },
        create: {
            email: "viewer@healthhelp.com",
            passwordHash: defaultPassword,
            fullName: "ผู้ชม (Viewer)",
            role: Role.VIEWER,
        },
    });

    console.log("✅ Users created");

    // Create Categories
    const categories = await Promise.all([
        prisma.category.create({ data: { name: "ปัญหาทั่วไป", defaultPriority: Priority.LOW } }),
        prisma.category.create({ data: { name: "ปัญหาด้านสุขภาพ", defaultPriority: Priority.HIGH } }),
        prisma.category.create({ data: { name: "สอบถามข้อมูล", defaultPriority: Priority.LOW } }),
        prisma.category.create({ data: { name: "ร้องเรียน", defaultPriority: Priority.HIGH } }),
        prisma.category.create({ data: { name: "ขอคำปรึกษา", defaultPriority: Priority.MEDIUM } }),
        prisma.category.create({ data: { name: "แจ้งเหตุฉุกเฉิน", defaultPriority: Priority.CRITICAL } }),
    ]);

    console.log("✅ Categories created");

    // Create SLA Rules
    await Promise.all([
        prisma.sLARule.create({ data: { priority: Priority.LOW, resolveWithinHours: 72, notifyBeforeHours: 8 } }),
        prisma.sLARule.create({ data: { priority: Priority.MEDIUM, resolveWithinHours: 48, notifyBeforeHours: 4 } }),
        prisma.sLARule.create({ data: { priority: Priority.HIGH, resolveWithinHours: 24, notifyBeforeHours: 2 } }),
        prisma.sLARule.create({ data: { priority: Priority.CRITICAL, resolveWithinHours: 4, notifyBeforeHours: 1 } }),
    ]);

    console.log("✅ SLA Rules created");

    // Create Reporters
    const reporters = await Promise.all([
        prisma.reporter.create({
            data: { phone: "0812345678", email: "somchai@email.com", lineId: "somchai_line", fullName: "สมชาย ลูกค้า", address: "123 ถ.สุขุมวิท กรุงเทพฯ" },
        }),
        prisma.reporter.create({
            data: { phone: "0898765432", email: "somsri@email.com", fullName: "สมศรี ผู้แจ้ง", address: "456 ถ.พระราม9 กรุงเทพฯ" },
        }),
        prisma.reporter.create({
            data: { phone: "0923456789", lineId: "wichai_user", fullName: "วิชัย ใจดี" },
        }),
        prisma.reporter.create({
            data: { phone: "0634567890", email: "nunta@email.com", lineId: "nunta99", fullName: "นันทา รักษ์ดี", address: "789 ถ.เพชรบุรี กรุงเทพฯ" },
        }),
        prisma.reporter.create({
            data: { phone: "0845678901", email: "prasit@email.com", fullName: "ประสิทธิ์ แก้วมณี" },
        }),
    ]);

    console.log("✅ Reporters created");

    // Helper for case numbers
    let caseCounter = 1;
    function nextCaseNo() {
        return `HD-2026-${String(caseCounter++).padStart(6, "0")}`;
    }
    function randomCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }

    // Create Cases with various statuses
    const casesData = [
        {
            caseNo: nextCaseNo(), reporterId: reporters[0].id, categoryId: categories[1].id, assigneeId: staff1.id,
            channel: Channel.WEB, problemSummary: "ปวดหัวเรื้อรัง ต้องการคำปรึกษา", description: "มีอาการปวดหัวมานานกว่า 2 สัปดาห์ ทานยาแก้ปวดแล้วไม่หาย ต้องการพบแพทย์เฉพาะทาง",
            priority: Priority.HIGH, status: CaseStatus.IN_PROGRESS, trackingCode: "FRRKQH6J",
            slaDueAt: new Date(Date.now() + 12 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
            caseNo: nextCaseNo(), reporterId: reporters[1].id, categoryId: categories[0].id, assigneeId: staff2.id,
            channel: Channel.LINE, problemSummary: "ระบบนัดหมาย Online ใช้งานไม่ได้", description: "พยายามจองนัดหมายผ่านระบบออนไลน์แต่ระบบค้าง ไม่สามารถเลือกวันที่ได้",
            priority: Priority.MEDIUM, status: CaseStatus.OPEN, trackingCode: "ABC12345",
            slaDueAt: new Date(Date.now() + 36 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
            caseNo: nextCaseNo(), reporterId: reporters[2].id, categoryId: categories[5].id, assigneeId: staff1.id,
            channel: Channel.WEB, problemSummary: "แจ้งเหตุฉุกเฉิน - อุบัติเหตุทางถนน", description: "เกิดอุบัติเหตุรถชนบริเวณแยกอโศก มีผู้บาดเจ็บ 3 คน ต้องการรถพยาบาล",
            priority: Priority.CRITICAL, status: CaseStatus.RESOLVED, trackingCode: "XYZ98765",
            slaDueAt: new Date(Date.now() - 1 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            resolvedAt: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000),
        },
        {
            caseNo: nextCaseNo(), reporterId: reporters[3].id, categoryId: categories[2].id,
            channel: Channel.WEB, problemSummary: "สอบถามเรื่องวัคซีน COVID-19 เข็มกระตุ้น", description: "ต้องการทราบข้อมูลการฉีดวัคซีนเข็มกระตุ้น มีสถานที่ฉีดฟรีหรือไม่",
            priority: Priority.LOW, status: CaseStatus.OPEN, trackingCode: "TEST8888",
            slaDueAt: new Date(Date.now() + 60 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
        {
            caseNo: nextCaseNo(), reporterId: reporters[0].id, categoryId: categories[3].id, assigneeId: supervisor.id,
            channel: Channel.LINE, problemSummary: "ร้องเรียนการให้บริการ ER", description: "รอพบแพทย์ ER นานเกิน 3 ชั่วโมง ไม่มีเจ้าหน้าที่ดูแล อยากร้องเรียน",
            priority: Priority.HIGH, status: CaseStatus.WAITING_INFO, trackingCode: "RQRQRQRQ",
            slaDueAt: new Date(Date.now() + 6 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
            caseNo: nextCaseNo(), reporterId: reporters[4].id, categoryId: categories[4].id, assigneeId: staff2.id,
            channel: Channel.WEB, problemSummary: "ขอคำปรึกษาเรื่องการดูแลผู้สูงอายุ", description: "มีผู้สูงอายุในครอบครัวอายุ 80 ปี ต้องการคำแนะนำเรื่องโภชนาการและการออกกำลังกาย",
            priority: Priority.MEDIUM, status: CaseStatus.CLOSED, trackingCode: "AAAA1111",
            slaDueAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), closedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
        {
            caseNo: nextCaseNo(), reporterId: reporters[1].id, categoryId: categories[1].id,
            channel: Channel.WEB, problemSummary: "อาการแพ้อาหารรุนแรง", description: "ทานอาหารทะเลแล้วมีอาการบวมตามตัว หายใจลำบาก ต้องการคำแนะนำด่วน",
            priority: Priority.CRITICAL, status: CaseStatus.OPEN, trackingCode: randomCode(),
            slaDueAt: new Date(Date.now() + 2 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
        {
            caseNo: nextCaseNo(), reporterId: reporters[3].id, categoryId: categories[0].id, assigneeId: staff1.id,
            channel: Channel.LINE, problemSummary: "ขอประวัติการรักษาย้อนหลัง", description: "ต้องการเอกสารสรุปประวัติการรักษาย้อนหลัง 1 ปี เพื่อส่งประกัน",
            priority: Priority.LOW, status: CaseStatus.IN_PROGRESS, trackingCode: randomCode(),
            slaDueAt: new Date(Date.now() + 48 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
    ];

    const cases = [];
    for (const cd of casesData) {
        const c = await prisma.case.create({ data: cd });
        cases.push(c);
    }

    console.log("✅ Cases created");

    // Create Case Updates (Timeline entries)
    const updatesData = [
        // Case 0: IN_PROGRESS
        { caseId: cases[0].id, userId: null, actionType: ActionType.SYSTEM, note: "เคสถูกสร้างจากเว็บไซต์", createdAt: cases[0].createdAt },
        { caseId: cases[0].id, userId: staff1.id, actionType: ActionType.ASSIGN, newValue: staff1.fullName, note: "รับเคสแล้ว จะติดต่อกลับ", createdAt: new Date(cases[0].createdAt.getTime() + 2 * 60 * 60 * 1000) },
        { caseId: cases[0].id, userId: staff1.id, actionType: ActionType.STATUS_CHANGE, oldValue: "OPEN", newValue: "IN_PROGRESS", note: "กำลังประสานงานกับแพทย์เฉพาะทาง", createdAt: new Date(cases[0].createdAt.getTime() + 4 * 60 * 60 * 1000) },
        // Case 2: RESOLVED
        { caseId: cases[2].id, userId: null, actionType: ActionType.SYSTEM, note: "เคสถูกสร้างจากเว็บไซต์", createdAt: cases[2].createdAt },
        { caseId: cases[2].id, userId: staff1.id, actionType: ActionType.ASSIGN, newValue: staff1.fullName, note: "รับเคสฉุกเฉิน", createdAt: new Date(cases[2].createdAt.getTime() + 10 * 60 * 1000) },
        { caseId: cases[2].id, userId: staff1.id, actionType: ActionType.STATUS_CHANGE, oldValue: "OPEN", newValue: "IN_PROGRESS", note: "ส่งรถพยาบาลออกไปแล้ว", createdAt: new Date(cases[2].createdAt.getTime() + 15 * 60 * 1000) },
        { caseId: cases[2].id, userId: staff1.id, actionType: ActionType.STATUS_CHANGE, oldValue: "IN_PROGRESS", newValue: "RESOLVED", note: "ผู้บาดเจ็บถูกนำส่งโรงพยาบาลเรียบร้อยแล้ว", createdAt: new Date(cases[2].createdAt.getTime() + 12 * 60 * 60 * 1000) },
        // Case 5: CLOSED
        { caseId: cases[5].id, userId: null, actionType: ActionType.SYSTEM, note: "เคสถูกสร้างจากเว็บไซต์", createdAt: cases[5].createdAt },
        { caseId: cases[5].id, userId: staff2.id, actionType: ActionType.COMMENT, note: "ส่งเอกสารคำแนะนำทางอีเมลแล้ว", createdAt: new Date(cases[5].createdAt.getTime() + 24 * 60 * 60 * 1000) },
        { caseId: cases[5].id, userId: staff2.id, actionType: ActionType.STATUS_CHANGE, oldValue: "IN_PROGRESS", newValue: "RESOLVED", note: "ส่งข้อมูลครบถ้วนแล้ว", createdAt: new Date(cases[5].createdAt.getTime() + 48 * 60 * 60 * 1000) },
        { caseId: cases[5].id, userId: admin.id, actionType: ActionType.STATUS_CHANGE, oldValue: "RESOLVED", newValue: "CLOSED", note: "ปิดเคส - ผู้แจ้งพอใจกับการบริการ", createdAt: new Date(cases[5].createdAt.getTime() + 72 * 60 * 60 * 1000) },
    ];

    for (const ud of updatesData) {
        await prisma.caseUpdate.create({ data: ud });
    }

    console.log("✅ Case Updates created");

    // Create CSAT for closed/resolved cases
    await prisma.cSATRating.create({
        data: { caseId: cases[2].id, score: 5, comment: "ตอบสนองรวดเร็วมาก ขอบคุณครับ" },
    });
    await prisma.cSATRating.create({
        data: { caseId: cases[5].id, score: 4, comment: "ข้อมูลครบถ้วน แต่รอนานไปหน่อย" },
    });

    console.log("✅ CSAT Ratings created");

    // Create Audit Logs
    await prisma.auditLog.create({
        data: { userId: admin.id, action: "SEED_DATA", resource: "SYSTEM", resourceId: "seed", metadata: { message: "Initial seed data created" } },
    });

    console.log("✅ Audit Log created");
    console.log("\n🎉 Seeding completed!");
    console.log("\n📋 Login credentials (Password is always 'password123'):");
    console.log("  Admin:      admin@healthhelp.com");
    console.log("  Supervisor: supervisor@healthhelp.com");
    console.log("  Staff 1:    staff@healthhelp.com");
    console.log("  Staff 2:    staff2@healthhelp.com");
    console.log("  Viewer:     viewer@healthhelp.com");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
