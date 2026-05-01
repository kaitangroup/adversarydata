import { NextResponse } from 'next/server';
import { getDb, ensureMigrated } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureMigrated();
  const rows = getDb()
    .prepare(
      `SELECT id, title, blurb, schedule, price_cents, capacity, enrolled, start_date, sort_order
       FROM defense_groups WHERE active = 1
       ORDER BY sort_order ASC, id ASC`
    )
    .all() as any[];
  const out = rows.map(r => ({ ...r, seats_remaining: Math.max(0, (r.capacity ?? 0) - (r.enrolled ?? 0)) }));
  return NextResponse.json(out);
}
