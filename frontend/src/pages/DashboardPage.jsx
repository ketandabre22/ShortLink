import { useState } from 'react';
import api from '../api/client';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function DashboardPage() {
  const [form, setForm] = useState({ url: '', customCode: '', expiresAt: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [lastCreated, setLastCreated] = useState(null);
  const [copyHint, setCopyHint] = useState('');

  const handleShorten = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    setLastCreated(null);
    try {
      const body = {
        url: form.url.trim(),
        ...(form.customCode.trim() ? { customCode: form.customCode.trim() } : {}),
        ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt).toISOString() } : {}),
      };
      const { data } = await api.post('/api/url/shorten', body);
      setLastCreated(data);
      setForm({ url: '', customCode: '', expiresAt: '' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not shorten URL');
    } finally {
      setSubmitting(false);
    }
  };

  const onCopy = async (text) => {
    const ok = await copyText(text);
    setCopyHint(ok ? 'Copied!' : 'Copy failed');
    setTimeout(() => setCopyHint(''), 2000);
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Create Short URL</h1>
        <p className="text-slate-400 text-sm mb-6">
          Create your short links here.
        </p>

        <form
          onSubmit={handleShorten}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl"
        >
          {formError && (
            <div className="text-red-400 text-sm bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Long URL</label>
            <input
              type="url"
              required
              placeholder="https://example.com/very/long/path"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Custom short code (optional)</label>
              <input
                type="text"
                placeholder="my-brand"
                value={form.customCode}
                onChange={(e) => setForm({ ...form, customCode: e.target.value })}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Expires at (optional)</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium disabled:opacity-50"
          >
            {submitting ? 'Shortening…' : 'Shorten'}
          </button>
        </form>

        {lastCreated && (
          <div className="mt-6 max-w-2xl bg-slate-900/80 border border-sky-900 rounded-2xl p-6 flex flex-col sm:flex-row gap-6">
            <div className="flex-1 space-y-3">
              <p className="text-emerald-400 text-sm font-medium">Created successfully</p>
              <p className="text-slate-300 text-sm break-all">
                <span className="text-slate-500">Short: </span>
                {lastCreated.shortUrl}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onCopy(lastCreated.shortUrl)}
                  className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Copy link
                </button>
                {copyHint && <span className="text-sm text-sky-400 self-center">{copyHint}</span>}
              </div>
            </div>
            {lastCreated.qrDataUrl && (
              <div className="flex flex-col items-center gap-2">
                <img src={lastCreated.qrDataUrl} alt="QR code" className="rounded-lg border border-slate-700 w-40 h-40" />
                <a
                  href={lastCreated.qrDataUrl}
                  download={`qr-${lastCreated.shortCode}.png`}
                  className="text-xs text-sky-400 hover:underline"
                >
                  Download PNG
                </a>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
