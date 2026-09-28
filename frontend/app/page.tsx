'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { AssessmentResponse } from '@/types';
import { getDbHealth } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

function HighwayPhaseIcon({ phase }: { phase: string }) {
  switch (phase) {
    case 'Phase 01':
      return (
        <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      );
    case 'Phase 02':
      return (
        <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'Phase 03':
      return (
        <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'Phase 04':
      return (
        <svg className="w-5 h-5 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.5 4.5H6.5h3a4 4 0 010 8H6.5m3 0 5 8M6.5 8.5h11" />
        </svg>
      );
    default:
      return null;
  }
}

export default function DashboardHome() {
  const { t } = useLanguage();
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
              {t('dash.hero_badge', 'Maharashtra Single Window Portal')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {t('dash.hero_title', 'Industrial Clearance Engine')}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {t('dash.hero_sub', 'Instant statutory approvals identification, department routing, and state subsidy calculations.')}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/assess?demo=textile"
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-blue-900/50 hover:scale-102"
            >
              {t('dash.try_demo', 'Try Demo →')}
            </Link>
            <Link
              href="/assess"
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-sm border border-slate-700 transition-all hover:scale-102"
            >
              {t('dash.new_project', '+ New Project')}
            </Link>
          </div>
        </div>

        {/* Industry Demo Presets */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{t('dash.quick_demo', 'Quick Demo Profiles')}</p>
              <p className="text-slate-500 text-xs mt-0.5">{t('dash.quick_demo_sub', 'Test clearances with pre-configured project templates.')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/assess?demo=textile"
              className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-emerald-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16M7 4v16M12 4v16M17 4v16" />
              </svg>
              <span>{t('sector.Textile', 'Textile Unit')}</span>
            </Link>
            <Link
              href="/assess?demo=ev"
              className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-blue-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{t('sector.EV / Automotive', 'EV Assembly')}</span>
            </Link>
          </div>
        </div>

        {/* The Maharashtra Clearance Highway - Visual 4-Stage Pathway */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <p className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19L8.5 5h7L20 19M4 19h16M12 7v2m0 3v2m0 3v2" />
                </svg>
                <span>{t('dash.highway_title', 'The Maharashtra Industrial Clearance Highway')}</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{t('dash.highway_sub', 'End-to-end statutory clearance sequencing under MAITRI Single Window Act')}</p>
            </div>
            <Link
              href="/assess"
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>{t('dash.launch_studio', 'Launch Studio')}</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {[
              {
                step: 'Phase 01',
                title: t('dash.phase1_title', 'Planning & Site'),
                desc: t('dash.phase1_desc', 'MPCB CTE consent for red/orange industry classification.'),
                days: '30-45d',
                badge: 'Environment',
                badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              },
              {
                step: 'Phase 02',
                title: t('dash.phase2_title', 'Land & Civil'),
                desc: t('dash.phase2_desc', 'MIDC land lease, water quota & building sanctions.'),
                days: '15-30d',
                badge: 'Utilities',
                badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200',
              },
              {
                step: 'Phase 03',
                title: t('dash.phase3_title', 'Safety & Power'),
                desc: t('dash.phase3_desc', 'DISH factory safety, CEIG power & Fire NOC.'),
                days: '15-20d',
                badge: 'Licensing',
                badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
              },
              {
                step: 'Phase 04',
                title: t('dash.phase4_title', 'Operation & Subsidies'),
                desc: t('dash.phase4_desc', 'Consent to Operate (CTO) + PSI-2019 subsidies.'),
                days: 'Fiscal',
                badge: 'Subsidies',
                badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200',
              },
            ].map((p, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all hover:shadow-md group">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center">
                    <HighwayPhaseIcon phase={p.step} />
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">{p.step}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{p.title}</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{p.desc}</p>
                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${p.badgeStyle}`}>
                    {p.badge}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{p.days}</span>
                  </span>
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
                    {t('dash.active_profile', 'Active Project Profile')}
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
                  {t('sector.' + assessment.project_summary.sector, assessment.project_summary.sector)} · {t('stage.' + assessment.project_summary.stage, assessment.project_summary.stage)} · {t('assess.district', 'District')}: {assessment.project_summary.district || 'All Maharashtra'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 self-start md:self-auto">
                <Link
                  href="/assess"
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-sm text-center w-full sm:w-auto"
                >
                  Edit Company Details & Re-run Assessment
                </Link>
                <Link
                  href="/results"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-sm text-center w-full sm:w-auto"
                >
                  {t('dash.view_report', 'View Assessment Report →')}
                </Link>
              </div>
            </div>

            {/* Assessment Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-bold uppercase">{t('dash.req_approvals', 'Required Approvals')}</span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">
                  {assessment.approvals.length} <span className="text-xs font-normal text-slate-500">{t('dash.clearances_unit', 'clearances')}</span>
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-bold uppercase">{t('dash.state_incentives', 'State Incentives')}</span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">
                  {assessment.incentives.length + assessment.applicable_policies.length} <span className="text-xs font-normal text-slate-500">{t('dash.schemes_unit', 'schemes')}</span>
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-bold uppercase">{t('dash.req_documents', 'Required Documents')}</span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">
                  {assessment.documents_required.length} <span className="text-xs font-normal text-slate-500">{t('dash.files_unit', 'files')}</span>
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 font-bold uppercase">{t('dash.gov_sources', 'Government Sources')}</span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">
                  {assessment.sources.length} <span className="text-xs font-normal text-slate-500">{t('dash.citations_unit', 'citations')}</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center py-10">
            <h3 className="text-base font-bold text-slate-900">{t('dash.no_assessment', 'No Assessment Profile Evaluated Yet')}</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-1 mb-5">
              {t('dash.no_assess_sub', 'Enter your enterprise project details or load a verified demonstration profile to evaluate statutory clearances.')}
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/assess?demo=textile"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs"
              >
                {t('dash.try_demo_assess', 'Try Demo Assessment')}
              </Link>
              <Link
                href="/assess"
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-colors"
              >
                {t('dash.start_new_profile', 'Start New Project Profile')}
              </Link>
            </div>
          </div>
        )}

        {/* Regulatory Knowledge Base Statistics */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              <span>{t('dash.kb_title', 'Maharashtra Policy & Regulatory Knowledge Base')}</span>
            </h2>
            <Link href="/knowledge" className="text-xs sm:text-sm text-blue-600 hover:underline font-bold flex items-center gap-1">
              <span>{t('dash.view_repo', 'View Repository')}</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('dash.gov_docs', 'Government Docs')}</span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100/70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900">{dbStats.documents}</p>
              <p className="text-xs text-slate-500 mt-1">{t('dash.official_grs', 'Official GRs, Acts & Rules')}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('kb.rules', 'Canonical Rules')}</span>
                <span className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900">{dbStats.canonical_rules.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">{t('kb.deterministic_eval', 'Deterministic rule logic')}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('kb.forms', 'Extracted Forms')}</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100/70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900">{dbStats.form_requirements}</p>
              <p className="text-xs text-slate-500 mt-1">{t('kb.prescribed_statutory', 'Prescribed statutory forms')}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('dash.evidence_chunks', 'Evidence Chunks')}</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100/70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900">{dbStats.chunks.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">{t('dash.direct_citations', 'Direct page citations')}</p>
            </div>
          </div>
        </div>

        {/* Navigation Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <Link href="/approvals" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-blue-100">
              <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
              {t('dash.mod_approvals', 'Approvals & Statutory Clearances')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              {t('dash.mod_approvals_sub', 'MAITRI Single Window, MPCB Environmental Consent, DISH Factory Plan, and MIDC land permissions.')}
            </p>
            <div className="mt-4 text-xs sm:text-sm font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>{t('dash.mod_approvals_cta', 'View Clearance Catalogue')}</span>
              <span>→</span>
            </div>
          </Link>

          <Link href="/incentives" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-emerald-100">
              <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.5 4.5H6.5h3a4 4 0 010 8H6.5m3 0 5 8M6.5 8.5h11" />
              </svg>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
              {t('dash.mod_incentives', 'Incentives & State Schemes')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              {t('dash.mod_incentives_sub', 'Package Scheme of Incentives (PSI-2019), Textile Policy 2023-28, EV Policy 2021, and ESDM subsidies.')}
            </p>
            <div className="mt-4 text-xs sm:text-sm font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>{t('dash.mod_incentives_cta', 'Explore State Schemes')}</span>
              <span>→</span>
            </div>
          </Link>

          <Link href="/forms" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-indigo-100">
              <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
              {t('dash.mod_forms', 'Government Forms Repository')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              {t('dash.mod_forms_sub', 'Browse 186 extracted prescribed statutory forms, undertakings, affidavits, and submission modes.')}
            </p>
            <div className="mt-4 text-xs sm:text-sm font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>{t('dash.mod_forms_cta', 'Browse 186 Forms')}</span>
              <span>→</span>
            </div>
          </Link>

        </div>

      </div>
    </AppLayout>
  );
}
