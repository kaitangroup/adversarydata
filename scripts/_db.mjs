// Shared DB opener for scripts (CommonJS-friendly via dynamic import).
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

// Lightweight .env loader (no extra dependency).
function loadDotenv(file) {
  try {
    const txt = fs.readFileSync(file, 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    }
  } catch { /* no .env, ignore */ }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
loadDotenv(path.join(ROOT, '.env'));

export function resolveDbPath() {
  const p = process.env.DATABASE_PATH || path.join(ROOT, 'db', 'jones.sqlite');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  return p;
}

export function openDb() {
  const dbPath = resolveDbPath();
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export const PROJECT_ROOT = ROOT;
