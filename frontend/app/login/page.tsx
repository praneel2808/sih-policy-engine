'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

const VALID_USERS = [
  { username: 'sih130', password: 'uias130@', name: 'Industrial Officer', role: 'Enterprise Administrator' },
];

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('smsws_user')) {
      router.replace('/');
    }
  }, [router]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const match = VALID_USERS.find(
        (u) => u.username === username.trim().toLowerCase() && u.password === password
      );
      if (match) {
        localStorage.setItem('smsws_user', JSON.stringify({ username: match.username, name: match.name, role: match.role }));
        router.push('/');
      } else {
        setError('Invalid username or password. Please use the registered credentials.');
        setLoading(false);
      }
    }, 300);
  }

  function quickFill() {
    setUsername('sih130');
    setPassword('uias130@');
    setError('');
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Portal Header */}
        <div className="text-center mb-6">
          <div className="w-28 h-28 rounded-3xl bg-slate-900/95 flex items-center justify-center mx-auto mb-4 shadow-xl border border-slate-700/80 p-3 ring-4 ring-slate-800/20">
            <img
              src="/maharashtra-emblem.png"
              alt="Government of Maharashtra Official Emblem"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
          <p className="text-slate-700 text-base tracking-wider uppercase font-extrabold">{t('gov.name', 'Government of Maharashtra')}</p>
          <h1 className="text-slate-900 font-black text-2xl tracking-tight mt-1">{t('portal.name', 'Unified Industrial Approval System')}</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">{t('portal.subtitle', 'Single Window Clearance & Regulatory Portal')}</p>
        </div>

        {/* Login Card - Soft comfortable slate & subtle border */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-sm">
          <h2 className="text-slate-800 font-semibold text-sm mb-1">{t('login.signin', 'Sign In')}</h2>
          <p className="text-slate-500 text-xs mb-5">{t('login.sub', 'Enter authorized single-window credentials')}</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('login.username', 'Username')}
              </label>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="username"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/40 bg-slate-50/50 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('login.password', 'Password')}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="password"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/40 bg-slate-50/50 text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px] font-medium"
                  tabIndex={-1}
                >
                  {showPass ? t('login.hide', 'Hide') : t('login.show', 'Show')}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-xs"
            >
              {loading ? t('login.authenticating', 'Authenticating…') : t('login.access', 'Access Portal →')}
            </button>
          </form>

          {/* Quick Credential Helper Button */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Authorized: <code className="text-slate-700 font-mono">username</code></span>
            <button
              type="button"
              onClick={quickFill}
              className="text-blue-600 hover:text-blue-700 text-xs font-medium underline underline-offset-2"
            >
              {t('login.autofill', 'Auto-fill Credentials')}
            </button>
          </div>
        </div>

        <p className="text-center text-slate-400 text-[11px] mt-5">
          Government of Maharashtra · Directorate of Industries
        </p>
      </div>
    </div>
  );
}
