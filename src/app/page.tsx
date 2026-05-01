import Image from 'next/image';
import { getDb, ensureMigrated } from '@/lib/db';
import { SiteHeader, SiteFooter } from '@/components/SiteHeader';
import { ContactForm } from '@/components/ContactForm';

export const dynamic = 'force-dynamic';

function loadAll() {
  ensureMigrated();
  const db = getDb();
  const settings: Record<string, string> = {};
  for (const r of db.prepare('SELECT key, value FROM settings').all() as any[]) settings[r.key] = r.value;
  const cases = db.prepare(
    `SELECT id, title, citation, court, year, summary, category, outcome
     FROM cases WHERE published = 1 ORDER BY sort_order ASC, year DESC, id DESC`
  ).all() as any[];
  const groups = db.prepare(
    `SELECT id, title, blurb, schedule, price_cents, capacity, enrolled, start_date
     FROM defense_groups WHERE active = 1 ORDER BY sort_order ASC, id ASC`
  ).all() as any[];
  const videos = db.prepare(
    `SELECT id, title, youtube_id, description, thumbnail
     FROM videos WHERE published = 1 ORDER BY sort_order ASC, id DESC`
  ).all() as any[];
  return { settings, cases, groups, videos };
}

function fmtMoney(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function HomePage() {
  const { settings, cases, groups, videos } = loadAll();
  const siteName = settings.firm_name || 'Jones & Associates';

  return (
    <>
      <SiteHeader siteName={siteName} />

      {/* HERO */}
      <section className="container-x pt-16 md:pt-24 pb-16">
        <div className="grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7">
            <span className="badge">Criminal Defense · Est. 1985</span>
            <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] mt-5">
              {settings.firm_tagline || 'Forty years protecting the rights of the accused.'}
            </h1>
            <p className="mt-6 text-lg opacity-80 max-w-xl">
              {settings.about_short}
            </p>
            <blockquote className="mt-8 border-l-2 border-[color:var(--warm)] pl-5 italic text-[color:var(--deep)]">
              {settings.hero_quote}
            </blockquote>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contact" className="btn btn-primary">Schedule a confidential consult</a>
              <a href="#cases" className="btn btn-ghost">View track record</a>
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="aspect-[4/5] relative rounded-xl overflow-hidden card">
              <Image src="/assets/hero_book.png" alt="The Adversary System" fill style={{ objectFit: 'cover' }} priority />
            </div>
            <div className="mt-4 text-center">
              <div className="font-serif text-xl">{settings.book_title}</div>
              <div className="opacity-70 text-sm">{settings.book_subtitle}</div>
              <button className="btn btn-ghost mt-3 py-2">{settings.book_cta || 'Pre-order'}</button>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-[color:var(--deep)] text-[color:var(--bone)] py-20">
        <div className="container-x grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-5">
            <div className="aspect-square relative rounded-xl overflow-hidden">
              <Image src="/assets/bio_portrait_warm.png" alt="Roland G. Jones" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
          <div className="md:col-span-7">
            <span className="text-sm uppercase tracking-widest opacity-60">About</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">A practice built on the fundamentals.</h2>
            <p className="mt-5 opacity-85 leading-relaxed">
              For four decades, Roland G. Jones has represented men and women accused of serious federal and state offenses.
              The work begins with the documents, ends in the courtroom, and is shaped, always, by the constitutional baseline:
              the government must prove its case beyond a reasonable doubt.
            </p>
            <p className="mt-4 opacity-85 leading-relaxed">
              The firm advises on pre-indictment investigations, jury trials, sentencing, appeals, and post-conviction relief.
              It also runs structured defense groups for accused clients and their families.
            </p>
          </div>
        </div>
      </section>

      {/* TRACK RECORD */}
      <section id="cases" className="container-x py-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <span className="text-sm uppercase tracking-widest opacity-60">Selected matters</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-2">Track record</h2>
          </div>
          <p className="max-w-md opacity-70 text-sm">{settings.cases_intro}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cases.map((c) => (
            <article key={c.id} className="card p-5 hover:shadow-md transition">
              <div className="flex items-center gap-3 text-xs opacity-60">
                <span>{c.court ?? '—'}</span><span>·</span><span>{c.year ?? ''}</span>
              </div>
              <h3 className="font-serif text-2xl mt-2">{c.title}</h3>
              {c.citation && <div className="text-xs opacity-60 mt-1">{c.citation}</div>}
              <p className="mt-3 text-sm opacity-85">{c.summary}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="badge">{c.category}</span>
                <span className="text-sm font-semibold text-[color:var(--deep)]">{c.outcome}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* GROUPS */}
      <section id="groups" className="bg-white border-y border-[color:var(--line)] py-20">
        <div className="container-x">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <span className="text-sm uppercase tracking-widest opacity-60">Programs</span>
              <h2 className="font-serif text-4xl md:text-5xl mt-2">Defense groups</h2>
            </div>
            <p className="max-w-md opacity-70 text-sm">{settings.group_intro}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {groups.map((g) => {
              const seats = Math.max(0, (g.capacity ?? 0) - (g.enrolled ?? 0));
              return (
                <article key={g.id} className="card p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-2xl">{g.title}</h3>
                    <span className="badge">{seats} seats</span>
                  </div>
                  <p className="mt-3 opacity-85 text-sm">{g.blurb}</p>
                  <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div><dt className="opacity-60 text-xs">Schedule</dt><dd className="mt-1">{g.schedule}</dd></div>
                    <div><dt className="opacity-60 text-xs">Begins</dt><dd className="mt-1">{g.start_date}</dd></div>
                    <div><dt className="opacity-60 text-xs">Tuition</dt><dd className="mt-1">{fmtMoney(g.price_cents)}</dd></div>
                  </dl>
                  <div className="mt-5 flex justify-end">
                    <a href="#contact" className="btn btn-ghost py-2">Inquire</a>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* VIDEOS */}
      <section id="videos" className="container-x py-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <span className="text-sm uppercase tracking-widest opacity-60">Lectures</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-2">Talks & teaching</h2>
          </div>
          <p className="max-w-md opacity-70 text-sm">{settings.videos_intro}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {videos.map((v) => (
            <a key={v.id} href={`https://www.youtube.com/watch?v=${v.youtube_id}`} target="_blank" rel="noreferrer"
               className="card overflow-hidden group">
              <div className="relative aspect-video bg-[color:var(--ink)]/10">
                {v.thumbnail && (
                  <Image src={v.thumbnail} alt={v.title} fill style={{ objectFit: 'cover' }} sizes="(min-width:1024px) 25vw, 50vw" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
              </div>
              <div className="p-4">
                <h3 className="font-serif text-lg">{v.title}</h3>
                <p className="text-xs opacity-70 mt-1 line-clamp-2">{v.description}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="bg-[color:var(--ink)] text-[color:var(--bone)] py-20">
        <div className="container-x grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <span className="text-sm uppercase tracking-widest opacity-60">Contact</span>
            <h2 className="font-serif text-4xl md:text-5xl mt-2">Confidential consultation</h2>
            <p className="mt-4 opacity-80">
              All inquiries are protected by attorney-client privilege from the first call. Send a brief message
              and we will respond within one business day.
            </p>
          </div>
          <div className="md:col-span-7">
            <ContactForm />
          </div>
        </div>
      </section>

      <SiteFooter siteName={siteName} />
    </>
  );
}
