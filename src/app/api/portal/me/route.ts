import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole, hashPassword, verifyPassword } from '@/lib/auth';
import { getDb, ensureMigrated } from '@/lib/db';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureMigrated();
  const a = await requireRole('client');
  if (!a.ok) return a.response;
  const u = getDb().prepare('SELECT id, email, name, role, created_at, last_login_at FROM users WHERE id = ?').get(a.session.userId!);
  return NextResponse.json(u);
}

const Patch = z.object({
  name: z.string().min(1).max(120).optional(),
  current_password: z.string().min(1).optional(),
  new_password: z.string().min(10).max(200).optional(),
});

export async function PATCH(req: Request) {
  ensureMigrated();
  const a = await requireRole('client');
  if (!a.ok) return a.response;
  const body = await req.json().catch(() => null);
  const parsed = Patch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const db = getDb();
  if (parsed.data.new_password) {
    if (!parsed.data.current_password) return NextResponse.json({ error: 'current_password_required' }, { status: 400 });
    const u = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(a.session.userId!) as any;
    if (!u || !verifyPassword(parsed.data.current_password, u.password_hash)) return NextResponse.json({ error: 'wrong_password' }, { status: 400 });
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(parsed.data.new_password), a.session.userId!);
  }
  if (parsed.data.name) {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(parsed.data.name, a.session.userId!);
  }
  audit({ userId: a.session.userId!, action: 'portal.profile.update' });
  return NextResponse.json({ ok: true });
}
