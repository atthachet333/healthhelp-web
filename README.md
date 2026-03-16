# HealthHelp - ระบบแจ้งปัญหา IT และ Helpdesk สำหรับองค์กร

HealthHelp คือระบบแจ้งปัญหา IT และ Helpdesk สำหรับองค์กร ที่ช่วยให้ผู้ใช้งานสามารถส่งคำขอ แจ้งเหตุ ติดตามสถานะเคส และสื่อสารกับเจ้าหน้าที่ได้จากหน้าเว็บเดียว พร้อมระบบหลังบ้านสำหรับบริหารจัดการ Ticket แบบครบวงจร

## Dashboard Mockup ล่าสุด

เปิดดูไฟล์ mockup ได้ทันทีจากลิงก์นี้:

- [mockup/TicketDashboardMockup.tsx](./mockup/TicketDashboardMockup.tsx)

ไฟล์นี้เป็น mockup หน้า Dashboard สำหรับระบบจัดการ Ticket ที่ออกแบบจากโทน UI ของระบบปัจจุบัน เพื่อใช้ดูแนวทางหน้าตาและนำไปต่อยอดได้ทันที

## ✨ ฟีเจอร์เด่น (Key Features)

- ระบบแจ้งปัญหา IT และ Helpdesk แบบครบวงจร สำหรับการใช้งานทั้งหน้าบ้านและหลังบ้าน
- ผู้ใช้งานสามารถสร้างเคสใหม่ ติดตามสถานะย้อนหลังด้วยเลขติดตามหรือเบอร์โทร และแนบไฟล์หลักฐานได้
- เจ้าหน้าที่สามารถจัดการเคส เปลี่ยนสถานะ มอบหมายผู้รับผิดชอบ ตอบกลับผู้ใช้งาน และติดตาม SLA ได้จากระบบหลังบ้าน
- มีระบบการแจ้งเตือนผ่าน LINE Messaging API แบบเรียลไทม์ ครอบคลุมทั้งฝั่งหน้าบ้าน (ผู้ใช้งาน - รับการแจ้งเตือนสถานะเคส, เลขติดตาม) และฝั่งหลังบ้าน (แอดมิน - รับแจ้งเตือนทันทีเมื่อมีเคสใหม่เข้าสู่ระบบ)
- เชื่อมต่อ Google Sheets API เพื่อใช้เก็บข้อมูลเคสและไฟล์แนบเป็นหลักฐานเพิ่มเติม

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
| Frontend + Backend | Next.js (App Router) |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Validation | Zod |
| Notification | LINE Messaging API |
| External Integration | Google Sheets API |
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

### 2. การตั้งค่าเบื้องต้น (Getting Started)

สร้างฐานข้อมูล PostgreSQL:
```sql
CREATE DATABASE healthhelp;
```

จากนั้นสร้างไฟล์ `.env` และกำหนดค่าตัวอย่างดังนี้:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/healthhelp?schema=public"

# App
AUTH_SECRET="your-app-secret"
NEXTAUTH_URL="http://localhost:3000"

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN="your-line-channel-access-token"
LINE_CHANNEL_SECRET="your-line-channel-secret"
LINE_USER_ID="your-line-user-or-group-id"

# Google Sheets API
GOOGLE_SHEETS_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID="your-google-sheet-id"
```

หมายเหตุ:
- ห้ามใส่ค่าจริงหรือรหัสลับลงใน `README.md`
- ไฟล์ `.env` และ `.env.local` ควรถูก ignore จาก Git เสมอ

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
