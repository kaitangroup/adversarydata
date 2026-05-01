import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb, ensureMigrated } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureMigrated();
  const a = await requireRole('admin');
  if (!a.ok) return a.response;
  const rows = getDb()
    .prepare(
      `SELECT a.id, a.action, a.entity, a.entity_id, a.meta, a.ip, a.created_at, u.email
       FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.id DESC LIMIT 200`
    )
    .all();
  return NextResponse.json(rows);
}
