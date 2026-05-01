import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const s = await getSession();
  if (!s.userId) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { id: s.userId, email: s.email, name: s.name, role: s.role },
  });
}
