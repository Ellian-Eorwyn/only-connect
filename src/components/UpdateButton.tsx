import { useState } from 'react';

// Calls the dev-server's /__update endpoint (git pull + npm install). When the
// app is opened as a static build (no dev server) the endpoint is absent, so we
// fall back to telling the host to run ./update.sh.
export function UpdateButton() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function check() {
    setStatus('checking');
    setMsg('');
    try {
      const r = await fetch('/__update', { method: 'POST' });
      if (!r.ok) throw new Error('no endpoint');
      const data = (await r.json()) as { ok: boolean; output: string };
      const out = (data.output || '').toLowerCase();
      if (!data.ok) {
        setStatus('error');
        setMsg(data.output || 'Update failed.');
      } else if (out.includes('already up to date') || out.includes('up-to-date')) {
        setStatus('done');
        setMsg('Already up to date.');
      } else {
        setStatus('done');
        setMsg('Updated! Reloading…');
        setTimeout(() => location.reload(), 1200);
      }
    } catch {
      setStatus('error');
      setMsg('Run ./update.sh in the terminal to update.');
    }
  }

  return (
    <div className="oc-update">
      <button className="oc-link" onClick={check} disabled={status === 'checking'}>
        {status === 'checking' ? 'Checking…' : '⟳ Update from GitHub'}
      </button>
      {msg && <span className={'oc-update-msg' + (status === 'error' ? ' err' : '')}>{msg}</span>}
    </div>
  );
}
