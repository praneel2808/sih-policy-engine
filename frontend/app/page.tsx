'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { AssessmentResponse } from '@/types';
import { getDbHealth } from '@/lib/api';

export default function DashboardHome() {
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [dbStats, setDbStats] = useState({
    documents: 478,
    canonical_rules: 1279,
    form_requirements: 186,
    chunks: 7426,
  });

  useEffect(() => {
    const raw = localStorage.getItem('smsws_assessment');
    const demo = localStorage.getItem('smsws_demo');
    if (raw) {
      try {
        setAssessment(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
    setIsDemo(demo === '1');

    getDbHealth()
      .then((res) => {
        if (res && res.documents) {
          setDbStats({
            documents: res.documents,
            canonical_rules: res.canonical_rules,
            form_requirements: res.form_requirements,
            chunks: res.chunks,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-10 text-white border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-3.5 max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 text-amber-300 text-xs font-bold uppercase tracking-wider border border-slate-700">
              <img
                src="/maharashtra-emblem.png"
                alt="Maharashtra Emblem"
                className="w-5 h-5 object-contain inline-block"
              />
              Maharashtra Single Window Portal
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Industrial Clearance Engine
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Instant statutory approvals identification, department routing, and state subsidy calculations.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/assess?demo=textile"
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-blue-900/50 hover:scale-102"
            >
              Try Demo →
            </Link>
            <Link
              href="/assess"
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-sm border border-slate-700 transition-all hover:scale-102"
            >
              + New Project
            </Link>
          </div>
        </div>

        {/* Industry Demo Presets */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold shrink-0">
              ⚡
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Quick Demo Profiles</p>
              <p className="text-slate-500 text-xs mt-0.5">Test clearances with pre-configured project templates.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/assess?demo=textile"
              className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition-all flex items-center gap-2"
            >
              <span className="text-base">🧵</span>
              <span>Textile Unit</span>
            </Link>
            <Link
              href="/assess?demo=ev"
              className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition-all flex items-center gap-2"
            >
              <span className="text-base">🚗</span>
              <span>EV Assembly</span>
            </Link>
          </div>
        </div>

        {/* The Maharashtra Clearance Highway - Visual 4-Stage Pathway */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <p className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="text-lg">🛣️</span>
                <span>The Maharashtra Industrial Clearance Highway</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">End-to-end statutory clearance sequencing under MAITRI Single Window Act</p>
            </div>
            <Link
              href="/assess"
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Launch Studio</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {[
              {
                step: 'Phase 01',
                title: 'Planning & Site',
                desc: 'MPCB CTE consent for red/orange industry classification.',
                days: '30-45d',
                icon: '🌱',
                badge: 'Environment',
                badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              },
              {
                step: 'Phase 02',
                title: 'Land & Civil',
                desc: 'MIDC land lease, water quota & building sanctions.',
                days: '15-30d',
                icon: '🏗️',
                badge: 'Utilities',
                badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
              },
              {
                step: 'Phase 03',
                title: 'Safety & Power',
                desc: 'DISH factory safety, CEIG power & Fire NOC.',
                days: '15-20d',
                icon: '⚡',
                badge: 'Licensing',
                badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
              },
              {
                step: 'Phase 04',
                title: 'Operation & Subsidies',
                desc: 'Consent to Operate (CTO) + PSI-2019 subsidies.',
                days: 'Fiscal',
                icon: '💰',
                badge: 'Subsidies',
                badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
              },
            ].map((p, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all hover:shadow-md group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">{p.icon}</span>
                  <span className="text-xs font-mono font-bold text-slate-400">{p.step}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{p.title}</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{p.desc}</p>
                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${p.badgeStyle}`}>
                    {p.badge}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">⏱️ {p.days}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Assessment Status */}
        {assessment ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    Active Project Profile
                  </span>
                  {isDemo && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Demo Data
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  {assessment.project_summary.entity_name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {assessment.project_summary.sector} · {assessment.project_summary.stage} · District: {assessment.project_summary.district || 'All Maharashtra'}
                </p>
              </div>

              <Link
                href="/results"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors self-start md:self-auto shadow-sm"
              >
                View Assessment Report →
              </Link>
            </div>

            {/* Assessment Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-bold uppercase">Required Approvals</span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">
                  {assessment.approvals.length} <span className="text-xs font-normal text-slate-500">clearances</span>
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-bold uppercase">State Incentives</span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">
                  {assessment.incentives.length + assessment.applicable_policies.length} <span className="text-xs font-normal text-slate-500">schemes</span>
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-bold uppercase">Required Documents</span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">
                  {assessment.documents_required.length} <span className="text-xs font-normal text-slate-500">files</span>
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-bold uppercase">Government Sources</span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">
                  {assessment.sources.length} <span className="text-xs font-normal text-slate-500">citations</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center py-10">
            <h3 className="text-base font-bold text-slate-900">No Assessment Profile Evaluated Yet</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-1 mb-5">
              Enter your enterprise project details or load a verified demonstration profile to evaluate statutory clearances.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/assess?demo=textile"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs"
              >
                Try Demo Assessment
              </Link>
              <Link
                href="/assess"
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-colors"
              >
                Start New Project Profile
              </Link>
            </div>
          </div>
        )}

        {/* Regulatory Knowledge Base Statistics */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <span className="text-base">🏛️</span>
              <span>Maharashtra Policy &amp; Regulatory Knowledge Base</span>
            </h2>
            <Link href="/knowledge" className="text-xs sm:text-sm text-blue-600 hover:underline font-bold flex items-center gap-1">
              <span>View Repository</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Government Docs</span>
                <span className="text-xl">📜</span>
              </div>
              <p className="text-3xl font-black text-slate-900">{dbStats.documents}</p>
              <p className="text-xs text-slate-500 mt-1">Official GRs, Acts &amp; Rules</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Canonical Rules</span>
                <span className="text-xl">⚙️</span>
              </div>
              <p className="text-3xl font-black text-slate-900">{dbStats.canonical_rules.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">Deterministic rule logic</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Extracted Forms</span>
                <span className="text-xl">📋</span>
              </div>
              <p className="text-3xl font-black text-slate-900">{dbStats.form_requirements}</p>
              <p className="text-xs text-slate-500 mt-1">Prescribed statutory forms</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evidence Chunks</span>
                <span className="text-xl">🔍</span>
              </div>
              <p className="text-3xl font-black text-slate-900">{dbStats.chunks.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">Direct page citations</p>
            </div>
          </div>
        </div>

        {/* Navigation Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <Link href="/approvals" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
              🏛️
            </div>
            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
              Approvals &amp; Statutory Clearances
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              MAITRI Single Window, MPCB Environmental Consent, DISH Factory Plan, and MIDC land permissions.
            </p>
            <div className="mt-4 text-xs sm:text-sm font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>View Clearance Catalogue</span>
              <span>→</span>
            </div>
          </Link>

          <Link href="/incentives" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
              💰
            </div>
            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
              Incentives &amp; State Schemes
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Package Scheme of Incentives (PSI-2019), Textile Policy 2023-28, EV Policy 2021, and ESDM subsidies.
            </p>
            <div className="mt-4 text-xs sm:text-sm font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Explore State Schemes</span>
              <span>→</span>
            </div>
          </Link>

          <Link href="/forms" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
              📋
            </div>
            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
              Government Forms Repository
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Browse 186 extracted prescribed statutory forms, undertakings, affidavits, and submission modes.
            </p>
            <div className="mt-4 text-xs sm:text-sm font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Browse 186 Forms</span>
              <span>→</span>
            </div>
          </Link>

        </div>

      </div>
    </AppLayout>
  );
}
