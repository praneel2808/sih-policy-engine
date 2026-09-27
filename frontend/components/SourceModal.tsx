"use client";

import { useEffect } from "react";
import type { SourceEvidence } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

export default function SourceModal({
  source,
  onClose,
}: {
  source: SourceEvidence | null;
  onClose: () => void;
}) {
  const { t } = useLanguage();

  // Prevent body scroll when open
  useEffect(() => {
    if (source) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [source]);

  // Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!source) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm print:hidden">
      {/* Click-away backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-label="Close modal background" />

      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-gray-50 gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-800 break-words leading-tight mb-2">
              {source.filename}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Page {source.page_start === source.page_end
                  ? source.page_start
                  : `${source.page_start}–${source.page_end}`}
              </span>
              {source.section_reference && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Section: {source.section_reference}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Relevance: {(source.relevance_score * 100).toFixed(1)}%
              </span>
              {source.extraction_method && (
                <span className="bg-gray-200 px-2 rounded-full text-xs font-mono">
                  {source.extraction_method}
                </span>
              )}
            </div>

            {/* Official source URL */}
            {source.source_url && (
              <div className="mt-3">
                <a
                  href={source.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2 transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {t('modal.source_title', 'View Official Government Source')}
                  <span className="text-xs text-gray-400 no-underline font-normal">
                    (opens in new tab)
                  </span>
                </a>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-white flex-1">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('modal.extracted_text', 'Extracted Text')}</span>
            <div className="h-px bg-gray-100 flex-1" />
          </div>

          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-800 bg-gray-50/50 p-4 rounded-lg border border-gray-100 selection:bg-blue-100">
            {source.text}
          </pre>

          {/* Provenance footer */}
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
            <div className="w-6 h-6 rounded-md bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">{t('modal.provenance', 'Authoritative Provenance')}</p>
              <p className="text-xs text-blue-700/80 leading-relaxed">
                {t('modal.provenance_desc', 'This text was deterministically extracted from the official government document database.')}
                {" "}Chunk ID:{" "}
                <span className="font-mono bg-blue-100/50 px-1 rounded">
                  {source.chunk_id.substring(0, 16)}…
                </span>
              </p>
              {source.source_url && (
                <p className="text-xs text-blue-600 mt-1">
                  Official source:{" "}
                  <a
                    href={source.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-800 break-all"
                  >
                    {source.source_url}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
