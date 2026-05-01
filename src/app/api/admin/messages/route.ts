import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { getDb, ensureMigrated } from '@/lib/db';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const Body = z.object({
  user_id: z.coerce.number().int().positive(),
  body: z.string().min(1).max(5000),
});

export async function POST(req: Request) {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const info = getDb()
    .prepare('INSERT INTO messages (user_id, from_admin, body) VALUES (?, 1, ?)')
    .run(parsed.data.user_id, parsed.data.body);
  audit({ userId: a.session.userId!, action: 'message.admin_send', entity: 'messages', entityId: Number(info.lastInsertRowid), meta: { to_user: parsed.data.user_id } });
  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
