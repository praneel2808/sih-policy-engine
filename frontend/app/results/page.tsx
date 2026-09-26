'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { AssessmentResponse, FormRequirement, SourceEvidence } from '@/types';
import { getForms } from '@/lib/api';
import SourceModal from '@/components/SourceModal';

/* ─── Helpers ─────────────────────────────────────────────── */
function formatInr(val?: number | null): string {
  if (!val) return '—';
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Cr`;
  if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

const STATUS_META: Record<string, { bg: string; dot: string; label: string }> = {
  potentially_applicable: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-500', label: 'Applicable' },
  required:               { bg: 'bg-blue-50 border-blue-200 text-blue-800',           dot: 'bg-blue-500',    label: 'Required' },
  potentially_required:   { bg: 'bg-amber-50 border-amber-200 text-amber-800',        dot: 'bg-amber-400',   label: 'Pending' },
  not_applicable:         { bg: 'bg-slate-100 border-slate-200 text-slate-500',       dot: 'bg-slate-400',   label: 'N/A' },
  insufficient_evidence:  { bg: 'bg-slate-100 border-slate-200 text-slate-500',       dot: 'bg-slate-400',   label: 'Verify' },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { bg: 'bg-slate-100 border-slate-200 text-slate-500', dot: 'bg-slate-400', label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${m.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function FormTypeBadge({ type }: { type?: string }) {
  if (!type) return null;
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 uppercase tracking-wider">
      {type.replace(/_/g, ' ')}
    </span>
  );
}

/* Department icon map */
const DEPT_ICONS: Record<string, string> = {
  environment: '🌿', pollution: '🌿', pcb: '🌿',
  fire: '🔥', safety: '🔥',
  factory: '🏭', labour: '👷', employment: '👷',
  electricity: '⚡', power: '⚡', msedcl: '⚡',
  water: '💧', groundwater: '💧', irrigation: '💧',
  land: '🗺️', revenue: '🗺️', talati: '🗺️',
  municipal: '🏛️', corporation: '🏛️', council: '🏛️',
  gst: '💼', tax: '💼', revenue_dept: '💼',
  fssai: '🍽️', food: '🍽️',
  drug: '💊', pharmacy: '💊',
  building: '🏗️', construction: '🏗️', plan: '🏗️',
};

function deptIcon(authority: string): string {
  const lower = authority.toLowerCase();
  for (const [key, icon] of Object.entries(DEPT_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '📋';
}

/* ─── TABS CONFIG ─────────────────────────────────────────── */
type Tab = 'all' | 'approvals' | 'incentives' | 'documents' | 'forms' | 'sources';

/* ─── MAIN PAGE ───────────────────────────────────────────── */
export default function ResultsPage() {
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [forms, setForms] = useState<FormRequirement[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceEvidence | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  useEffect(() => {
    const raw = localStorage.getItem('smsws_assessment');
    const demo = localStorage.getItem('smsws_demo');
    if (raw) {
      try { setAssessment(JSON.parse(raw)); } catch { /* ignore */ }
    }
    setIsDemo(demo === '1');
  }, []);

  useEffect(() => {
    if (!assessment) return;
    setFormsLoading(true);
    getForms(assessment.project_summary.sector)
      .then(setForms)
      .catch(() => setForms([]))
      .finally(() => setFormsLoading(false));
  }, [assessment]);

  /* ── Empty state ── */
  if (!assessment) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-4xl shadow-inner">
            📄
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900">No Assessment Report Found</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Submit an industrial project profile or launch a demo to view your clearance dossier.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/assess?demo=textile"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-200"
            >
              🧵 Try Textile Demo
            </Link>
            <Link
              href="/assess"
              className="px-5 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm rounded-xl transition-all"
            >
              New Assessment
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const s = assessment.project_summary;
  const totalIncentives = assessment.incentives.length + assessment.applicable_policies.length;

  const TABS: { id: Tab; icon: string; label: string; count: number | string }[] = [
    { id: 'all',        icon: '⚡', label: 'Overview',   count: '' },
    { id: 'approvals',  icon: '🏛️', label: 'Approvals',  count: assessment.approvals.length },
    { id: 'incentives', icon: '💰', label: 'Incentives', count: totalIncentives },
    { id: 'documents',  icon: '📎', label: 'Documents',  count: assessment.documents_required.length },
    { id: 'forms',      icon: '📋', label: 'Forms',      count: forms.length || '…' },
    { id: 'sources',    icon: '🔗', label: 'Evidence',   count: assessment.sources.length },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* ── HERO HEADER ─────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-6 shadow-xl">
          {/* Decorative circles */}
          <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-indigo-500/10 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-blue-500/10 translate-y-1/2" />

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3 relative">
            <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/assess" className="hover:text-white transition-colors">Assessment Studio</Link>
            <span>/</span>
            <span className="text-slate-300 font-semibold">Clearance Report</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 relative">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <img
                  src="/maharashtra-emblem.png"
                  alt="Maharashtra State Emblem"
                  className="w-8 h-8 object-contain shrink-0"
                />
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {s.entity_name || 'Industrial Enterprise'}
                </h1>
                {isDemo && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    DEMO
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">
                Clearance Dossier · {s.sector} · {s.stage}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/assess"
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl transition-all backdrop-blur-sm"
              >
                ← Edit Profile
              </Link>
              <Link
                href="/assess?demo=textile"
                className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-900"
              >
                🧵 Demo
              </Link>
            </div>
          </div>

          {/* Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 relative">
            {[
              { icon: '🏛️', val: assessment.approvals.length, label: 'Clearances', color: 'from-blue-600/30 to-blue-500/10 border-blue-500/30' },
              { icon: '💰', val: totalIncentives,              label: 'Incentive Schemes', color: 'from-emerald-600/30 to-emerald-500/10 border-emerald-500/30' },
              { icon: '📎', val: assessment.documents_required.length, label: 'Documents', color: 'from-amber-600/30 to-amber-500/10 border-amber-500/30' },
              { icon: '🔗', val: assessment.sources.length,   label: 'Policy Citations', color: 'from-indigo-600/30 to-indigo-500/10 border-indigo-500/30' },
            ].map(({ icon, val, label, color }) => (
              <div key={label} className={`rounded-xl bg-gradient-to-br ${color} border p-3 backdrop-blur-sm`}>
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-2xl font-black text-white">{val}</div>
                <div className="text-[11px] text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PROJECT PROFILE STRIP ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Evaluated Profile</p>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200">
              MAITRI-EVAL-2026
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {[
              { label: 'Sector', val: s.sector, accent: 'text-blue-700' },
              { label: 'Lifecycle Stage', val: s.stage, accent: 'text-slate-900' },
              { label: 'District', val: s.district || 'All Maharashtra', accent: 'text-slate-900' },
              { label: 'Location Type', val: s.location_type || 'General', accent: 'text-slate-900' },
              { label: 'Investment', val: formatInr(s.investment_inr), accent: 'text-emerald-700' },
              { label: 'Employment', val: s.employment_expected ? `${s.employment_expected} persons` : '—', accent: 'text-slate-900' },
              { label: 'Constitution', val: s.entity_type, accent: 'text-slate-900' },
              { label: 'Clearances', val: `${assessment.approvals.length} identified`, accent: 'text-indigo-700' },
            ].map(({ label, val, accent }) => (
              <div key={label} className="bg-slate-50 rounded-xl border border-slate-100 px-3 py-2.5">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{label}</p>
                <p className={`font-bold truncate ${accent}`}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── WARNINGS ────────────────────────────────────────── */}
        {assessment.warnings.length > 0 && (
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <span className="text-xl shrink-0">⚠️</span>
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold text-[11px] uppercase tracking-wider">Evaluation Notices</p>
              {assessment.warnings.map((w, idx) => (
                <p key={idx}>• {w}</p>
              ))}
            </div>
          </div>
        )}

        {/* ── ICON TABS ────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== '' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════
            MODULE 1 · APPROVALS
        ══════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'approvals') && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏛️</span>
                <h2 className="font-bold text-slate-900 text-sm">Statutory Approvals &amp; Clearances</h2>
              </div>
              <span className="text-[11px] bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full border border-blue-200">
                {assessment.approvals.length} Required
              </span>
            </div>

            <div className="p-6">
              {assessment.approvals.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm font-semibold">No specific approvals triggered</p>
                  <p className="text-xs mt-1">Your profile may qualify for simplified clearance.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assessment.approvals.map((appr, i) => (
                    <div
                      key={i}
                      className="group border border-slate-200 hover:border-slate-300 rounded-2xl p-4 bg-white hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">
                          {deptIcon(appr.authority || appr.name)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                            <h3 className="font-bold text-slate-900 text-sm leading-tight">{appr.name}</h3>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={appr.status} />
                              <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                                {appr.stage}
                              </span>
                            </div>
                          </div>

                          {appr.authority && (
                            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                              <span className="font-semibold text-slate-700">{appr.authority}</span>
                            </p>
                          )}

                          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {appr.reason}
                          </p>

                          {appr.evidence && appr.evidence.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2 items-center">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Policy Source:</span>
                              {appr.evidence.map((ev) => (
                                <button
                                  key={ev.chunk_id}
                                  onClick={() => setSelectedSource(ev)}
                                  className="text-[11px] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-2.5 py-1 text-indigo-700 font-medium transition-colors flex items-center gap-1"
                                >
                                  🔗 {ev.filename.replace(/^MH_/, '')} · p.{ev.page_start}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            MODULE 2 · INCENTIVES
        ══════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'incentives') && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">💰</span>
                <h2 className="font-bold text-slate-900 text-sm">State Incentives &amp; Policy Schemes</h2>
              </div>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                {totalIncentives} Pathways
              </span>
            </div>

            <div className="p-6 space-y-6">
              {/* Policy Frameworks */}
              {assessment.applicable_policies.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    📜 Governing Policy Frameworks
                  </p>
                  <div className="space-y-3">
                    {assessment.applicable_policies.map((p, i) => (
                      <div key={i} className="border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 bg-white transition-all hover:shadow-sm">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{p.reason}</p>
                        {p.evidence && p.evidence.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2 items-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Source:</span>
                            {p.evidence.map((ev) => (
                              <button
                                key={ev.chunk_id}
                                onClick={() => setSelectedSource(ev)}
                                className="text-[11px] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-2.5 py-1 text-indigo-700 font-medium transition-colors"
                              >
                                🔗 {ev.filename.replace(/^MH_/, '')} · p.{ev.page_start}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specific Subsidies */}
              {assessment.incentives.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    🏷️ Subsidies &amp; Benefits
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {assessment.incentives.map((inc, i) => (
                      <div key={i} className="relative border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 bg-white transition-all hover:shadow-md overflow-hidden group">
                        {/* accent strip */}
                        <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">{inc.name}</h4>
                          <StatusBadge status={inc.status} />
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{inc.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalIncentives === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-3xl mb-2">💼</div>
                  <p className="text-sm font-semibold">No incentive schemes identified</p>
                  <p className="text-xs mt-1">Refine your sector/location/investment profile to unlock incentives.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            MODULE 3 · DOCUMENTS
        ══════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'documents') && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">📎</span>
                <h2 className="font-bold text-slate-900 text-sm">Mandatory Document Checklist</h2>
              </div>
              <span className="text-[11px] bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full border border-amber-200">
                {assessment.documents_required.length} Required
              </span>
            </div>

            <div className="p-6">
              {assessment.documents_required.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-3xl mb-2">📂</div>
                  <p className="text-sm">No additional documents identified.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {assessment.documents_required.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm shrink-0 group-hover:bg-amber-200 transition-colors">
                        ✓
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{doc}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Required for statutory filing</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            MODULE 4 · FORMS
        ══════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'forms') && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <h2 className="font-bold text-slate-900 text-sm">Prescribed Government Forms</h2>
              </div>
              <span className="text-[11px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full border border-indigo-200">
                {forms.length} Mapped
              </span>
            </div>

            <div className="p-6">
              {formsLoading ? (
                <div className="flex items-center gap-3 py-6 text-slate-500 text-xs">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  Querying form requirements…
                </div>
              ) : forms.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 text-center p-8">
                  <div className="text-3xl mb-2">🗂️</div>
                  <p className="text-sm font-semibold text-slate-700">No mapped forms in knowledge base</p>
                  <p className="text-xs text-slate-400 mt-1">Forms will be designated upon departmental routing.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {forms.slice(0, 15).map((f) => (
                    <div key={f.form_requirement_id} className="border border-slate-200 hover:border-indigo-200 rounded-2xl p-4 bg-white transition-all hover:shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{f.form_name}</p>
                          {f.form_number && (
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">Form № {f.form_number}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <FormTypeBadge type={f.form_type} />
                          {f.required && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                              {f.required}
                            </span>
                          )}
                        </div>
                      </div>

                      {f.condition && (
                        <p className="text-xs text-slate-600 mb-2">
                          <span className="font-semibold text-slate-700">Condition:</span> {f.condition}
                        </p>
                      )}

                      {f.evidence_text && (
                        <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2 mb-2">
                          &ldquo;{f.evidence_text}&rdquo;
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        {f.filename && (
                          <span>📄 {f.filename} {f.page_start && `(p.${f.page_start})`}</span>
                        )}
                        {f.submission_method && (
                          <span>📮 {f.submission_method}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {forms.length > 15 && (
                    <div className="text-center pt-2">
                      <Link href="/forms" className="text-xs text-blue-600 hover:text-blue-500 font-bold hover:underline">
                        View all {forms.length} forms in Forms Repository →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            MODULE 5 · EVIDENCE CITATIONS
        ══════════════════════════════════════════════════════ */}
        {(activeTab === 'all' || activeTab === 'sources') && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔗</span>
                <h2 className="font-bold text-slate-900 text-sm">Grounded Policy Evidence</h2>
              </div>
              <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full border border-slate-200">
                {assessment.sources.length} Citations
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              {assessment.sources.map((src, idx) => (
                <div key={src.chunk_id} className="border border-slate-200 hover:border-indigo-200 rounded-2xl p-4 bg-white transition-all hover:shadow-md group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{src.filename.replace(/^MH_/, '')}</p>
                        <p className="text-[11px] text-slate-400">
                          p.{src.page_start === src.page_end ? src.page_start : `${src.page_start}–${src.page_end}`}
                          {src.section_reference ? ` · §${src.section_reference}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSource(src)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 text-[11px] font-semibold rounded-lg transition-all shrink-0"
                    >
                      View →
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3 leading-relaxed">
                    {src.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── DISCLAIMER ──────────────────────────────────────── */}
        <div className="flex gap-3 bg-slate-100 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600">
          <span className="text-base shrink-0">⚖️</span>
          <div>
            <p className="font-bold text-slate-800 mb-0.5">Statutory Advisory Note</p>
            <p className="leading-relaxed">{assessment.disclaimer}</p>
          </div>
        </div>

      </div>

      <SourceModal source={selectedSource} onClose={() => setSelectedSource(null)} />
    </AppLayout>
  );
}
