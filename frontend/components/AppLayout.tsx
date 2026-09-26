'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface User {
  username: string;
  name: string;
  role: string;
}

const NAV_LINKS = [
  { href: '/', label: 'Dashboard', icon: 'Dashboard' },
  { href: '/assess', label: 'Project Assessment', icon: 'Assessment', badge: 'Core' },
  { href: '/results', label: 'Assessment Results', icon: 'Results' },
  { href: '/approvals', label: 'Approvals & Compliance', icon: 'Approvals' },
  { href: '/incentives', label: 'Incentives & Schemes', icon: 'Incentives' },
  { href: '/documents', label: 'Documents', icon: 'Documents' },
  { href: '/forms', label: 'Forms Repository', icon: 'Forms', badge: '186' },
  { href: '/applications', label: 'Applications', icon: 'Applications' },
  { href: '/knowledge', label: 'Govt. Knowledge', icon: 'Knowledge', badge: '478' },
];

function NavIcon({ name }: { name: string }) {
  switch (name) {
    case 'Dashboard':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'Assessment':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      );
    case 'Results':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'Approvals':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'Incentives':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'Documents':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
      );
    case 'Forms':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'Applications':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'Knowledge':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasAssessment, setHasAssessment] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('smsws_user');
    if (!raw) {
      router.replace('/login');
    } else {
      try {
        setUser(JSON.parse(raw));
      } catch {
        router.replace('/login');
      }
    }

    const assessRaw = localStorage.getItem('smsws_assessment');
    if (assessRaw) setHasAssessment(true);
  }, [pathname, router]);

  function handleLogout() {
    localStorage.removeItem('smsws_user');
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Header */}
      <header className="w-full bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Brand & Maharashtra Government Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle navigation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <Link href="/" className="flex items-center gap-3 group">
              {/* Minimal Official Maharashtra State Shield Icon */}
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shadow-inner group-hover:border-slate-600 transition-colors">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.1-2.67 7.94-6 9-3.33-1.06-6-4.9-6-9V6.43l6-2.25zM11 7v2h2V7h-2zm0 4v6h2v-6h-2z" />
                </svg>
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                    Government of Maharashtra
                  </span>
                  <span className="hidden sm:inline-block text-[9px] font-mono bg-slate-800 text-amber-300 px-1.5 py-0.2 rounded border border-slate-700">
                    MAITRI Single Window
                  </span>
                </div>
                <span className="text-white font-bold text-sm sm:text-base tracking-tight leading-none group-hover:text-slate-100 transition-colors">
                  Unified Industrial Approval System
                </span>
              </div>
            </Link>
          </div>

          {/* Right Top Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Demo CTA */}
            <Link
              href="/assess?demo=textile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <span>Try Demo Project</span>
            </Link>

            {/* Assessment Indicator */}
            {hasAssessment && (
              <Link
                href="/results"
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium hover:text-white transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Active Report</span>
              </Link>
            )}

            {/* User Session Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden md:flex flex-col text-right leading-none">
                <span className="text-xs font-medium text-slate-200">{user?.name || 'Applicant'}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">{user?.role || 'Enterprise User'}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-1 text-[11px] text-slate-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                title="Sign out of portal"
              >
                Sign out
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 pt-20 pb-6 px-3.5 md:static md:block md:pt-6 md:w-60 shrink-0 transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Subtle Demo Launcher */}
          <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Fast Demonstration</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-normal">Evaluate clearances and subsidies with verified profiles.</p>
            <Link
              href="/assess?demo=textile"
              onClick={() => setSidebarOpen(false)}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300 transition-colors"
            >
              <span>Launch Demo Project</span>
            </Link>
          </div>

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
            Navigation
          </div>

          <nav className="space-y-0.5">
            {NAV_LINKS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>
                      <NavIcon name={item.icon} />
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        isActive
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 pt-4 border-t border-slate-200 px-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Regulatory Corpus</span>
              <span className="font-mono text-slate-700 font-semibold">Grounded</span>
            </div>
            <div className="mt-1.5 space-y-1 text-[11px] text-slate-400">
              <p>• 478 Official Documents</p>
              <p>• 1,279 Canonical Rules</p>
              <p>• 186 Extracted Forms</p>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-10 md:hidden"
          />
        )}

        {/* Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Clean Footer */}
      <footer className="w-full bg-white border-t border-slate-200 mt-auto py-3.5 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Unified Industrial Approval System · Directorate of Industries, Govt. of Maharashtra</p>
          <p className="text-slate-400">Deterministic Rule Engine · Grounded in Verified State Gazettes & MAITRI Rules</p>
        </div>
      </footer>
    </div>
  );
}
