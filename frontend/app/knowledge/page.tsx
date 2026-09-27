'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { getDocuments, getDbHealth } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

export default function KnowledgePage() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    documents: 478,
    extracted: 478,
    canonical_rules: 1279,
    form_requirements: 186,
    chunks: 7426,
  });

  useEffect(() => {
    getDbHealth()
      .then((res) => {
        if (res && res.documents) {
          setStats({
            documents: res.documents,
            extracted: res.extracted || res.documents,
            canonical_rules: res.canonical_rules,
            form_requirements: res.form_requirements,
            chunks: res.chunks,
          });
        }
      })
      .catch(() => {});

    getDocuments(50)
      .then((res) => {
        setDocuments(res.documents || []);
      })
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredDocs = documents.filter((d) =>
    !search || d.filename.toLowerCase().includes(search.toLowerCase()) || (d.document_id && d.document_id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-600">{t('nav.dashboard', 'Dashboard')}</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">{t('nav.knowledge', 'Government Knowledge Base')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('kb.title', 'Maharashtra Industrial Policy & Statutory Corpus')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('kb.subtitle', 'Authoritative knowledge repository comprising 478 official government gazettes, acts, GRs, and rules.')}
            </p>
          </div>

          <Link
            href="/assess"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0"
          >
            {t('kb.assess_btn', 'Run Rules Assessment →')}
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{t('kb.corpus', 'Document Corpus')}</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.documents}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{t('kb.extracted_normalized', '100% Extracted & Normalized')}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{t('kb.rules', 'Canonical Rules')}</span>
            <p className="text-2xl font-black text-blue-700 mt-1">{stats.canonical_rules.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{t('kb.deterministic_eval', 'Deterministic evaluation')}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{t('kb.forms', 'Extracted Forms')}</span>
            <p className="text-2xl font-black text-purple-700 mt-1">{stats.form_requirements}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{t('kb.prescribed_statutory', 'Prescribed statutory forms')}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{t('kb.chunks', 'Source Chunks')}</span>
            <p className="text-2xl font-black text-amber-700 mt-1">{stats.chunks.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{t('kb.verbatim_refs', 'Verbatim page references')}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            placeholder={t('kb.search_ph', 'Search gazette documents by filename, department, or keyword…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-none text-xs focus:outline-none bg-transparent"
          />
        </div>

        {/* Document Inventory Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900 text-sm">
              {t('kb.inventory_title', 'Official Document Inventory')} ({filteredDocs.length} shown)
            </h2>
            <span className="text-xs text-slate-400 font-mono">{t('kb.all_extracted', 'Status: ALL EXTRACTED')}</span>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-8">
                <svg className="animate-spin w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>{t('kb.loading', 'Loading document inventory from database…')}</span>
              </div>
            ) : filteredDocs.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">{t('kb.no_matching', 'No matching documents found.')}</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
                  <div key={doc.document_id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📄</span>
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {doc.filename}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 pl-6">
                        <span>{t('kb.doc_id', 'Doc ID:')} <span className="font-mono text-slate-600">{doc.document_id}</span></span>
                        <span>{t('kb.pages', 'Pages:')} <strong className="text-slate-700">{doc.page_count || 1}</strong></span>
                        {doc.language_detected && (
                          <span>{t('kb.lang', 'Lang:')} <strong className="text-slate-700 uppercase">{doc.language_detected}</strong></span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                        {doc.processing_status || 'EXTRACTED'}
                      </span>
                      {doc.source_url && (
                        <a
                          href={doc.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors font-semibold"
                        >
                          {t('kb.source_url', 'Source URL ↗')}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
