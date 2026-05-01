import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole, hashPassword } from '@/lib/auth';
import { getDb, ensureMigrated } from '@/lib/db';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const Patch = z.object({
  name: z.string().min(1).max(120).optional(),
  role: z.enum(['admin','client']).optional(),
  active: z.coerce.number().int().min(0).max(1).optional(),
  password: z.string().min(10).max(200).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  const body = await req.json().catch(() => null);
  const parsed = Patch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const fields: string[] = []; const vals: any[] = [];
  if (parsed.data.name   !== undefined) { fields.push('name = ?');   vals.push(parsed.data.name); }
  if (parsed.data.role   !== undefined) { fields.push('role = ?');   vals.push(parsed.data.role); }
  if (parsed.data.active !== undefined) { fields.push('active = ?'); vals.push(parsed.data.active); }
  if (parsed.data.password)             { fields.push('password_hash = ?'); vals.push(hashPassword(parsed.data.password)); }
  if (!fields.length) return NextResponse.json({ ok: true });
  vals.push(id);
  getDb().prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  audit({ userId: a.session.userId!, action: 'user.update', entity: 'users', entityId: id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (a.session.userId === id) return NextResponse.json({ error: 'cannot_delete_self' }, { status: 400 });
  getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
  audit({ userId: a.session.userId!, action: 'user.delete', entity: 'users', entityId: id });
  return NextResponse.json({ ok: true });
}
