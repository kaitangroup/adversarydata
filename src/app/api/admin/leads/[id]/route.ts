import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { getDb, ensureMigrated } from '@/lib/db';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const Patch = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'closed']).optional(),
  notes: z.string().max(5000).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  const json = await req.json().catch(() => null);
  const parsed = Patch.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const fields: string[] = [];
  const vals: any[] = [];
  if (parsed.data.status !== undefined) { fields.push('status = ?'); vals.push(parsed.data.status); }
  if (parsed.data.notes  !== undefined) { fields.push('notes = ?');  vals.push(parsed.data.notes); }
  if (!fields.length) return NextResponse.json({ ok: true });
  vals.push(id);
  getDb().prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  audit({ userId: a.session.userId!, action: 'lead.update', entity: 'leads', entityId: id, meta: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  getDb().prepare('DELETE FROM leads WHERE id = ?').run(id);
  audit({ userId: a.session.userId!, action: 'lead.delete', entity: 'leads', entityId: id });
  return NextResponse.json({ ok: true });
}
