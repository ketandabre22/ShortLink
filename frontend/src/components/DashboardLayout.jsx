import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const tabClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
  }`;

export default function DashboardLayout() {
  const [showSocialToast, setShowSocialToast] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('social_login_success') === '1') {
      sessionStorage.removeItem('social_login_success');
      setShowSocialToast(true);
      const timer = setTimeout(() => setShowSocialToast(false), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  return (
    <div className="space-y-6">
      {showSocialToast && (
        <div className="rounded-lg border border-emerald-700 bg-emerald-950/60 px-4 py-2 text-sm text-emerald-300">
          Signed in with Google successfully.
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage links and view analytics in one place.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap border border-slate-800 rounded-xl p-2 bg-slate-900/70">
        <NavLink to="/dashboard" end className={tabClass}>
          Analytics
        </NavLink>
        <NavLink to="/dashboard/links" className={tabClass}>
          Create URL
        </NavLink>
      </div>

      <Outlet />
    </div>
  );
}
