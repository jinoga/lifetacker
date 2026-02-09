import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'lifetacker-dev-secret-key'
);

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

export interface AuthPayload {
    username: string;
    exp: number;
}

export async function createToken(username: string): Promise<string> {
    const token = await new SignJWT({ username })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(SECRET_KEY);
    return token;
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload as unknown as AuthPayload;
    } catch {
        return null;
    }
}

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (username !== ADMIN_USERNAME) {
        return { success: false, error: 'Invalid credentials' };
    }

    const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!isValid) {
        return { success: false, error: 'Invalid credentials' };
    }

    const token = await createToken(username);
    const cookieStore = await cookies();

    cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });

    return { success: true };
}

export async function logout(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
}

export async function getSession(): Promise<AuthPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return null;

    return verifyToken(token);
}

export async function isAuthenticated(): Promise<boolean> {
    const session = await getSession();
    return session !== null;
}
