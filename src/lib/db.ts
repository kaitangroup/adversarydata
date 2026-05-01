import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

let _db: Database.Database | null = null;

function resolvePath(): string {
  const p = process.env.DATABASE_PATH || path.join(process.cwd(), 'db', 'jones.sqlite');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  return p;
}

export function getDb(): Database.Database {
  if (_db) return _db;
  const dbPath = resolvePath();
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  _db = db;
  return db;
}

// Auto-migrate on first import in production (no-op if already applied).
export function ensureMigrated() {
  const db = getDb();
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  const migDir = path.join(process.cwd(), 'db', 'migrations');
  if (!fs.existsSync(migDir)) return;
  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map((r: any) => r.name)
  );
  const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    if (applied.has(f)) continue;
    const sql = fs.readFileSync(path.join(migDir, f), 'utf8');
    const tx = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(f);
    });
    tx();
  }
}
