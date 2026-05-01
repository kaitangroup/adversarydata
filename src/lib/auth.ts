import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { getDb } from './db';
import { getSession } from './session';

export type DbUser = {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'client';
  active: number;
};

export function findUserByEmail(email: string): DbUser | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM users WHERE lower(email) = lower(?) AND active = 1')
    .get(email) as DbUser | undefined;
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 12);
}

export async function requireRole(role: 'admin' | 'client') {
  const session = await getSession();
  if (!session.userId || session.role !== role) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    };
  }
  return { ok: true as const, session };
}
