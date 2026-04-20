// ไฟล์: src/lib/permissions.ts

export const ROLES = {
    ADMIN: 'ADMIN',
    SUPERVISOR: 'SUPERVISOR',
    STAFF: 'STAFF',
    VIEWER: 'VIEWER',
};

// กำหนดสิทธิ์ตามที่คุณบรีฟมาเป๊ะๆ ครับ
export const PERMISSIONS = {
    [ROLES.ADMIN]: {
        canViewDashboard: true,
        canViewSheets: true,
        canChat: true,
        canEditCase: true,
        canManageUsers: true,     // จัดการคนได้
        canEditSettings: true,    // แก้ไขกฎ/ตั้งค่าได้
    },
    [ROLES.SUPERVISOR]: {
        canViewDashboard: true,
        canViewSheets: true,
        canChat: true,
        canEditCase: true,
        canManageUsers: false,    // ห้ามจัดการคน
        canEditSettings: false,   // ห้ามแก้กฎหลัก
    },
    [ROLES.STAFF]: {
        canViewDashboard: true,
        canViewSheets: true,      // Staff ดู Sheet ได้
        canChat: true,            // Staff พิมพ์คุยกับลูกค้าได้
        canEditCase: true,
        canManageUsers: false,
        canEditSettings: false,
    },
    [ROLES.VIEWER]: {
        canViewDashboard: true,   // Viewer ดู Dashboard ได้
        canViewSheets: false,     // ห้ามดู Sheet
        canChat: false,           // 🔴 ห้ามพิมพ์แชท (อ่านได้อย่างเดียว)
        canEditCase: false,       // 🔴 ห้ามแก้ไขเคส
        canManageUsers: false,
        canEditSettings: false,
    },
};