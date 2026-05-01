import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getSession();
  if (session.userId) audit({ userId: session.userId, action: 'auth.logout' });
  session.destroy();
  return NextResponse.json({ ok: true });
}
