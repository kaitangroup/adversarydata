import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb, ensureMigrated } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureMigrated();
  const auth = await requireRole('admin');
  if (!auth.ok) return auth.response;
  const db = getDb();
  const c = (sql: string) => (db.prepare(sql).get() as any).c as number;
  const summary = {
    cases:  c('SELECT COUNT(*) AS c FROM cases'),
    groups: c('SELECT COUNT(*) AS c FROM defense_groups'),
    videos: c('SELECT COUNT(*) AS c FROM videos'),
    leads:  c('SELECT COUNT(*) AS c FROM leads'),
    leads_new: c("SELECT COUNT(*) AS c FROM leads WHERE status = 'new'"),
    users:  c('SELECT COUNT(*) AS c FROM users'),
    recent_leads: db
      .prepare('SELECT id, name, email, subject, status, created_at FROM leads ORDER BY id DESC LIMIT 8')
      .all(),
  };
  return NextResponse.json(summary);
}
