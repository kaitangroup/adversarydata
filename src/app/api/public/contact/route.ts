import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb, ensureMigrated } from '@/lib/db';
import { audit } from '@/lib/audit';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const Body = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().or(z.literal('')),
  subject: z.string().max(200).optional().or(z.literal('')),
  message: z.string().min(1).max(5000),
  source: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  ensureMigrated();
  const ip = clientIp(req);
  const rl = rateLimit({ key: `contact:${ip}`, max: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid', details: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const ua = req.headers.get('user-agent') ?? '';

  const info = getDb()
    .prepare(
      `INSERT INTO leads (name, email, phone, subject, message, source, status, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)`
    )
    .run(d.name, d.email, d.phone || null, d.subject || null, d.message, d.source || 'site', ip, ua);

  audit({ action: 'lead.create', entity: 'leads', entityId: Number(info.lastInsertRowid), ip });
  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
