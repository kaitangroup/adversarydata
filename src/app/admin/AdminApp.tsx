'use client';

import { useEffect, useState } from 'react';

type User = { id: number; email: string; name: string; role: string } | null;

export function AdminApp() {
  const [user, setUser] = useState<User>(undefined as any);
  useEffect(() => { fetch('/api/auth/me').then(r => r.json()).then(j => setUser(j.user)); }, []);
  if (user === undefined as any) return <div className="p-8 opacity-60">Loading…</div>;
  if (!user || user.role !== 'admin') return <LoginCard onSuccess={(u) => setUser(u)} />;
  return <Shell user={user} onLogout={() => setUser(null)} />;
}

function LoginCard({ onSuccess }: { onSuccess: (u: any) => void }) {
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr('');
    const fd = new FormData(e.currentTarget);
    const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(fd.entries())) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok || j.user?.role !== 'admin') { setErr('Invalid credentials or not an admin.'); return; }
    onSuccess(j.user);
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bone)] p-6">
      <form onSubmit={submit} className="card p-8 w-full max-w-sm">
        <h1 className="font-serif text-3xl">Admin sign-in</h1>
        <p className="opacity-70 text-sm mt-1">Authorized personnel only.</p>
        <div className="mt-5"><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
        <div className="mt-3"><label className="label">Password</label><input name="password" type="password" required className="input" /></div>
        {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
        <button disabled={busy} className="btn btn-primary mt-5 w-full">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

const TABS = ['dashboard','leads','cases','groups','videos','users','settings','audit'] as const;
type Tab = typeof TABS[number];

function Shell({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard');
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); onLogout(); }
  return (
    <div className="min-h-screen flex bg-[color:var(--bone)]">
      <aside className="w-60 bg-[color:var(--ink)] text-[color:var(--bone)] flex flex-col">
        <div className="p-5 font-serif text-2xl border-b border-white/10">Admin</div>
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
                    className={`w-full text-left px-3 py-2 rounded capitalize text-sm ${tab===t ? 'bg-white/10' : 'hover:bg-white/5'}`}>
              {t}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 text-xs opacity-70">
          <div className="truncate">{user.email}</div>
          <button onClick={logout} className="mt-2 underline">Sign out</button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'leads' && <Leads />}
        {tab === 'cases' && <Crud resource="cases" title="Cases" fields={CASE_FIELDS} />}
        {tab === 'groups' && <Crud resource="groups" title="Defense Groups" fields={GROUP_FIELDS} />}
        {tab === 'videos' && <Crud resource="videos" title="Videos" fields={VIDEO_FIELDS} />}
        {tab === 'users' && <Users />}
        {tab === 'settings' && <Settings />}
        {tab === 'audit' && <Audit />}
      </main>
    </div>
  );
}

