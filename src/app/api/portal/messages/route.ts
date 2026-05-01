import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { getDb, ensureMigrated } from '@/lib/db';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureMigrated();
  const a = await requireRole('client');
  if (!a.ok) return a.response;
  const rows = getDb()
    .prepare('SELECT id, from_admin, body, read_at, created_at FROM messages WHERE user_id = ? ORDER BY id ASC')
    .all(a.session.userId!);
  // mark unread admin messages as read
  getDb().prepare(`UPDATE messages SET read_at = datetime('now')
                   WHERE user_id = ? AND from_admin = 1 AND read_at IS NULL`).run(a.session.userId!);
  return NextResponse.json(rows);
}

const Body = z.object({ body: z.string().min(1).max(5000) });

export async function POST(req: Request) {
  ensureMigrated();
  const a = await requireRole('client');
  if (!a.ok) return a.response;
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const info = getDb()
    .prepare('INSERT INTO messages (user_id, from_admin, body) VALUES (?, 0, ?)')
    .run(a.session.userId!, parsed.data.body);
  audit({ userId: a.session.userId!, action: 'message.client_send', entity: 'messages', entityId: Number(info.lastInsertRowid) });
  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
