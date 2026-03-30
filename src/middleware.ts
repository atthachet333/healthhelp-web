import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const url = request.nextUrl.pathname;

    // ตรวจสอบเฉพาะหน้าเว็บที่ขึ้นต้นด้วย /admin
    if (url.startsWith('/admin')) {
        // ถ้ากำลังจะเข้าหน้า login ให้ปล่อยผ่าน
        if (url === '/admin/login') return NextResponse.next();

        // เช็กว่ามีบัตรผ่าน (Cookie) ไหม
        const isLoggedIn = request.cookies.get('admin_auth')?.value === 'true';

        // ถ้าไม่มีบัตรผ่าน ให้เตะกลับไปหน้า Login
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
