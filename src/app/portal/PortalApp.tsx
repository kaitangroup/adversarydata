'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function PortalApp() {
  const [user, setUser] = useState<any>(undefined);
  useEffect(() => { fetch('/api/auth/me').then(r => r.json()).then(j => setUser(j.user)); }, []);
  if (user === undefined) return <div className="p-8 opacity-60">Loading…</div>;
  if (!user || user.role !== 'client') return <Login onSuccess={u => setUser(u)} />;
  return <Shell user={user} onLogout={() => setUser(null)} />;
}

function Login({ onSuccess }: { onSuccess: (u: any) => void }) {
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr('');
    const fd = new FormData(e.currentTarget);
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(fd.entries())) });
    const j = await r.json(); setBusy(false);
    if (!r.ok || j.user?.role !== 'client') { setErr('Invalid credentials.'); return; }
    onSuccess(j.user);
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bone)] p-6">
      <form onSubmit={submit} className="card p-8 w-full max-w-sm">
        <Link href="/" className="text-xs underline opacity-60">← Back to site</Link>
        <h1 className="font-serif text-3xl mt-2">Client Portal</h1>
        <p className="opacity-70 text-sm mt-1">Secure access to documents and messages.</p>
        <div className="mt-5"><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
        <div className="mt-3"><label className="label">Password</label><input name="password" type="password" required className="input" /></div>
        {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
        <button disabled={busy} className="btn btn-primary mt-5 w-full">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

function Shell({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [tab, setTab] = useState<'home'|'documents'|'messages'|'profile'>('home');
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); onLogout(); }
  return (
    <div className="min-h-screen bg-[color:var(--bone)]">
      <header className="bg-[color:var(--ink)] text-[color:var(--bone)]">
        <div className="container-x py-4 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl">Client Portal</Link>
          <div className="text-sm opacity-80">{user.name} · <button onClick={logout} className="underline">Sign out</button></div>
        </div>
        <div className="container-x flex gap-1 text-sm">
          {(['home','documents','messages','profile'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-2 capitalize ${tab===t ? 'bg-white/10' : 'opacity-70 hover:opacity-100'}`}>{t}</button>
          ))}
        </div>
      </header>
      <main className="container-x py-10">
        {tab === 'home' && <Home user={user} />}
        {tab === 'documents' && <Documents />}
        {tab === 'messages' && <Messages />}
        {tab === 'profile' && <Profile />}
      </main>
    </div>
  );
}

function Home({ user }: { user: any }) {
  return (
    <>
      <h1 className="font-serif text-4xl">Welcome, {user.name.split(' ')[0]}.</h1>
      <p className="opacity-80 mt-2 max-w-2xl">
        This portal contains your case documents and a direct line to the firm. All communication here is protected
        by attorney-client privilege.
      </p>
    </>
  );
}

function Documents() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { fetch('/api/portal/documents').then(r => r.json()).then(setRows); }, []);
  return (
    <>
      <h1 className="font-serif text-4xl mb-6">Documents</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/5"><tr><th className="text-left p-3">File</th><th className="text-left p-3">Size</th><th className="text-left p-3">Uploaded</th></tr></thead>
          <tbody>
            {rows.map(d => (
              <tr key={d.id} className="border-t border-[color:var(--line)]">
                <td className="p-3">{d.original}</td>
                <td className="p-3 opacity-70">{Math.round((d.size_bytes ?? 0) / 1024)} KB</td>
                <td className="p-3 opacity-70">{d.created_at}</td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-6 opacity-60" colSpan={3}>No documents yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Messages() {
  const [rows, setRows] = useState<any[]>([]);
  const [body, setBody] = useState('');
  async function load() { setRows(await fetch('/api/portal/messages').then(r => r.json())); }
  useEffect(() => { load(); }, []);
  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!body.trim()) return;
    await fetch('/api/portal/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) });
    setBody(''); load();
  }
  return (
    <>
      <h1 className="font-serif text-4xl mb-6">Messages</h1>
      <div className="card p-5 space-y-3 max-h-[55vh] overflow-auto">
        {rows.map(m => (
          <div key={m.id} className={`flex ${m.from_admin ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${m.from_admin ? 'bg-[color:var(--deep)] text-[color:var(--bone)]' : 'bg-[color:var(--accent)]/30'}`}>
              <p className="whitespace-pre-wrap">{m.body}</p>
              <div className="text-[10px] opacity-60 mt-1">{m.created_at}</div>
            </div>
          </div>
        ))}
        {!rows.length && <p className="opacity-60 text-sm">No messages yet.</p>}
      </div>
      <form onSubmit={send} className="card p-4 mt-4">
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write to the firm…" rows={3} className="textarea" />
        <div className="text-right mt-2"><button className="btn btn-primary">Send</button></div>
      </form>
    </>
  );
}

function Profile() {
  const [me, setMe] = useState<any>(null);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [name, setName] = useState('');
  useEffect(() => { fetch('/api/portal/me').then(r => r.json()).then((u) => { setMe(u); setName(u.name); }); }, []);
  if (!me) return <p className="opacity-60">Loading…</p>;
  async function saveName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await fetch('/api/portal/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    alert('Saved');
  }
  async function changePw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = await fetch('/api/portal/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: pw.current, new_password: pw.next }) });
    if (!r.ok) { alert('Could not change password.'); return; }
    setPw({ current: '', next: '' }); alert('Password updated.');
  }
  return (
    <>
      <h1 className="font-serif text-4xl mb-6">Profile</h1>
      <form onSubmit={saveName} className="card p-6 max-w-lg">
        <div><label className="label">Email</label><input value={me.email} disabled className="input opacity-70" /></div>
        <div className="mt-3"><label className="label">Name</label><input value={name} onChange={e => setName(e.target.value)} className="input" /></div>
        <div className="text-right mt-4"><button className="btn btn-primary">Save</button></div>
      </form>
      <form onSubmit={changePw} className="card p-6 max-w-lg mt-6">
        <h2 className="font-serif text-2xl mb-3">Change password</h2>
        <div><label className="label">Current password</label><input type="password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} required className="input" /></div>
        <div className="mt-3"><label className="label">New password (min 10)</label><input type="password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} minLength={10} required className="input" /></div>
        <div className="text-right mt-4"><button className="btn btn-primary">Update</button></div>
      </form>
    </>
  );
}
