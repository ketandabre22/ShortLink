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
  {
    key: 'facebook',
    label: 'Continue with Facebook',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path
          fill="#1877F2"
          d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2V8h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"
        />
      </svg>
    ),
  },
  {
    key: 'apple',
    label: 'Continue with Apple',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16.7 12.8c0-2.5 2-3.7 2-3.8-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.8-.4 7 1.2 9.2.8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.9-2.2.9-1.3 1.2-2.5 1.2-2.5-.1 0-2.6-1-2.6-3.3zM14.4 5.8c.6-.7 1-1.8.9-2.8-.9 0-2 .6-2.6 1.3-.6.7-1.1 1.8-1 2.8 1 .1 2-.5 2.7-1.3z"
        />
      </svg>
    ),
  },
];

export default function SocialAuthButtons() {
  const startSocialAuth = (provider) => {
    window.location.href = `/api/auth/social/${provider}`;
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
