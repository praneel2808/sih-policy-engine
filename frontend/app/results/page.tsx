'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { AssessmentResponse, FormRequirement, SourceEvidence } from '@/types';
import { getForms } from '@/lib/api';
import SourceModal from '@/components/SourceModal';

function formatInr(val?: number | null): string {
  if (!val) return '—';
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Crore`;
  if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} Lakh`;
  return `₹${val.toLocaleString('en-IN')}`;
}

function statusBadge(status: string): React.ReactNode {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    potentially_applicable: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', label: 'Potentially Applicable' },
    required: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', label: 'Statutory Required' },
    potentially_required: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', label: 'Potentially Required' },
    not_applicable: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', label: 'Not Applicable' },
    insufficient_evidence: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', label: 'Needs Verification' },
  };
  const item = map[status] ?? { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', label: status };
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border ${item.bg} ${item.text}`}>
      {item.label}
    </span>
  );
}

function formTypeBadge(type?: string): React.ReactNode {
  if (!type) return null;
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-slate-50 text-slate-700 border-slate-200 uppercase tracking-wider">
      {type.replace(/_/g, ' ')}
    </span>
  );
}

export default function ResultsPage() {
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [forms, setForms] = useState<FormRequirement[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceEvidence | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'approvals' | 'incentives' | 'documents' | 'forms' | 'sources'>('all');

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
  }, []);

  useEffect(() => {
    if (!assessment) return;
    setFormsLoading(true);
    getForms(assessment.project_summary.sector)
      .then(setForms)
      .catch(() => setForms([]))
      .finally(() => setFormsLoading(false));
  }, [assessment]);

  if (!assessment) {
    return (
      <AppLayout>
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-lg mx-auto my-12 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mt-2">No Assessment Report Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Submit an industrial project profile or launch a demo to view clearance results.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/assess?demo=textile"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl transition-colors shadow-xs"
            >
              Try Demo Project
            </Link>
            <Link
              href="/assess"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs rounded-xl transition-colors"
            >
              New Assessment
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const s = assessment.project_summary;

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-600">Dashboard</Link>
              <span>/</span>
              <Link href="/assess" className="hover:text-blue-600">Assessment</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Results Report</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Preliminary Assessment Report</span>
              {isDemo && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Demo Data
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic evaluation results based on Maharashtra State Industrial Policies and Single Window acts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/assess"
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors"
            >
              ← Edit Profile
            </Link>
            <Link
              href="/assess?demo=textile"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition-colors"
            >
              Demo: Textile
            </Link>
          </div>
        </div>

        {/* Project Summary Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Evaluated Enterprise Profile</h2>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
              MAITRI-EVAL-2026
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">Enterprise Name</p>
              <p className="font-bold text-slate-900 truncate mt-0.5">{s.entity_name}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">Industry Sector</p>
              <p className="font-bold text-blue-800 truncate mt-0.5">{s.sector}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">Lifecycle Stage</p>
              <p className="font-bold text-slate-900 truncate mt-0.5">{s.stage}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">District / Location</p>
              <p className="font-bold text-slate-900 truncate mt-0.5">{s.district || 'All Maharashtra'} · {s.location_type || 'General'}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">Proposed Investment</p>
              <p className="font-bold text-slate-900 truncate mt-0.5">{formatInr(s.investment_inr)}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">Expected Employment</p>
              <p className="font-bold text-slate-900 truncate mt-0.5">{s.employment_expected ? `${s.employment_expected} persons` : '—'}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">Constitution</p>
              <p className="font-bold text-slate-900 truncate mt-0.5">{s.entity_type}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase font-bold text-slate-400">Statutory Clearances</p>
              <p className="font-bold text-blue-900 truncate mt-0.5">{assessment.approvals.length} Clearances Identified</p>
            </div>
          </div>
        </div>

        {/* Notices */}
        {assessment.warnings.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
            <p className="font-bold text-[11px] uppercase tracking-wider">Evaluation Notices:</p>
            {assessment.warnings.map((w, idx) => (
              <p key={idx}>• {w}</p>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
          {[
            { id: 'all', label: 'All Modules' },
            { id: 'approvals', label: `Approvals (${assessment.approvals.length})` },
            { id: 'incentives', label: `Incentives (${assessment.incentives.length + assessment.applicable_policies.length})` },
            { id: 'documents', label: `Documents (${assessment.documents_required.length})` },
            { id: 'forms', label: `Forms (${forms.length})` },
            { id: 'sources', label: `Evidence Citations (${assessment.sources.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 bg-slate-50'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Module 1: Approvals */}
        {(activeTab === 'all' || activeTab === 'approvals') && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm">
                1. Statutory Approvals & Clearances Required
              </h2>
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                {assessment.approvals.length} Clearances
              </span>
            </div>

            <div className="p-6">
              {assessment.approvals.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No specific approvals triggered by current profile.</p>
              ) : (
                <div className="space-y-3.5">
                  {assessment.approvals.map((appr, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                        <h3 className="font-bold text-slate-900 text-sm">{appr.name}</h3>
                        <div className="flex items-center gap-2">
                          {statusBadge(appr.status)}
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">
                            {appr.stage}
                          </span>
                        </div>
                      </div>

                      {appr.authority && (
                        <p className="text-xs text-slate-500 mb-2">
                          Competent Authority: <span className="font-medium text-slate-800">{appr.authority}</span>
                        </p>
                      )}

                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {appr.reason}
                      </p>

                      {appr.evidence && appr.evidence.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 items-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Govt. Source:</span>
                          {appr.evidence.map((ev) => (
                            <button
                              key={ev.chunk_id}
                              onClick={() => setSelectedSource(ev)}
                              className="text-xs bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 transition-colors flex items-center gap-1.5"
                            >
                              <span className="font-mono text-[11px] truncate max-w-[200px]">
                                {ev.filename.replace(/^MH_/, '')}
                              </span>
                              <span className="text-slate-400">p.{ev.page_start}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Module 2: Incentives */}
        {(activeTab === 'all' || activeTab === 'incentives') && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm">
                2. Identified State Incentives & Policy Schemes
              </h2>
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                {assessment.incentives.length + assessment.applicable_policies.length} Pathways
              </span>
            </div>

            <div className="p-6 space-y-5">
              {assessment.applicable_policies.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                    Governing Policy Frameworks
                  </h3>
                  <div className="space-y-3">
                    {assessment.applicable_policies.map((p, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                          {statusBadge(p.status)}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{p.reason}</p>
                        {p.evidence && p.evidence.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Source:</span>
                            {p.evidence.map((ev) => (
                              <button
                                key={ev.chunk_id}
                                onClick={() => setSelectedSource(ev)}
                                className="text-xs bg-white hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700 transition-colors"
                              >
                                {ev.filename.replace(/^MH_/, '')} (p.{ev.page_start})
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assessment.incentives.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                    Specific Subsidies & Benefits
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {assessment.incentives.map((inc, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl p-4 bg-white">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-slate-900 text-sm">{inc.name}</h4>
                          {statusBadge(inc.status)}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{inc.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Module 3: Documents */}
        {(activeTab === 'all' || activeTab === 'documents') && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm">
                3. Mandatory Document Checklist
              </h2>
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                {assessment.documents_required.length} Required
              </span>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {assessment.documents_required.map((doc, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <span className="text-blue-600 font-bold text-xs mt-0.5">✓</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{doc}</p>
                      <p className="text-[11px] text-slate-500">Required for statutory filing</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Module 4: Forms */}
        {(activeTab === 'all' || activeTab === 'forms') && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm">
                4. Prescribed Government Forms & Undertakings
              </h2>
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                {forms.length} Mapped Forms
              </span>
            </div>

            <div className="p-6">
              {formsLoading ? (
                <div className="text-xs text-slate-500 py-4">Querying form requirements from database…</div>
              ) : forms.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <p className="text-xs font-semibold text-slate-700">
                    No mapped form found in current knowledge base.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Forms will be designated upon departmental single-window routing.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {forms.slice(0, 15).map((f) => (
                    <div key={f.form_requirement_id} className="border border-slate-200 rounded-xl p-4 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1.5">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{f.form_name}</p>
                          {f.form_number && (
                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">Form No: {f.form_number}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {formTypeBadge(f.form_type)}
                          {f.required && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded border bg-slate-50 text-slate-700 border-slate-200">
                              {f.required}
                            </span>
                          )}
                        </div>
                      </div>

                      {f.condition && (
                        <p className="text-xs text-slate-600 mb-1.5">
                          <strong>Condition:</strong> {f.condition}
                        </p>
                      )}

                      {f.evidence_text && (
                        <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2 mb-1.5">
                          &ldquo;{f.evidence_text}&rdquo;
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                        {f.filename && (
                          <span>
                            Gazette: {f.filename} {f.page_start && `(p.${f.page_start})`}
                          </span>
                        )}
                        {f.submission_method && (
                          <span>Mode: {f.submission_method}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {forms.length > 15 && (
                    <div className="text-center pt-2">
                      <Link href="/forms" className="text-xs text-blue-600 hover:underline font-semibold">
                        View all {forms.length} forms in Forms Repository →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Module 5: Evidence */}
        {(activeTab === 'all' || activeTab === 'sources') && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-sm">
                5. Grounded Government Policy Evidence
              </h2>
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                {assessment.sources.length} Grounded Citations
              </span>
            </div>

            <div className="p-6 space-y-3">
              {assessment.sources.map((src) => (
                <div key={src.chunk_id} className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{src.filename}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Page {src.page_start === src.page_end ? src.page_start : `${src.page_start}–${src.page_end}`}
                        {src.section_reference ? ` · §${src.section_reference}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedSource(src)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors shrink-0"
                    >
                      View Source →
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-3">
                    {src.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <div className="bg-slate-100 text-slate-600 rounded-2xl p-4 text-xs leading-relaxed border border-slate-200">
          <p className="font-semibold text-slate-800 mb-0.5">Statutory Advisory Note:</p>
          <p>{assessment.disclaimer}</p>
        </div>

      </div>

      <SourceModal source={selectedSource} onClose={() => setSelectedSource(null)} />
    </AppLayout>
  );
}
