import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import api from '../api/client';

export default function AnalyticsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      try {
        const { data: res } = await api.get(`/api/url/analytics/${id}`, { params: { days }, });
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load analytics');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, days]);

  if (error) {
    return (
      <div>
        <Link to="/dashboard/links" className="text-sky-400 text-sm hover:underline mb-4 inline-block">
          ← Back to URL manager
        </Link>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <p className="text-slate-500">Loading analytics…</p>;
  }

  const chartData = data.clicksOverTime.map((d) => ({
    date: d.date,
    clicks: d.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <Link to="/dashboard/links" className="text-sky-400 text-sm hover:underline">
          ← Back to URL manager
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4 mb-2">Analytics</h1>
        <p className="text-slate-400 text-sm break-all">{data.url.originalUrl}</p>
        <p className="text-slate-500 text-sm mt-1">
          Short:{' '}
          <a href={data.url.shortUrl} className="text-sky-400 hover:underline" target="_blank" rel="noreferrer">
            {data.url.shortUrl}
          </a>
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-500 text-xs uppercase tracking-wide">Total clicks</p>
          <p className="text-3xl font-semibold text-white mt-1">{data.totalClicks}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-500 text-xs uppercase tracking-wide">Clicks in range</p>
          <p className="text-3xl font-semibold text-white mt-1">{data.clicksInRange}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
          <label htmlFor="days" className="text-slate-500 text-xs uppercase tracking-wide mb-1">
            Chart range (days)
          </label>
          <select
            id="days"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            {[7, 14, 30, 90, 365].map((d) => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-80">
        <h2 className="text-lg font-medium text-white mb-4">Clicks over time</h2>
        {chartData.length === 0 ? (
          <p className="text-slate-500 text-sm">No clicks in this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Line type="monotone" dataKey="clicks" stroke="#0ea5e9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
