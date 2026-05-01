import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb, ensureMigrated } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const rows = getDb()
    .prepare('SELECT * FROM leads ORDER BY id DESC LIMIT 500')
    .all();
  return NextResponse.json(rows);
}
