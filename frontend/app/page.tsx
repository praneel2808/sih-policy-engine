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
        
        {/* Executive Hero Banner */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-semibold tracking-wider uppercase border border-slate-700">
                Government of Maharashtra · MAITRI Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Unified Industrial Approval System
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Automated statutory clearance identification, department routing, and state incentive discovery for industrial enterprises across Maharashtra.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/assess?demo=textile"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
            >
              Try Demo Project
            </Link>
            <Link
              href="/assess"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs border border-slate-700 transition-colors"
            >
              + New Assessment
            </Link>
          </div>
        </div>

        {/* Demo Selection Quick-Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900 text-xs">Demonstration Profiles Ready for Assessment</p>
            <p className="text-slate-500 text-[11px] mt-0.5">Evaluate pre-configured enterprise projects across statutory rules and state policies:</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/assess?demo=textile"
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs rounded-lg border border-slate-300 transition-colors"
            >
              Textile (Pune MIDC)
            </Link>
            <Link
              href="/assess?demo=ev"
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs rounded-lg border border-slate-300 transition-colors"
            >
              EV Manufacturing (Aurangabad)
            </Link>
          </div>
        </div>

        {/* Active Assessment Status */}
        {assessment ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    Active Project Profile
                  </span>
                  {isDemo && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      Demo Data
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {assessment.project_summary.entity_name}
                </h2>
                <p className="text-xs text-slate-500">
                  {assessment.project_summary.sector} · {assessment.project_summary.stage} · District: {assessment.project_summary.district || 'All Maharashtra'}
                </p>
              </div>

              <Link
                href="/results"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition-colors self-start md:self-auto"
              >
                View Assessment Report →
              </Link>
            </div>

            {/* Assessment Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Required Approvals</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {assessment.approvals.length} <span className="text-xs font-normal text-slate-500">clearances</span>
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">State Incentives</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {assessment.incentives.length + assessment.applicable_policies.length} <span className="text-xs font-normal text-slate-500">schemes</span>
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Required Documents</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {assessment.documents_required.length} <span className="text-xs font-normal text-slate-500">files</span>
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">Government Sources</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {assessment.sources.length} <span className="text-xs font-normal text-slate-500">citations</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 text-center py-8">
            <h3 className="text-sm font-bold text-slate-900">No Assessment Profile Evaluated Yet</h3>
            <p className="text-slate-500 text-xs max-w-md mx-auto mt-1 mb-4">
              Enter your enterprise project details or load a verified demonstration profile to evaluate statutory clearances.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/assess?demo=textile"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors"
              >
                Try Demo Assessment
              </Link>
              <Link
                href="/assess"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs rounded-xl transition-colors"
              >
                Start New Project Profile
              </Link>
            </div>
          </div>
        )}

        {/* Regulatory Knowledge Base Statistics */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Maharashtra Policy & Regulatory Knowledge Base
            </h2>
            <Link href="/knowledge" className="text-xs text-blue-600 hover:underline font-medium">
              View Repository →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Government Documents</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{dbStats.documents}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Official GRs, Acts & Rules</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Canonical Rules</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{dbStats.canonical_rules.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Deterministic rule logic</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Extracted Forms</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{dbStats.form_requirements}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Prescribed statutory forms</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Evidence Chunks</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{dbStats.chunks.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Direct page citations</p>
            </div>
          </div>
        </div>

        {/* Navigation Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <Link href="/approvals" className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-400 transition-colors group">
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
              Approvals & Statutory Clearances
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              MAITRI Single Window, MPCB Environmental Consent, DISH Factory Plan, and MIDC land permissions.
            </p>
            <div className="mt-3 text-xs font-semibold text-blue-600 flex items-center gap-1">
              <span>View Clearance Catalogue</span>
              <span>→</span>
            </div>
          </Link>

          <Link href="/incentives" className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-400 transition-colors group">
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
              Incentives & State Schemes
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Package Scheme of Incentives (PSI-2019), Textile Policy 2023-28, EV Policy 2021, and ESDM subsidies.
            </p>
            <div className="mt-3 text-xs font-semibold text-blue-600 flex items-center gap-1">
              <span>Explore State Schemes</span>
              <span>→</span>
            </div>
          </Link>

          <Link href="/forms" className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-400 transition-colors group">
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
              Government Forms Repository
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Browse 186 extracted prescribed statutory forms, undertakings, affidavits, and submission modes.
            </p>
            <div className="mt-3 text-xs font-semibold text-blue-600 flex items-center gap-1">
              <span>Browse 186 Forms</span>
              <span>→</span>
            </div>
          </Link>

        </div>

      </div>
    </AppLayout>
  );
}
