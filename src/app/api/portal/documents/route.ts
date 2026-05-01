import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb, ensureMigrated } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureMigrated();
  const a = await requireRole('client');
  if (!a.ok) return a.response;
  const rows = getDb()
    .prepare(`SELECT id, original, mime, size_bytes, created_at
              FROM documents WHERE user_id = ? AND visible = 1 ORDER BY id DESC`)
    .all(a.session.userId!);
  return NextResponse.json(rows);
}
