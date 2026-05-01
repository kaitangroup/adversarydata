import Link from 'next/link';

export function SiteHeader({ siteName }: { siteName: string }) {
  return (
    <header className="border-b border-[color:var(--line)] bg-[color:var(--bone)]/80 backdrop-blur sticky top-0 z-30">
      <div className="container-x flex items-center justify-between py-4">
        <Link href="/" className="font-serif text-2xl tracking-tight">{siteName}</Link>
        <nav className="hidden md:flex items-center gap-7">
          <a href="#about" className="nav-link">About</a>
          <a href="#cases" className="nav-link">Track Record</a>
          <a href="#groups" className="nav-link">Defense Groups</a>
          <a href="#videos" className="nav-link">Lectures</a>
          <a href="#contact" className="nav-link">Contact</a>
          <Link href="/portal" className="btn btn-ghost py-2">Client Login</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ siteName }: { siteName: string }) {
  return (
    <footer className="bg-[color:var(--ink)] text-[color:var(--bone)] mt-24">
      <div className="container-x py-12 grid md:grid-cols-3 gap-8">
        <div>
          <div className="font-serif text-2xl mb-2">{siteName}</div>
          <p className="opacity-70 text-sm">Criminal defense, federal and state. Sentencing mitigation, appeals, and post-conviction relief.</p>
        </div>
        <div>
          <div className="text-sm uppercase tracking-widest opacity-60 mb-3">Office</div>
          <p className="opacity-80 text-sm">Confidential consultations by appointment.</p>
        </div>
        <div>
          <div className="text-sm uppercase tracking-widest opacity-60 mb-3">Legal</div>
          <p className="opacity-60 text-xs">Attorney advertising. Prior results do not guarantee a similar outcome.</p>
        </div>
      </div>
      <div className="container-x py-6 border-t border-white/10 text-xs opacity-60 flex flex-col md:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} {siteName}. All rights reserved.</span>
        <span><Link href="/portal" className="underline">Client Portal</Link> · <Link href="/admin" className="underline">Admin</Link></span>
      </div>
    </footer>
  );
}
