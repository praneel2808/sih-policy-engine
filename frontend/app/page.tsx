'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User { username: string; name: string; role: string }

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('smsws_user');
    if (!raw) {
      router.replace('/login');
    } else {
      try { setUser(JSON.parse(raw)); } catch { router.replace('/login'); }
    }
    setChecked(true);
  }, [router]);

  function logout() {
    localStorage.removeItem('smsws_user');
    router.push('/login');
  }

  if (!checked || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex flex-col">

      {/* Top nav */}
      <header className="w-full border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-400/20 border border-orange-400/60 flex items-center justify-center">
              <span className="text-orange-300 text-sm font-serif">&#x0950;</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-orange-300 text-[10px] font-semibold tracking-widest uppercase">
                Government of Maharashtra
              </span>
              <span className="text-white font-bold text-sm tracking-tight">
                Udyog Sahayak &mdash; Single Window System
              </span>
            </div>
          </div>
          {/* User badge + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-none">
              <span className="text-white text-xs font-semibold">{user.name}</span>
              <span className="text-blue-300 text-[10px]">{user.role}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-orange-500/80 flex items-center justify-center text-white font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              className="text-blue-300 hover:text-white text-xs border border-blue-600 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-3xl w-full">

          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full bg-orange-400/15 border-2 border-orange-400/50 flex items-center justify-center shadow-lg shadow-orange-900/30">
              <span className="text-orange-300 text-4xl font-serif">&#x0950;</span>
            </div>
            <p className="text-orange-300/80 text-xs tracking-[0.3em] uppercase">Satyameva Jayate</p>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            <span className="text-blue-200">Smart Maharashtra</span>
            <br />
            Single Window System
          </h1>

          <p className="text-blue-200 text-lg leading-relaxed max-w-2xl mx-auto mb-3">
            Instantly determine the approvals, incentives, required documents,
            and government forms for your industrial project in Maharashtra.
          </p>
          <p className="text-blue-300/70 text-sm leading-relaxed max-w-xl mx-auto mb-12">
            Powered by an AI-extracted knowledge base of{' '}
            <strong className="text-blue-200">478 official government documents</strong>,{' '}
            <strong className="text-blue-200">1,279 canonical policy rules</strong>, and{' '}
            <strong className="text-blue-200">186 extracted form requirements</strong>.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              href="/assess?demo=textile"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl shadow-xl shadow-orange-900/40 transition-all text-base"
            >
              <span className="text-xl">⚡</span>
              Try Demo Project
            </Link>
            <Link
              href="/assess"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-blue-300/50 hover:bg-white/10 text-blue-100 font-semibold rounded-xl transition-all text-base"
            >
              <span className="text-lg">+</span>
              New Assessment
            </Link>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              { n: '478', label: 'Govt. Documents' },
              { n: '1,279', label: 'Canonical Rules' },
              { n: '186', label: 'Form Requirements' },
              { n: '7,426', label: 'Source Chunks' },
            ].map((s) => (
              <div key={s.label} className="bg-white/8 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-white font-bold text-xl">{s.n}</p>
                <p className="text-blue-300/80 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Demo quick-links */}
      <div className="border-t border-white/10 bg-white/5 py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-4 items-center justify-center text-sm">
          <span className="text-blue-400 font-medium">Demo profiles:</span>
          <Link href="/assess?demo=textile" className="text-blue-200 hover:text-white underline underline-offset-2 transition-colors">
            Textile (Pune, MIDC)
          </Link>
          <Link href="/assess?demo=ev" className="text-blue-200 hover:text-white underline underline-offset-2 transition-colors">
            EV / Automotive (Aurangabad)
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-6 text-center">
        <p className="text-blue-400/60 text-xs max-w-2xl mx-auto leading-relaxed">
          <strong className="text-blue-400/80">Disclaimer:</strong> This is a preliminary AI-assisted assessment tool.
          All outputs are indicative only. Final approvals are subject to the relevant government departments
          and statutory authorities of Maharashtra.
        </p>
      </footer>
    </div>
  );
}
