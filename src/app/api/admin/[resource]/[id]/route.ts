import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { ensureMigrated } from '@/lib/db';
import { getOne, updateOne, deleteOne, SCHEMAS } from '@/lib/crud';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const ALLOWED = new Set(Object.keys(SCHEMAS));

type Ctx = { params: Promise<{ resource: string; id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const { resource, id } = await ctx.params;
  if (!ALLOWED.has(resource)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const row = getOne(resource, Number(id));
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, ctx: Ctx) {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const { resource, id } = await ctx.params;
  if (!ALLOWED.has(resource)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  try {
    const body = await req.json();
    const row = updateOne(resource, Number(id), body);
    audit({ userId: a.session.userId!, action: `${resource}.update`, entity: resource, entityId: Number(id) });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: 'invalid', message: e?.message }, { status: 400 });
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const { resource, id } = await ctx.params;
  if (!ALLOWED.has(resource)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  deleteOne(resource, Number(id));
  audit({ userId: a.session.userId!, action: `${resource}.delete`, entity: resource, entityId: Number(id) });
  return NextResponse.json({ ok: true });
}
