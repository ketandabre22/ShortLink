import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SocialAuthCallbackPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userRaw = params.get('user');
    const error = params.get('error');

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }
    if (!token || !userRaw) {
      navigate('/login?error=Social login failed', { replace: true });
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      login(token, user);
      sessionStorage.setItem('social_login_success', '1');
      navigate('/dashboard', { replace: true });
    } catch {
      navigate('/login?error=Invalid social login response', { replace: true });
    }
  }, [login, navigate]);

  return <p className="text-slate-500">Signing you in...</p>;
}
