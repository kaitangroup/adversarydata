// Tiny in-memory sliding-window rate limiter. Fine for single-process PM2 setups.
// For multi-instance deployments swap this for a Redis-backed limiter.
type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function rateLimit(opts: { key: string; max: number; windowMs: number }) {
  const now = Date.now();
  const e = store.get(opts.key);
  if (!e || now > e.resetAt) {
    store.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.max - 1 };
  }
  if (e.count >= opts.max) return { ok: false, remaining: 0, resetAt: e.resetAt };
  e.count += 1;
  return { ok: true, remaining: opts.max - e.count };
}

export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-real-ip') ||
    (h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '') ||
    'unknown'
  );
}
