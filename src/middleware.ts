import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const tokenData = request.cookies.get('token') as any;
    const token = tokenData?.value || tokenData;

    if (request.nextUrl.pathname.startsWith('/admin/login')) {
        return NextResponse.next();
    }

    if (
        request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname.startsWith('/dashboard')
    ) {
        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        // 🟢 เอาตัวเตะออกจาก Dashboard ออกไปแล้ว เพราะตอนนี้ทุกคนดูหน้าสถิติได้
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/dashboard/:path*',
    ],
};