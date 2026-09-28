'use client';

import React, { useEffect } from 'react';

export default function OfficerPortalRedirectPage() {
  useEffect(() => {
    // Automatically redirect to the dedicated officer station on port 3001
    const timer = setTimeout(() => {
      window.location.href = 'http://localhost:3001';
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-2xl">
          🏛️
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded">
            Government of Maharashtra
          </span>
          <h2 className="text-base font-black text-white">MAITRI Officer Response Station</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          The Officer Console is running on its own dedicated separate server station at{' '}
          <strong className="text-amber-300 font-mono">http://localhost:3001</strong> with strict departmental authentication and query isolation.
        </p>
        <p className="text-[11px] text-slate-500">Redirecting to port 3001...</p>
        <a
          href="http://localhost:3001"
          className="inline-block w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all"
        >
          Open Officer Station (Port 3001) →
        </a>
      </div>
    </div>
  );
}
