import bcrypt from 'bcryptjs';
import { openDb, resolveDbPath } from './_db.mjs';

const db = openDb();

// --- Settings ---
const settings = {
  firm_name: 'Jones & Associates',
  firm_tagline: 'Forty years protecting the rights of the accused.',
  contact_phone: '(555) 555-5555',
  contact_email: 'contact@adversarydata.com',
  contact_address: '',
  about_short: 'Roland G. Jones has spent four decades crafting principled criminal defense in state and federal courts.',
  hero_quote: '"Beyond a reasonable doubt is not a slogan. It is the line that separates a free people from a frightened one."',
  book_title: 'The Adversary System',
  book_subtitle: 'Notes from forty years on the defense side of the bar.',
  book_cta: 'Pre-order',
  portal_intro: 'Secure access to your case documents and direct messages with our office.',
  group_intro: 'Small, structured cohorts for accused men and women navigating the federal system.',
  videos_intro: 'Selected lectures and conversations on criminal procedure and defense practice.',
  cases_intro: 'A representative sampling of decisions, dispositions, and dismissals from four decades of practice.',
  social_youtube: 'https://youtube.com/@example',
};
const setStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
for (const [k, v] of Object.entries(settings)) setStmt.run(k, v);

// --- Cases ---
const caseRows = [
  { title: 'United States v. Ordinary',     citation: 'No. 19-CR-0421', court: 'S.D.N.Y.',  year: 2021, category: 'Federal Trial',     outcome: 'Acquittal',          summary: 'Wire fraud allegations dismissed after evidentiary hearing exposed prosecution overreach.' },
  { title: 'People v. Preference',          citation: 'Index 7842/22', court: 'NY Sup. Ct.', year: 2022, category: 'State Trial',       outcome: 'Hung Jury → Plea',   summary: 'First-degree assault charges reduced after a hung jury and renewed Brady motion.' },
  { title: 'In re Trustee Matter',          citation: '—',             court: 'E.D.N.Y.',  year: 2020, category: 'Federal Appeal',    outcome: 'Reversed & Remanded',summary: 'Trustee liability ruling reversed on appeal; Second Circuit adopted defense theory.' },
  { title: 'United States v. New Value',    citation: 'No. 18-CR-0096', court: 'D. N.J.',    year: 2019, category: 'Federal Trial',     outcome: 'Dismissed',          summary: 'Bank fraud counts dismissed for prosecutorial misconduct prior to jury selection.' },
  { title: 'People v. Justice',             citation: 'Ind. 14-1209',  court: 'NY Sup. Ct.', year: 2018, category: 'State Trial',       outcome: 'Not Guilty',         summary: 'Full acquittal on all counts after seven-week trial; defense theory adopted by jury.' },
  { title: 'United States v. Group',        citation: 'No. 17-CR-0511', court: 'S.D.N.Y.',  year: 2018, category: 'Federal Sentencing',outcome: 'Time Served',        summary: 'Guidelines departure secured after extensive mitigation package and sentencing memo.' },
];
const caseStmt = db.prepare(`INSERT INTO cases (title, citation, court, year, category, outcome, summary, sort_order, published)
                             VALUES (@title, @citation, @court, @year, @category, @outcome, @summary, @sort_order, 1)`);
db.exec('DELETE FROM cases');
caseRows.forEach((c, i) => caseStmt.run({ ...c, sort_order: i }));

// --- Defense groups ---
const groups = [
  { title: 'Federal Sentencing Cohort',     blurb: 'Eight-week structured group for defendants approaching federal sentencing.', schedule: 'Tuesdays · 6:30pm ET', price_cents: 120000, capacity: 12, enrolled: 7,  start_date: '2026-06-02' },
  { title: 'Pretrial Strategy Circle',      blurb: 'For accused individuals in the pre-trial phase. Co-led with senior counsel.', schedule: 'Thursdays · 7:00pm ET', price_cents: 95000,  capacity: 10, enrolled: 4,  start_date: '2026-06-04' },
  { title: 'Family Liaison Group',          blurb: 'For spouses, parents, and adult children of the accused. Confidential.',     schedule: 'Mondays · 7:00pm ET',   price_cents: 60000,  capacity: 12, enrolled: 9,  start_date: '2026-06-01' },
  { title: 'Post-Conviction Reentry Group', blurb: 'Practical group for individuals reentering after federal incarceration.',     schedule: 'Saturdays · 10:00am ET',price_cents: 75000,  capacity: 10, enrolled: 3,  start_date: '2026-06-06' },
];
const groupStmt = db.prepare(`INSERT INTO defense_groups (title, blurb, schedule, price_cents, capacity, enrolled, start_date, active, sort_order)
                              VALUES (@title, @blurb, @schedule, @price_cents, @capacity, @enrolled, @start_date, 1, @sort_order)`);
db.exec('DELETE FROM defense_groups');
groups.forEach((g, i) => groupStmt.run({ ...g, sort_order: i }));

// --- Videos ---
const videos = [
  { title: 'On Cross-Examination',           youtube_id: 'dQw4w9WgXcQ', description: 'A lecture on building cross from the documents up.',          thumbnail: '/assets/thumb_justice.png' },
  { title: 'The Adversary System Today',     youtube_id: 'dQw4w9WgXcQ', description: 'Why the adversary model still matters in modern practice.',  thumbnail: '/assets/thumb_ordinary.png' },
  { title: 'Federal Sentencing Mitigation',  youtube_id: 'dQw4w9WgXcQ', description: 'Building a sentencing record the court will actually read.', thumbnail: '/assets/thumb_newvalue.png' },
  { title: 'Working with Defense Groups',    youtube_id: 'dQw4w9WgXcQ', description: 'How structured groups change client outcomes.',              thumbnail: '/assets/thumb_group.png' },
];
const videoStmt = db.prepare(`INSERT INTO videos (title, youtube_id, description, thumbnail, sort_order, published)
                              VALUES (@title, @youtube_id, @description, @thumbnail, @sort_order, 1)`);
db.exec('DELETE FROM videos');
videos.forEach((v, i) => videoStmt.run({ ...v, sort_order: i }));

// --- Admin user ---
const email = (process.env.ADMIN_EMAIL || 'rgj@rolandjones.com').toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'Admin12345';
const name = process.env.ADMIN_NAME || 'Roland G. Jones';
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
if (!existing) {
  const hash = bcrypt.hashSync(password, 12);
  db.prepare(`INSERT INTO users (email, password_hash, name, role, active) VALUES (?, ?, ?, 'admin', 1)`)
    .run(email, hash, name);
  console.log(`✓ admin user created: ${email}`);
} else {
  console.log(`• admin user already exists: ${email}`);
}

console.log(`✓ seed complete — DB: ${resolveDbPath()}`);
db.close();
