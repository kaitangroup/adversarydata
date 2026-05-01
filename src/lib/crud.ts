import { getDb } from './db';
import { z } from 'zod';

type Schema = {
  table: string;
  fields: string[];
  validate: z.AnyZodObject;
  orderBy?: string;
};

export const SCHEMAS: Record<string, Schema> = {
  cases: {
    table: 'cases',
    fields: ['title','citation','court','year','summary','category','outcome','sort_order','published'],
    orderBy: 'sort_order ASC, year DESC, id DESC',
    validate: z.object({
      title: z.string().min(1).max(200),
      citation: z.string().max(200).optional().nullable(),
      court: z.string().max(200).optional().nullable(),
      year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
      summary: z.string().max(5000).optional().nullable(),
      category: z.string().max(80).optional().nullable(),
      outcome: z.string().max(120).optional().nullable(),
      sort_order: z.coerce.number().int().default(0),
      published: z.coerce.number().int().min(0).max(1).default(1),
    }),
  },
  groups: {
    table: 'defense_groups',
    fields: ['title','blurb','schedule','price_cents','capacity','enrolled','start_date','active','sort_order'],
    orderBy: 'sort_order ASC, id ASC',
    validate: z.object({
      title: z.string().min(1).max(200),
      blurb: z.string().max(2000).optional().nullable(),
      schedule: z.string().max(200).optional().nullable(),
      price_cents: z.coerce.number().int().min(0).default(0),
      capacity: z.coerce.number().int().min(0).default(0),
      enrolled: z.coerce.number().int().min(0).default(0),
      start_date: z.string().max(40).optional().nullable(),
      active: z.coerce.number().int().min(0).max(1).default(1),
      sort_order: z.coerce.number().int().default(0),
    }),
  },
  videos: {
    table: 'videos',
    fields: ['title','youtube_id','description','thumbnail','sort_order','published'],
    orderBy: 'sort_order ASC, id DESC',
    validate: z.object({
      title: z.string().min(1).max(200),
      youtube_id: z.string().min(1).max(40),
      description: z.string().max(2000).optional().nullable(),
      thumbnail: z.string().max(500).optional().nullable(),
      sort_order: z.coerce.number().int().default(0),
      published: z.coerce.number().int().min(0).max(1).default(1),
    }),
  },
};

export function listAll(name: string) {
  const s = SCHEMAS[name];
  if (!s) throw new Error('unknown_resource');
  return getDb().prepare(`SELECT * FROM ${s.table} ORDER BY ${s.orderBy ?? 'id DESC'}`).all();
}

export function getOne(name: string, id: number) {
  const s = SCHEMAS[name];
  if (!s) throw new Error('unknown_resource');
  return getDb().prepare(`SELECT * FROM ${s.table} WHERE id = ?`).get(id);
}

export function createOne(name: string, body: unknown) {
  const s = SCHEMAS[name];
  if (!s) throw new Error('unknown_resource');
  const data = s.validate.parse(body) as Record<string, any>;
  const cols = s.fields.filter(f => data[f] !== undefined);
  const placeholders = cols.map(() => '?').join(', ');
  const stmt = getDb().prepare(`INSERT INTO ${s.table} (${cols.join(',')}) VALUES (${placeholders})`);
  const info = stmt.run(...cols.map(c => data[c] ?? null));
  return getOne(name, Number(info.lastInsertRowid));
}

export function updateOne(name: string, id: number, body: unknown) {
  const s = SCHEMAS[name];
  if (!s) throw new Error('unknown_resource');
  const data = s.validate.partial().parse(body) as Record<string, any>;
  const cols = Object.keys(data).filter(k => s.fields.includes(k));
  if (!cols.length) return getOne(name, id);
  const sets = cols.map(c => `${c} = ?`).join(', ');
  const updatedAt = (s.table === 'cases' || s.table === 'defense_groups') ? `, updated_at = datetime('now')` : '';
  getDb().prepare(`UPDATE ${s.table} SET ${sets}${updatedAt} WHERE id = ?`).run(...cols.map(c => data[c]), id);
  return getOne(name, id);
}

export function deleteOne(name: string, id: number) {
  const s = SCHEMAS[name];
  if (!s) throw new Error('unknown_resource');
  getDb().prepare(`DELETE FROM ${s.table} WHERE id = ?`).run(id);
  return { ok: true };
}
