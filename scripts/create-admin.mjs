import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { openDb } from './_db.mjs';

const rl = readline.createInterface({ input, output });
const email = (await rl.question('Email: ')).trim().toLowerCase();
const name  = (await rl.question('Name:  ')).trim();
const pw    = (await rl.question('Password (min 10): ')).trim();
rl.close();

if (!email || !name || pw.length < 10) {
  console.error('Aborted: email, name and password (min 10 chars) are required.');
  process.exit(1);
}

const db = openDb();
const hash = bcrypt.hashSync(pw, 12);
db.prepare(`INSERT INTO users (email, password_hash, name, role, active)
            VALUES (?, ?, ?, 'admin', 1)
            ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, name = excluded.name, role = 'admin', active = 1`)
  .run(email, hash, name);
console.log(`✓ admin upserted: ${email}`);
db.close();
