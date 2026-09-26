'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ── Fake credentials ──────────────────────────────────────────────────────────
const VALID_USERS = [
  { username: 'admin',     password: 'smsws@2025',  name: 'Admin Officer',       role: 'Administrator' },
  { username: 'inspector', password: 'inspect@123', name: 'Rahul Patil',          role: 'Inspector (MIDC)' },
  { username: 'applicant', password: 'apply@2025',  name: 'Maharashtra Textile Co.', role: 'Applicant' },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  // If already logged in, skip to home
  useEffect(() => {
    if (localStorage.getItem('smsws_user')) router.replace('/');
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
        setError('Invalid username or password. Please try again.');
        setLoading(false);
      }
    }, 600); // small fake delay for realism
  }

  function quickFill(u: typeof VALID_USERS[0]) {
    setUsername(u.username);
    setPassword(u.password);
    setError('');
    setHintOpen(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex flex-col items-center justify-center px-4">

      {/* Card */}
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-orange-400/20 border-2 border-orange-400/60 flex items-center justify-center mx-auto mb-4">
            <span className="text-orange-300 text-3xl font-serif">&#x0950;</span>
          </div>
          <p className="text-orange-300 text-xs tracking-[0.25em] uppercase mb-1">Government of Maharashtra</p>
          <h1 className="text-white font-extrabold text-2xl leading-tight">Udyog Sahayak</h1>
          <p className="text-blue-300 text-sm mt-1">Smart Maharashtra Single Window System</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-8">
          <h2 className="text-gray-800 font-bold text-lg mb-1">Sign In</h2>
          <p className="text-gray-400 text-sm mb-6">Enter your credentials to access the portal</p>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Username / User ID
              </label>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="e.g. admin"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter password"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm px-1"
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <span className="text-red-500 shrink-0">⚠</span>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <button
              onClick={() => setHintOpen(!hintOpen)}
              className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span className="font-medium">Demo credentials</span>
              <span className="text-xs text-blue-500">{hintOpen ? '▲ hide' : '▼ show'}</span>
            </button>

            {hintOpen && (
              <div className="mt-3 space-y-2">
                {VALID_USERS.map((u) => (
                  <button
                    key={u.username}
                    onClick={() => quickFill(u)}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-blue-600">{u.username}</p>
                        <p className="text-xs font-mono text-gray-400">{u.password}</p>
                      </div>
                    </div>
                  </button>
                ))}
                <p className="text-xs text-center text-gray-400 mt-1">Click any row to auto-fill</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-400/60 text-xs mt-6 leading-relaxed px-4">
          This is a demonstration system. Credentials are for hackathon purposes only.
          Not connected to any live government portal.
        </p>
      </div>
    </div>
  );
}
