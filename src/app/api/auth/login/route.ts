import { NextResponse } from 'next/server';
import { z } from 'zod';
import { findUserByEmail, verifyPassword } from '@/lib/auth';
import { getDb, ensureMigrated } from '@/lib/db';
import { getSession } from '@/lib/session';
import { audit } from '@/lib/audit';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  ensureMigrated();
  const ip = clientIp(req);
  const rl = rateLimit({ key: `login:${ip}`, max: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const user = findUserByEmail(parsed.data.email);
  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    audit({ action: 'auth.fail', meta: { email: parsed.data.email }, ip });
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.role = user.role;
  session.email = user.email;
  session.name = user.name;
  await session.save();

  getDb().prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`).run(user.id);
  audit({ userId: user.id, action: 'auth.login', ip });
  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
