import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import SocialAuthButtons from '../components/SocialAuthButtons.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const oauthError = new URLSearchParams(location.search).get('error');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
      <p className="text-slate-400 text-sm mb-8">Sign in to manage your short links.</p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        {(error || oauthError) && (
          <div className="text-red-400 text-sm bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
            {error || oauthError}
          </div>
        )}
        <SocialAuthButtons />
        <div className="flex items-center gap-3 text-slate-500 text-xs">
          <span className="h-px bg-slate-700 flex-1" />
          <span>or continue with email</span>
          <span className="h-px bg-slate-700 flex-1" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm text-slate-400 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-slate-400 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-slate-500 text-sm mt-6">
        No account?{' '}
        <Link to="/register" className="text-sky-400 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
