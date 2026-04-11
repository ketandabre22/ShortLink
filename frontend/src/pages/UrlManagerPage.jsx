import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function UrlManagerPage() {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copyHint, setCopyHint] = useState('');

  const loadUrls = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/url/user/all');
      setUrls(data.urls || []);
    } catch {
      setUrls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUrls();
  }, [loadUrls]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this short URL?')) return;
    try {
      await api.delete(`/api/url/${id}`);
      await loadUrls();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const onCopy = async (text) => {
    const ok = await copyText(text);
    setCopyHint(ok ? 'Copied!' : 'Copy failed');
    setTimeout(() => setCopyHint(''), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">URL Manager</h2>
        {copyHint && <span className="text-sm text-sky-400">{copyHint}</span>}
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : urls.length === 0 ? (
        <p className="text-slate-500">No links yet. Create one from the Create URL tab.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Original</th>
                <th className="px-4 py-3">Short</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/50">
              {urls.map((row) => (
                <tr key={row.id} className="hover:bg-slate-900/80">
                  <td className="px-4 py-3 max-w-xs truncate text-slate-300" title={row.originalUrl}>
                    {row.originalUrl}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onCopy(row.shortUrl)}
                      className="text-sky-400 hover:underline text-left truncate max-w-[10rem] block"
                      title={row.shortUrl}
                    >
                      {row.shortUrl}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{row.clickCount}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <Link to={`/dashboard/analytics/${row.id}`} className="text-sky-400 hover:underline">
                      Analytics
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      className="text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
