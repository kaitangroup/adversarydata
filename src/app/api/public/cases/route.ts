import { NextResponse } from 'next/server';
import { getDb, ensureMigrated } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureMigrated();
  const rows = getDb()
    .prepare(
      `SELECT id, title, citation, court, year, summary, category, outcome, sort_order
       FROM cases WHERE published = 1
       ORDER BY sort_order ASC, year DESC, id DESC`
    )
    .all();
  return NextResponse.json(rows);
}
