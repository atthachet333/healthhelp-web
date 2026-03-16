# HealthHelp - ระบบ Helpdesk แจ้งเหตุและติดตามปัญหา

ระบบ Helpdesk Web Application ครบวงจร สร้างด้วย Next.js 14, Prisma ORM, PostgreSQL
รองรับภาษาไทย, Dark Mode, Responsive Design

## Dashboard Mockup ล่าสุด

เปิดดูไฟล์ mockup ได้ทันทีจากลิงก์นี้:

- [ดูภาพ Mockup](./mockup/ticket-dashboard-mockup.png)
- [mockup/TicketDashboardMockup.tsx](./mockup/TicketDashboardMockup.tsx)

ไฟล์นี้เป็น mockup หน้า Dashboard สำหรับระบบจัดการ Ticket ที่ออกแบบจากโทน UI ของระบบปัจจุบัน เพื่อใช้ดูแนวทางหน้าตาและนำไปต่อยอดได้ทันที

![Dashboard Mockup](./mockup/ticket-dashboard-mockup.png)

## คู่มือการใช้งาน

เปิดอ่านเอกสารได้จากลิงก์ด้านล่าง:

- [สารบัญคู่มือ](./docs/README.md)
- [คู่มือหน้าบ้าน](./docs/MANUAL_FRONT.md)
- [คู่มือหลังบ้าน](./docs/MANUAL_BACKOFFICE.md)

สรุปการใช้งานแบบเร็ว:
- `หน้าบ้าน`: ใช้สำหรับแจ้งปัญหา ติดตามเคส ส่งข้อมูลเพิ่มเติม และให้คะแนนความพึงพอใจ
- `หลังบ้าน`: ใช้สำหรับจัดการเคส มอบหมายงาน ตอบกลับผู้แจ้ง จัดการข้อมูลหลัก และดูแดชบอร์ด

## 🚀 Features

### ฝั่งผู้แจ้ง (Public)
- ✅ แบบฟอร์มแจ้งปัญหา
- ✅ ระบบติดตามสถานะด้วย Tracking Code
- ✅ ค้นหาเคสย้อนหลังด้วยเบอร์โทร
- ✅ ให้คะแนน CSAT เมื่อเคสแก้ไขแล้ว
- ✅ Auto-link ผู้แจ้งรายเดิม (ตาม Phone/Email/Line ID)

### ฝั่งเจ้าหน้าที่ (Admin Portal)
- ✅ Dashboard แสดง KPIs, กราฟ, ประสิทธิภาพเจ้าหน้าที่
- ✅ จัดการเคส (ค้นหา, กรอง, เปลี่ยนสถานะ, มอบหมาย)
- ✅ Timeline / Activity Log ของแต่ละเคส
- ✅ Role-based Access (Admin, Supervisor, Staff, Viewer)
- ✅ จัดการหมวดหมู่ปัญหา
- ✅ ตั้งค่า SLA Rules
- ✅ ระบบ Audit Log

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + Backend | Next.js 14 (App Router) |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Validation | Zod |
| Auth | Custom (bcryptjs + localStorage) |

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL (ติดตั้งในเครื่อง หรือใช้ Docker/Cloud)
- npm

## ⚡ Quick Start

### 1. Clone & Install

```bash
cd healthhelp
npm install
```

### 2. ตั้งค่า Database

สร้างฐานข้อมูล PostgreSQL:
```sql
CREATE DATABASE healthhelp;
```

แก้ไขไฟล์ `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/healthhelp?schema=public"
```

### 3. สร้างตาราง & Seed Data

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. รัน Dev Server

```bash
npm run dev
```

เปิด http://localhost:3000

## 🔐 บัญชีทดสอบ (Demo)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@healthhelp.com | admin123 |
| Supervisor | supervisor@healthhelp.com | staff123 |
| Staff | staff1@healthhelp.com | staff123 |
| Staff | staff2@healthhelp.com | staff123 |
| Viewer | viewer@healthhelp.com | staff123 |

## 📁 Project Structure

```
healthhelp/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts             # Demo data
├── src/
│   ├── app/
│   │   ├── actions/        # Server Actions
│   │   │   ├── case-actions.ts    # Public actions
│   │   │   └── admin-actions.ts   # Admin actions
│   │   ├── admin/          # Admin portal pages
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── cases/
│   │   │   ├── settings/
│   │   │   └── users/
│   │   ├── track/          # Public track page
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page (create case)
│   │   └── globals.css     # Design system
│   ├── components/
│   │   ├── admin/          # Admin UI components
│   │   └── public/         # Public UI components
│   └── lib/
│       ├── prisma.ts       # Prisma client
│       ├── utils.ts        # Utilities
│       └── validations.ts  # Zod schemas
├── .env.example
├── package.json
└── README.md
```

## 🌐 Deploy

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```
ตั้งค่า Environment Variables ใน Vercel Dashboard

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 License

MIT
