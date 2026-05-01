import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb, ensureMigrated } from '@/lib/db';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as any[];
  const out: Record<string,string> = {};
  for (const r of rows) out[r.key] = r.value;
  return NextResponse.json(out);
}

export async function PUT(req: Request) {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const stmt = getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const tx = getDb().transaction((entries: [string,string][]) => {
    for (const [k, v] of entries) stmt.run(String(k), String(v ?? ''));
  });
  tx(Object.entries(body));
  audit({ userId: a.session.userId!, action: 'settings.update', meta: { keys: Object.keys(body) } });
  return NextResponse.json({ ok: true });
}
