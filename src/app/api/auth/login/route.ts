import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth';

// Rate limiting map
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();

        // Check rate limiting
        const attempts = loginAttempts.get(ip);
        if (attempts) {
            if (now < attempts.resetTime) {
                if (attempts.count >= 5) {
                    const waitTime = Math.ceil((attempts.resetTime - now) / 1000);
                    return NextResponse.json(
                        { error: `เข้าสู่ระบบผิดพลาดหลายครั้ง กรุณารอ ${waitTime} วินาที` },
                        { status: 429 }
                    );
                }
            } else {
                loginAttempts.delete(ip);
            }
        }

        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' },
                { status: 400 }
            );
        }

        const result = await login(username, password);

        if (!result.success) {
            // Update rate limiting
            const current = loginAttempts.get(ip) || { count: 0, resetTime: now + 60000 };
            current.count++;
            if (current.count === 1) {
                current.resetTime = now + 60000; // Reset after 1 minute
            }
            loginAttempts.set(ip, current);

            return NextResponse.json(
                { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
                { status: 401 }
            );
        }

        // Clear rate limiting on successful login
        loginAttempts.delete(ip);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' },
            { status: 500 }
        );
    }
}
