import { NextResponse } from 'next/server';
import { getDb, ensureMigrated } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  ensureMigrated();
  const rows = getDb()
    .prepare(
      `SELECT id, title, youtube_id, description, thumbnail, sort_order
       FROM videos WHERE published = 1
       ORDER BY sort_order ASC, id DESC`
    )
    .all();
  return NextResponse.json(rows);
}
