import fs from 'node:fs';
import path from 'node:path';
import { openDb, PROJECT_ROOT, resolveDbPath } from './_db.mjs';

const db = openDb();
const migrationsDir = path.join(PROJECT_ROOT, 'db', 'migrations');

db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

const applied = new Set(db.prepare('SELECT name FROM _migrations').all().map(r => r.name));
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

let count = 0;
for (const f of files) {
  if (applied.has(f)) continue;
  const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
  const tx = db.transaction(() => {
    db.exec(sql);
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(f);
  });
  tx();
  console.log(`✓ applied ${f}`);
  count++;
}
console.log(count ? `Done — ${count} migration(s) applied.` : 'No new migrations.');
console.log(`DB: ${resolveDbPath()}`);
db.close();
