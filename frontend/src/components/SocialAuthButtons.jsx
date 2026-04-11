const SOCIALS = [
  {
    key: 'google',
    label: 'Continue with Google',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 3.6 14.6 2.7 12 2.7 6.9 2.7 2.8 6.8 2.8 12s4.1 9.3 9.2 9.3c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1-.1-1.4H12z"
        />
      </svg>
    ),
  },
];

export default function SocialAuthButtons() {
  const startSocialAuth = (provider) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/social/${provider}`;
  };

  return (
    <div className="space-y-2">
      {SOCIALS.map((social) => (
        <button
          key={social.key}
          type="button"
          onClick={() => startSocialAuth(social.key)}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-200 hover:bg-slate-900 transition-colors"
        >
          {social.icon}
          <span>{social.label}</span>
        </button>
      ))}
    </div>
  );
}
