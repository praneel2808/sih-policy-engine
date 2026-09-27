'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AiSupportWidget from '@/components/AiSupportWidget';
import { useLanguage } from '@/context/LanguageContext';

interface User {
  username: string;
  name: string;
  role: string;
}

const NAV_LINKS = [
  { href: '/', key: 'nav.dashboard', defaultLabel: 'Dashboard', icon: 'Dashboard' },
  { href: '/assess', key: 'nav.assess', defaultLabel: 'Project Assessment', icon: 'Assessment', badge: 'Core' },
  { href: '/results', key: 'nav.results', defaultLabel: 'Assessment Results', icon: 'Results' },
  { href: '/approvals', key: 'nav.approvals', defaultLabel: 'Approvals & Compliance', icon: 'Approvals' },
  { href: '/incentives', key: 'nav.incentives', defaultLabel: 'Incentives & Schemes', icon: 'Incentives' },
  { href: '/documents', key: 'nav.documents', defaultLabel: 'Documents', icon: 'Documents' },
  { href: '/forms', key: 'nav.forms', defaultLabel: 'Forms Repository', icon: 'Forms', badge: '186' },
  { href: '/applications', key: 'nav.applications', defaultLabel: 'Applications', icon: 'Applications' },
  { href: '/knowledge', key: 'nav.knowledge', defaultLabel: 'Govt. Knowledge', icon: 'Knowledge', badge: '478' },
];