function Dashboard() {
  const [s, setS] = useState<any>(null);
  useEffect(() => { fetch('/api/admin/summary').then(r => r.json()).then(setS); }, []);
  if (!s) return <p className="opacity-60">Loading…</p>;
  const cards = [
    ['New leads', s.leads_new], ['Total leads', s.leads],
    ['Cases', s.cases], ['Groups', s.groups], ['Videos', s.videos], ['Users', s.users],
  ];
  return (
    <>
      <h1 className="font-serif text-4xl mb-6">Dashboard</h1>
      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(([k, v]) => (
          <div key={k as string} className="card p-4">
            <div className="text-xs opacity-60">{k}</div>
            <div className="text-3xl font-serif mt-1">{v}</div>
          </div>
        ))}
      </div>
      <h2 className="font-serif text-2xl mt-10 mb-3">Recent leads</h2>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/5"><tr><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Subject</th><th className="text-left p-3">Status</th><th className="text-left p-3">When</th></tr></thead>
          <tbody>
            {s.recent_leads.map((l: any) => (
              <tr key={l.id} className="border-t border-[color:var(--line)]">
                <td className="p-3">{l.name}</td><td className="p-3">{l.email}</td><td className="p-3">{l.subject}</td>
                <td className="p-3"><span className="badge">{l.status}</span></td><td className="p-3 opacity-70">{l.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Leads() {
  const [rows, setRows] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  async function load() { const r = await fetch('/api/admin/leads'); setRows(await r.json()); }
  useEffect(() => { load(); }, []);
  async function update(id: number, patch: any) {
    await fetch(`/api/admin/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    load();
  }
  async function del(id: number) {
    if (!confirm('Delete this lead?')) return;
    await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' }); load(); setActive(null);
  }
  return (
    <>
      <h1 className="font-serif text-4xl mb-6">Leads</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/5"><tr><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Subject</th><th className="text-left p-3">Status</th><th className="text-left p-3">When</th><th></th></tr></thead>
          <tbody>
            {rows.map(l => (
              <tr key={l.id} className="border-t border-[color:var(--line)]">
                <td className="p-3">{l.name}</td><td className="p-3">{l.email}</td><td className="p-3">{l.subject}</td>
                <td className="p-3">
                  <select value={l.status} onChange={e => update(l.id, { status: e.target.value })} className="select py-1">
                    <option>new</option><option>contacted</option><option>qualified</option><option>closed</option>
                  </select>
                </td>
                <td className="p-3 opacity-70">{l.created_at}</td>
                <td className="p-3 text-right space-x-3">
                  <button onClick={() => setActive(l)} className="underline text-xs">view</button>
                  <button onClick={() => del(l.id)} className="underline text-xs text-red-700">delete</button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-6 opacity-60" colSpan={6}>No leads yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {active && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setActive(null)}>
          <div onClick={e => e.stopPropagation()} className="card p-6 w-full max-w-lg">
            <h2 className="font-serif text-2xl">{active.subject || 'Lead'}</h2>
            <p className="text-sm opacity-70 mt-1">{active.name} · <a className="underline" href={`mailto:${active.email}`}>{active.email}</a> · {active.phone}</p>
            <pre className="bg-black/5 p-3 rounded mt-4 whitespace-pre-wrap text-sm">{active.message}</pre>
            <div className="mt-4">
              <label className="label">Notes</label>
              <textarea defaultValue={active.notes || ''} onBlur={e => update(active.id, { notes: e.target.value })} className="textarea" rows={3} />
            </div>
            <div className="mt-4 text-right"><button className="btn btn-ghost" onClick={() => setActive(null)}>Close</button></div>
          </div>
        </div>
      )}
    </>
  );
}

const CASE_FIELDS = [
  { name: 'title', label: 'Title', required: true },
  { name: 'citation', label: 'Citation' },
  { name: 'court', label: 'Court' },
  { name: 'year', label: 'Year', type: 'number' },
  { name: 'category', label: 'Category' },
  { name: 'outcome', label: 'Outcome' },
  { name: 'summary', label: 'Summary', textarea: true },
  { name: 'sort_order', label: 'Sort order', type: 'number' },
  { name: 'published', label: 'Published (1/0)', type: 'number' },
];
const GROUP_FIELDS = [
  { name: 'title', label: 'Title', required: true },
  { name: 'blurb', label: 'Blurb', textarea: true },
  { name: 'schedule', label: 'Schedule' },
  { name: 'price_cents', label: 'Price (cents)', type: 'number' },
  { name: 'capacity', label: 'Capacity', type: 'number' },
  { name: 'enrolled', label: 'Enrolled', type: 'number' },
  { name: 'start_date', label: 'Start date' },
  { name: 'active', label: 'Active (1/0)', type: 'number' },
  { name: 'sort_order', label: 'Sort order', type: 'number' },
];
const VIDEO_FIELDS = [
  { name: 'title', label: 'Title', required: true },
  { name: 'youtube_id', label: 'YouTube ID', required: true },
  { name: 'description', label: 'Description', textarea: true },
  { name: 'thumbnail', label: 'Thumbnail URL or /assets/...' },
  { name: 'sort_order', label: 'Sort order', type: 'number' },
  { name: 'published', label: 'Published (1/0)', type: 'number' },
];

type Field = { name: string; label: string; type?: string; textarea?: boolean; required?: boolean };

function Crud({ resource, title, fields }: { resource: string; title: string; fields: Field[] }) {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  async function load() { setRows(await fetch(`/api/admin/${resource}`).then(r => r.json())); }
  useEffect(() => { load(); }, [resource]);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: any = {};
    for (const f of fields) {
      const v = fd.get(f.name);
      body[f.name] = f.type === 'number' && v !== '' ? Number(v) : v ?? '';
    }
    const url = editing.id ? `/api/admin/${resource}/${editing.id}` : `/api/admin/${resource}`;
    const method = editing.id ? 'PATCH' : 'POST';
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { alert('Save failed'); return; }
    setEditing(null); load();
  }
  async function del(id: number) {
    if (!confirm('Delete?')) return;
    await fetch(`/api/admin/${resource}/${id}`, { method: 'DELETE' }); load();
  }
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-4xl">{title}</h1>
        <button className="btn btn-primary" onClick={() => setEditing({})}>+ New</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/5"><tr><th className="text-left p-3">ID</th><th className="text-left p-3">Title</th><th className="text-left p-3">Sort</th><th></th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-[color:var(--line)]">
                <td className="p-3 opacity-60">{r.id}</td>
                <td className="p-3">{r.title}</td>
                <td className="p-3 opacity-70">{r.sort_order}</td>
                <td className="p-3 text-right space-x-3">
                  <button className="underline text-xs" onClick={() => setEditing(r)}>edit</button>
                  <button className="underline text-xs text-red-700" onClick={() => del(r.id)}>delete</button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-6 opacity-60" colSpan={4}>No records.</td></tr>}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <h2 className="font-serif text-2xl mb-4">{editing.id ? `Edit ${title} #${editing.id}` : `New ${title}`}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {fields.map(f => (
                <div key={f.name} className={f.textarea ? 'md:col-span-2' : ''}>
                  <label className="label">{f.label}{f.required && ' *'}</label>
                  {f.textarea ? (
                    <textarea name={f.name} defaultValue={editing[f.name] ?? ''} required={!!f.required} rows={4} className="textarea" />
                  ) : (
                    <input name={f.name} type={f.type || 'text'} defaultValue={editing[f.name] ?? ''} required={!!f.required} className="input" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Users() {
  const [rows, setRows] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  async function load() { setRows(await fetch('/api/admin/users').then(r => r.json())); }
  useEffect(() => { load(); }, []);
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    const r = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { alert('Failed'); return; }
    setShow(false); load();
  }
  async function patch(id: number, p: any) {
    await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
    load();
  }
  async function del(id: number) { if (!confirm('Delete user?')) return; await fetch(`/api/admin/users/${id}`, { method: 'DELETE' }); load(); }
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-4xl">Users</h1>
        <button className="btn btn-primary" onClick={() => setShow(true)}>+ New user</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/5"><tr><th className="text-left p-3">Email</th><th className="text-left p-3">Name</th><th className="text-left p-3">Role</th><th className="text-left p-3">Active</th><th></th></tr></thead>
          <tbody>
            {rows.map(u => (
              <tr key={u.id} className="border-t border-[color:var(--line)]">
                <td className="p-3">{u.email}</td><td className="p-3">{u.name}</td>
                <td className="p-3"><select value={u.role} onChange={e => patch(u.id, { role: e.target.value })} className="select py-1"><option>admin</option><option>client</option></select></td>
                <td className="p-3"><input type="checkbox" defaultChecked={!!u.active} onChange={e => patch(u.id, { active: e.target.checked ? 1 : 0 })} /></td>
                <td className="p-3 text-right"><button className="underline text-xs text-red-700" onClick={() => del(u.id)}>delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setShow(false)}>
          <form onSubmit={add} onClick={e => e.stopPropagation()} className="card p-6 w-full max-w-md">
            <h2 className="font-serif text-2xl mb-4">New user</h2>
            <div className="space-y-3">
              <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
              <div><label className="label">Name</label><input name="name" required className="input" /></div>
              <div><label className="label">Password (min 10)</label><input name="password" type="password" required minLength={10} className="input" /></div>
              <div><label className="label">Role</label><select name="role" className="select"><option>client</option><option>admin</option></select></div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => setShow(false)}>Cancel</button>
              <button className="btn btn-primary">Create</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Settings() {
  const [data, setData] = useState<Record<string,string> | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { fetch('/api/admin/settings').then(r => r.json()).then(setData); }, []);
  if (!data) return <p className="opacity-60">Loading…</p>;
  async function save() {
    setSaving(true);
    await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setSaving(false);
    alert('Saved');
  }
  return (
    <>
      <h1 className="font-serif text-4xl mb-6">Settings</h1>
      <div className="card p-6 space-y-3 max-w-3xl">
        {Object.entries(data).map(([k, v]) => (
          <div key={k}>
            <label className="label">{k}</label>
            {(v && v.length > 80) ? (
              <textarea value={v} onChange={e => setData({ ...data!, [k]: e.target.value })} rows={3} className="textarea" />
            ) : (
              <input value={v} onChange={e => setData({ ...data!, [k]: e.target.value })} className="input" />
            )}
          </div>
        ))}
        <div className="text-right"><button onClick={save} disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : 'Save'}</button></div>
      </div>
    </>
  );
}

function Audit() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { fetch('/api/admin/audit').then(r => r.json()).then(setRows); }, []);
  return (
    <>
      <h1 className="font-serif text-4xl mb-6">Audit log</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/5"><tr><th className="text-left p-3">When</th><th className="text-left p-3">Who</th><th className="text-left p-3">Action</th><th className="text-left p-3">Entity</th><th className="text-left p-3">IP</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-[color:var(--line)]">
                <td className="p-3 opacity-70">{r.created_at}</td><td className="p-3">{r.email}</td>
                <td className="p-3">{r.action}</td><td className="p-3 opacity-70">{r.entity}#{r.entity_id}</td><td className="p-3 opacity-70">{r.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
