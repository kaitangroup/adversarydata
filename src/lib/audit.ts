import { getDb } from './db';

export function audit(opts: {
  userId?: number | null;
  action: string;
  entity?: string | null;
  entityId?: number | null;
  meta?: Record<string, unknown> | null;
  ip?: string | null;
}) {
  try {
    const db = getDb();
    db.prepare(
      `INSERT INTO audit_log (user_id, action, entity, entity_id, meta, ip)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      opts.userId ?? null,
      opts.action,
      opts.entity ?? null,
      opts.entityId ?? null,
      opts.meta ? JSON.stringify(opts.meta) : null,
      opts.ip ?? null
    );
  } catch {
    /* swallow audit errors */
  }
}