function NavIcon({ name }: { name: string }) {
  switch (name) {
    case 'Dashboard':
      return (
        <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'Assessment':
      return (
        <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      );
    case 'Results':
      return (
        <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'Approvals':
      return (
        <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'Incentives':
      return (
        <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'Documents':
      return (
        <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
      );
    case 'Forms':
      return (
        <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'Applications':
      return (
        <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'Knowledge':
      return (
        <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hasAssessment, setHasAssessment] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large'>('normal');

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
    
    // Check saved sidebar state
    const savedCollapsed = localStorage.getItem('smsws_sidebar_collapsed');
    if (savedCollapsed === '1') {
      setSidebarCollapsed(true);
    }

    // Ensure default size is strictly 'normal' (button A)
    const savedFontSize = localStorage.getItem('smsws_font_size_v2');
    if (savedFontSize === 'small' || savedFontSize === 'normal' || savedFontSize === 'large') {
      setFontSize(savedFontSize as 'small' | 'normal' | 'large');
      if (typeof document !== 'undefined') {
        if (savedFontSize === 'small') document.documentElement.style.fontSize = '100%';
        else if (savedFontSize === 'normal') document.documentElement.style.fontSize = '112.5%';
        else if (savedFontSize === 'large') document.documentElement.style.fontSize = '125%';
      }
    } else {
      setFontSize('normal');
      localStorage.setItem('smsws_font_size_v2', 'normal');
      if (typeof document !== 'undefined') {
        document.documentElement.style.fontSize = '112.5%';
      }
    }
  }, [pathname, router]);

  function changeFontSize(size: 'small' | 'normal' | 'large') {
    setFontSize(size);
    localStorage.setItem('smsws_font_size_v2', size);
    if (typeof document !== 'undefined') {
      if (size === 'small') document.documentElement.style.fontSize = '100%';
      else if (size === 'normal') document.documentElement.style.fontSize = '112.5%';
      else if (size === 'large') document.documentElement.style.fontSize = '125%';
    }
  }

  function toggleSidebarCollapse() {
    const nextState = !sidebarCollapsed;
    setSidebarCollapsed(nextState);
    localStorage.setItem('smsws_sidebar_collapsed', nextState ? '1' : '0');
  }

  function handleLogout() {
    localStorage.removeItem('smsws_user');
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col antialiased text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Functional Official Government Utility Top Bar */}
      <div className="w-full bg-slate-950 text-slate-300 border-b border-slate-800 text-[11px] px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3 font-medium z-50">
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl p-1 shadow-inner">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-lg text-xs font-black tracking-wide transition-all ${
                lang === 'en' ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              ENGLISH
            </button>
            <button
              type="button"
              onClick={() => setLang('mr')}
              className={`px-3 py-1 rounded-lg text-xs font-black tracking-wide transition-all ${
                lang === 'mr' ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`px-3 py-1 rounded-lg text-xs font-black tracking-wide transition-all ${
                lang === 'hi' ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              हिंदी
            </button>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden sm:inline font-semibold">
            {t('portal.subtitle', 'Government of Maharashtra — Official Industrial Single Window Portal')}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {/* Font Sizer Controls */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="hidden md:inline text-slate-400 font-semibold">{t('text.size', 'Text Size:')}</span>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl p-1">
              <button
                type="button"
                onClick={() => changeFontSize('small')}
                title="Small Font Size (A-)"
                className={`px-2 py-0.5 rounded font-mono font-bold text-xs transition-colors ${
                  fontSize === 'small' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => changeFontSize('normal')}
                title="Standard Font Size (A)"
                className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs transition-colors ${
                  fontSize === 'normal' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => changeFontSize('large')}
                title="Enlarged Font Size (A+)"
                className={`px-2 py-0.5 rounded font-mono font-bold text-xs transition-colors ${
                  fontSize === 'large' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                A+
              </button>
            </div>
          </div>

          <span className="text-slate-700">|</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {t('maitri.gateway', 'MAITRI Gateway Active')}
          </span>
        </div>
      </div>

      {/* Top Header */}
      <header className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand & Desktop Collapse Toggle */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle mobile navigation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop Sidebar Collapse Toggle Button */}
            <button
              onClick={toggleSidebarCollapse}
              className="hidden md:flex items-center justify-center p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar menu" : "Collapse sidebar menu"}
            >
              <svg className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            <Link href="/" className="flex items-center gap-3 group">
              {/* Official Maharashtra State Emblem */}
              <div className="w-10 h-10 rounded-lg bg-white/10 p-0.5 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-inner group-hover:border-amber-400/50 transition-colors">
                <img
                  src="/maharashtra-emblem.png"
                  alt="Government of Maharashtra State Emblem"
                  className="w-full h-full object-contain drop-shadow"
                />
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base uppercase font-extrabold tracking-wider text-slate-300">
                    {t('gov.name', 'Government of Maharashtra')}
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700">
                    {t('maitri.single_window', 'MAITRI Single Window')}
                  </span>
                </div>
                <span className="text-white font-black text-lg sm:text-xl tracking-tight leading-none group-hover:text-slate-100 transition-colors">
                  {t('portal.name', 'Unified Industrial Approval System')}
                </span>
              </div>
            </Link>
          </div>

          {/* Right Top Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Demo CTA */}
            <Link
              href="/assess?demo=textile"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <span>{t('try.demo', 'Try Demo Project')}</span>
            </Link>

            {/* Assessment Indicator */}
            {hasAssessment && (
              <Link
                href="/results"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold hover:text-white transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{t('active.report', 'Active Report')}</span>
              </Link>
            )}

            {/* User Session Profile & Logout */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden md:flex flex-col text-right leading-none">
                <span className="text-xs font-bold text-slate-200">{user?.name || 'Applicant'}</span>
                <span className="text-[11px] text-slate-400 mt-0.5">{user?.role || 'Enterprise User'}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-1 text-xs text-slate-400 hover:text-rose-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors font-medium"
                title="Sign out of portal"
              >
                {t('nav.signout', 'Sign out')}
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container with Full Fluid Width */}
      <div className="flex-1 flex w-full mx-auto my-4 px-3 sm:px-6 lg:px-8 gap-6">
        
        {/* Sidebar Container Wrapper - Sticky + Hover Expansion Overlay */}
        <div className={`relative shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-72'} z-20 hover:z-40`}>
          <aside
            className={`sticky top-20 h-[calc(100vh-6rem)] bg-slate-900 text-slate-300 border border-slate-800 p-4 rounded-2xl transition-all duration-300 ease-in-out shadow-xl flex flex-col justify-between overflow-x-hidden overflow-y-auto group ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            } ${
              sidebarCollapsed
                ? 'w-16 px-2 hover:w-72 hover:px-4 hover:shadow-2xl hover:z-40 hover:bg-slate-900'
                : 'w-72 px-4'
            }`}
          >
            <div>
              {/* Navigation Section at Top for Fixed Icon Position */}
              <div className={`text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 whitespace-nowrap ${
                sidebarCollapsed ? 'hidden group-hover:block' : 'block'
              }`}>
                {t('nav.navigation', 'Navigation')}
              </div>

              <nav className="space-y-1.5">
                {NAV_LINKS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center rounded-xl text-sm font-semibold transition-all ${
                        sidebarCollapsed
                          ? 'w-10 h-10 mx-auto justify-center group-hover:w-full group-hover:h-auto group-hover:justify-between group-hover:px-3 group-hover:py-2.5'
                          : 'justify-between px-3 py-2.5 gap-2.5'
                      } ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <div className={`flex items-center ${
                        sidebarCollapsed
                          ? 'justify-center group-hover:justify-start group-hover:gap-2.5 min-w-0 group-hover:flex-1'
                          : 'gap-2.5 min-w-0 flex-1 mr-1.5'
                      }`}>
                        <span className={`${isActive ? 'text-white' : 'text-slate-400'} shrink-0 flex items-center justify-center`}>
                          <NavIcon name={item.icon} />
                        </span>
                        <span className={`text-sm leading-tight truncate ${sidebarCollapsed ? 'hidden group-hover:inline' : 'inline'}`}>
                          {t(item.key, item.defaultLabel)}
                        </span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-md font-bold shrink-0 ml-1.5 whitespace-nowrap ${
                            sidebarCollapsed ? 'hidden group-hover:inline-block' : 'inline-block'
                          } ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {item.badge === 'Core' ? t('badge.core', 'Core') : item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              {/* Demo Launcher */}
              <div className={`mt-4 p-3.5 rounded-xl bg-slate-800/90 border border-slate-700/80 whitespace-nowrap transition-opacity duration-200 ${
                sidebarCollapsed ? 'opacity-0 group-hover:opacity-100 hidden group-hover:block' : 'opacity-100 block'
              }`}>
                <p className="text-xs uppercase font-bold text-amber-400 tracking-wider">{t('fast.demo', 'Fast Demonstration')}</p>
                <p className="text-xs text-slate-300 mt-0.5 leading-normal">{t('demo.desc', 'Evaluate clearances & subsidies.')}</p>
                <Link
                  href="/assess?demo=textile"
                  onClick={() => setSidebarOpen(false)}
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                >
                  <span>{t('launch.demo', 'Launch Demo')}</span>
                </Link>
              </div>

              <div className={`pt-3 border-t border-slate-800/80 px-2 mt-3 whitespace-nowrap ${
                sidebarCollapsed ? 'hidden group-hover:block' : 'block'
              }`}>
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>{t('kb.corpus', 'Corpus')}</span>
                  <span className="font-mono text-amber-400 font-bold">{t('corpus.grounded', 'Grounded')}</span>
                </div>
                <div className="mt-1 space-y-0.5 text-xs text-slate-400">
                  <p>• 478 {t('res.documents_tab', 'Documents')}</p>
                  <p>• 1,279 {t('kb.rules', 'Rules')}</p>
                  <p>• 186 {t('res.forms_tab', 'Forms')}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-10 md:hidden"
          />
        )}

        {/* Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 outline-none focus:ring-2 focus:ring-blue-500/30 rounded-2xl transition-all"
        >
          {children}
        </main>
      </div>

      {/* Clean Footer */}
      <footer className="w-full bg-white border-t border-slate-200 mt-auto py-3.5 px-6 text-center text-xs text-slate-500">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>{t('footer.copyright', '© 2026 Unified Industrial Approval System · Directorate of Industries, Govt. of Maharashtra')}</p>
          <p className="text-slate-400">{t('footer.rule_engine', 'Deterministic Rule Engine · Grounded in Verified State Gazettes & MAITRI Rules')}</p>
        </div>
      </footer>

      {/* Floating AI Support & Live Agent Widget */}
      <AiSupportWidget />
    </div>
  );
}
