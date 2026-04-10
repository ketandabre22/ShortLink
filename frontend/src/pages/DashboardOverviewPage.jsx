import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0 });
  const [urls, setUrls] = useState([]);

  const loadData = async (cancelled = false) => {
    try {
      const { data } = await api.get('/url/user/all');
      const urls = data.urls || [];
      const totalClicks = urls.reduce((sum, u) => sum + (u.clickCount || 0), 0);
      if (!cancelled) {
        setStats({ totalLinks: urls.length, totalClicks });
        setUrls(urls);
      }
    } catch {
      if (!cancelled) {
        setStats({ totalLinks: 0, totalClicks: 0 });
        setUrls([]);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadData(cancelled);

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this short URL?')) return;
    try {
      await api.delete(`/url/${id}`);
      await loadData(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-500 text-xs uppercase tracking-wide">Total URLs</p>
          <p className="text-3xl font-semibold text-white mt-1">{stats.totalLinks}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-500 text-xs uppercase tracking-wide">Total Clicks</p>
          <p className="text-3xl font-semibold text-white mt-1">{stats.totalClicks}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 links-section-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-white">Your links</h2>
          <Link to="/dashboard/links" className="text-sm text-sky-400 hover:underline">
            Create URL
          </Link>
        </div>

        {urls.length === 0 ? (
          <p className="text-slate-500 text-sm">No links yet. Create one in URL Manager.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 shadow-[0_0_0_1px_rgba(30,41,59,0.4)] links-section-table">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-800/80 text-slate-300 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-semibold border-b border-slate-700">Original</th>
                  <th className="px-4 py-3 font-semibold border-b border-slate-700">Short</th>
                  <th className="px-4 py-3 font-semibold border-b border-slate-700">Clicks</th>
                  <th className="px-4 py-3 font-semibold border-b border-slate-700">Created</th>
                  <th className="px-4 py-3 font-semibold border-b border-slate-700 w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950">
                {urls.map((row) => (
                  <tr key={row.id} className="odd:bg-slate-950 even:bg-slate-900/40 hover:bg-slate-800/70 transition-colors">
                    <td className="px-4 py-3 max-w-xs truncate text-slate-300" title={row.originalUrl}>
                      {row.originalUrl}
                    </td>
                    <td className="px-4 py-3 max-w-[12rem] truncate text-sky-400" title={row.shortUrl}>
                      {row.shortUrl}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{row.clickCount}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-3">
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
