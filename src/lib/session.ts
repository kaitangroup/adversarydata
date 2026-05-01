import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export type SessionData = {
  userId?: number;
  role?: 'admin' | 'client';
  email?: string;
  name?: string;
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'dev-secret-please-replace-with-32+chars',
  cookieName: process.env.SESSION_COOKIE_NAME || 'advdata_sess',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  const c = await cookies();
  return getIronSession<SessionData>(c, sessionOptions);
}
