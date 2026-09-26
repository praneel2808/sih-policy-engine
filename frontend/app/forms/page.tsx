'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { FormRequirement } from '@/types';
import { getForms } from '@/lib/api';

function formTypeBadge(type?: string): React.ReactNode {
  if (!type) return null;
  const colors: Record<string, string> = {
    APPLICATION_FORM: 'bg-blue-50 text-blue-700 border-blue-200',
    PRESCRIBED_FORM: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ANNEXURE: 'bg-purple-50 text-purple-700 border-purple-200',
    UNDERTAKING: 'bg-orange-50 text-orange-700 border-orange-200',
    RETURN_REPORTING_FORM: 'bg-teal-50 text-teal-700 border-teal-200',
    AFFIDAVIT: 'bg-rose-50 text-rose-700 border-rose-200',
    PROFORMA: 'bg-amber-50 text-amber-700 border-amber-200',
    DECLARATION: 'bg-pink-50 text-pink-700 border-pink-200',
  };
  const cls = colors[type] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${cls}`}>
      {type.replace(/_/g, ' ')}
    </span>
  );
}

export default function FormsPage() {
  const [forms, setForms] = useState<FormRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    setLoading(true);
    const sector = sectorFilter === 'All' ? undefined : sectorFilter;
    getForms(sector)
      .then(setForms)
      .catch(() => setForms([]))
      .finally(() => setLoading(false));
  }, [sectorFilter]);

  const filteredForms = forms.filter((f) => {
    const matchesSearch =
      !search ||
      f.form_name.toLowerCase().includes(search.toLowerCase()) ||
      (f.form_number && f.form_number.toLowerCase().includes(search.toLowerCase())) ||
      (f.filename && f.filename.toLowerCase().includes(search.toLowerCase())) ||
      (f.rule_name && f.rule_name.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'All' || f.form_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-600">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Forms Repository</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Maharashtra Single Window Statutory Forms Repository
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              186 extracted application forms, undertakings, annexures, and proformas from Maharashtra Government Gazettes.
            </p>
          </div>

          <Link
            href="/assess"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0"
          >
            Find Forms For My Project →
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="w-full sm:w-80">
              <input
                type="text"
                placeholder="Search by form name, number, gazette…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>

            {/* Type selector */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {['All', 'APPLICATION_FORM', 'ANNEXURE', 'UNDERTAKING', 'PROFORMA', 'AFFIDAVIT'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    typeFilter === t
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Sector tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Sector:</span>
            {['All', 'Textile', 'EV', 'Electronics', 'IT', 'Chemical', 'Food', 'MSME', 'Labour'].map((sec) => (
              <button
                key={sec}
                onClick={() => setSectorFilter(sec)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  sectorFilter === sec
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>

        {/* Forms Listing */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-slate-900 text-sm">
              Extracted Government Form Requirements ({filteredForms.length})
            </h2>
            <span className="text-xs text-slate-400">Total in Knowledge Base: 186 Forms</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-12">
              <svg className="animate-spin w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Loading extracted government forms…</span>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-700">No mapped form found in current knowledge base.</p>
              <p className="text-[11px] text-slate-400 mt-1">Try clearing or adjusting your search filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredForms.map((f) => (
                <div key={f.form_requirement_id} className="border border-slate-200 rounded-xl p-4 hover:border-purple-300 transition-colors bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          REQ-{f.form_requirement_id}
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-sm">{f.form_name}</h3>
                      </div>
                      {f.form_number && (
                        <p className="text-xs font-mono text-purple-700 font-semibold mt-0.5">
                          Statutory Form Number: {f.form_number}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {formTypeBadge(f.form_type)}
                      {f.required && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          f.required.toUpperCase() === 'MANDATORY'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {f.required}
                        </span>
                      )}
                    </div>
                  </div>

                  {f.condition && (
                    <p className="text-xs text-slate-600 mb-2">
                      <strong className="text-slate-800">Trigger Condition:</strong> {f.condition}
                    </p>
                  )}

                  {f.evidence_text && (
                    <div className="mb-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-xs text-slate-600">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Gazette Passage:</span>
                      &ldquo;{f.evidence_text}&rdquo;
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      {f.filename && (
                        <span className="flex items-center gap-1">
                          📄
                          {f.source_url ? (
                            <a href={f.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {f.filename}
                            </a>
                          ) : (
                            <span>{f.filename}</span>
                          )}
                          {f.page_start && ` (Page ${f.page_start})`}
                        </span>
                      )}
                      {f.submission_method && (
                        <span>Mode: <strong className="text-slate-600">{f.submission_method}</strong></span>
                      )}
                    </div>

                    {f.confidence && (
                      <span className="font-mono text-[10px]">Extraction Confidence: {(f.confidence * 100).toFixed(0)}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
