import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole, hashPassword } from '@/lib/auth';
import { getDb, ensureMigrated } from '@/lib/db';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const NewUser = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  password: z.string().min(10).max(200),
  role: z.enum(['admin','client']).default('client'),
  active: z.coerce.number().int().min(0).max(1).default(1),
});

export async function GET() {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const rows = getDb().prepare('SELECT id, email, name, role, active, created_at, last_login_at FROM users ORDER BY id DESC').all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const body = await req.json().catch(() => null);
  const parsed = NewUser.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const d = parsed.data;
  try {
    const info = getDb().prepare(
      `INSERT INTO users (email, password_hash, name, role, active) VALUES (?, ?, ?, ?, ?)`
    ).run(d.email.toLowerCase(), hashPassword(d.password), d.name, d.role, d.active);
    audit({ userId: a.session.userId!, action: 'user.create', entity: 'users', entityId: Number(info.lastInsertRowid) });
    return NextResponse.json({ id: info.lastInsertRowid });
  } catch (e: any) {
    return NextResponse.json({ error: 'duplicate_or_invalid', message: e?.message }, { status: 400 });
  }
}
