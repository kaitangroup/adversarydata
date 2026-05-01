import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { ensureMigrated } from '@/lib/db';
import { listAll, createOne, SCHEMAS } from '@/lib/crud';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const ALLOWED = new Set(Object.keys(SCHEMAS));

type Ctx = { params: Promise<{ resource: string }> };

export async function GET(_: Request, ctx: Ctx) {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const { resource } = await ctx.params;
  if (!ALLOWED.has(resource)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(listAll(resource));
}

export async function POST(req: Request, ctx: Ctx) {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const { resource } = await ctx.params;
  if (!ALLOWED.has(resource)) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  try {
    const body = await req.json();
    const row = createOne(resource, body) as any;
    audit({ userId: a.session.userId!, action: `${resource}.create`, entity: resource, entityId: row?.id });
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: 'invalid', message: e?.message }, { status: 400 });
  }
}
