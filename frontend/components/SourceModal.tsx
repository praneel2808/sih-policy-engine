"use client";

import { useEffect } from "react";
import type { SourceEvidence } from "@/types";

export default function SourceModal({
  source,
  onClose,
}: {
  source: SourceEvidence | null;
  onClose: () => void;
}) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
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
              <span className="flex items-center gap-1">
                <span className="text-blue-500">📄</span>
                Page {source.page_start === source.page_end
                  ? source.page_start
                  : `${source.page_start}–${source.page_end}`}
              </span>
              {source.section_reference && (
                <span className="flex items-center gap-1">
                  <span className="text-blue-500">🔖</span>
                  Section: {source.section_reference}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="text-blue-500">🎯</span>
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
                  <span>🔗</span>
                  View Official Government Source
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
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-white flex-1">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Extracted Text</span>
            <div className="h-px bg-gray-100 flex-1" />
          </div>

          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-800 bg-gray-50/50 p-4 rounded-lg border border-gray-100 selection:bg-blue-100">
            {source.text}
          </pre>

          {/* Provenance footer */}
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
            <span className="text-blue-500 mt-0.5 shrink-0">🛡️</span>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Authoritative Provenance</p>
              <p className="text-xs text-blue-700/80 leading-relaxed">
                This text was deterministically extracted from the official government document database.
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
