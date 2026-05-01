'use client';

import { useState } from 'react';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [err, setErr] = useState<string>('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending'); setErr('');
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error === 'rate_limited' ? 'Too many requests. Please try again shortly.' : 'Could not send. Please try again.');
      }
      setStatus('ok');
      (e.target as HTMLFormElement).reset();
    } catch (e: any) {
      setErr(e.message || 'Error sending'); setStatus('err');
    }
  }

  if (status === 'ok') {
    return (
      <div className="card p-8 text-[color:var(--ink)]">
        <h3 className="font-serif text-2xl">Message received.</h3>
        <p className="mt-2 opacity-80">Thank you. Roland or a member of the firm will respond within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 grid md:grid-cols-2 gap-4 text-[color:var(--ink)]">
      <div>
        <label className="label">Name</label>
        <input name="name" required maxLength={120} className="input" />
      </div>
      <div>
        <label className="label">Email</label>
        <input name="email" type="email" required maxLength={200} className="input" />
      </div>
      <div>
        <label className="label">Phone <span className="opacity-50">(optional)</span></label>
        <input name="phone" maxLength={40} className="input" />
      </div>
      <div>
        <label className="label">Subject</label>
        <input name="subject" maxLength={200} className="input" />
      </div>
      <div className="md:col-span-2">
        <label className="label">Message</label>
        <textarea name="message" required rows={5} maxLength={5000} className="textarea" />
      </div>
      <input type="hidden" name="source" value="home" />
      <div className="md:col-span-2 flex items-center justify-between gap-3">
        <p className="text-xs opacity-60">Protected by attorney-client privilege.</p>
        <button type="submit" disabled={status === 'sending'} className="btn btn-primary">
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
      </div>
      {status === 'err' && <div className="md:col-span-2 text-sm text-red-600">{err}</div>}
    </form>
  );
}
