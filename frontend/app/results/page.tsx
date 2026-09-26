"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AssessmentResponse, FormRequirement, SourceEvidence, ApplicantProfile } from "@/types";
import { getForms } from "@/lib/api";
import SourceModal from "@/components/SourceModal";

// ── Formatters ─────────────────────────────────────────────────────────────────

function formatInr(val?: number | null): string {
  if (!val) return "—";
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Cr`;
  if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} Lakh`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function statusBadge(status: string): React.ReactNode {
  const map: Record<string, string> = {
    potentially_applicable: "bg-green-100 text-green-800 border-green-300",
    required: "bg-blue-100 text-blue-800 border-blue-300",
    potentially_required: "bg-yellow-100 text-yellow-800 border-yellow-300",
    not_applicable: "bg-red-100 text-red-700 border-red-300",
    insufficient_evidence: "bg-gray-100 text-gray-600 border-gray-300",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-600 border-gray-300";
  const label =
    status === "potentially_applicable"
      ? "Potentially Applicable"
      : status === "potentially_required"
      ? "Potentially Required"
      : status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

function formTypeBadge(type?: string): React.ReactNode {
  if (!type) return null;
  const colors: Record<string, string> = {
    APPLICATION_FORM: "bg-blue-100 text-blue-700 border-blue-200",
    PRESCRIBED_FORM: "bg-indigo-100 text-indigo-700 border-indigo-200",
    ANNEXURE: "bg-purple-100 text-purple-700 border-purple-200",
    UNDERTAKING: "bg-orange-100 text-orange-700 border-orange-200",
    RETURN_REPORTING_FORM: "bg-teal-100 text-teal-700 border-teal-200",
    AFFIDAVIT: "bg-red-100 text-red-700 border-red-200",
    PROFORMA: "bg-yellow-100 text-yellow-700 border-yellow-200",
    DECLARATION: "bg-pink-100 text-pink-700 border-pink-200",
  };
  const cls = colors[type] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const label = type.replace(/_/g, " ");
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function ResultSection({
  id,
  icon,
  title,
  count,
  children,
}: {
  id: string;
  icon: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <span className="text-xl">{icon}</span> {title}
        </h2>
        <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1 font-semibold">
          {count}
        </span>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
      {children}
    </div>
  );
}

function NoData({ msg }: { msg: string }) {
  return <p className="text-gray-400 text-sm italic">{msg}</p>;
}

function EvidenceRow({
  evidence,
  onView,
}: {
  evidence: SourceEvidence[];
  onView: (s: SourceEvidence) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {evidence.map((ev) => (
        <button
          key={ev.chunk_id}
          onClick={() => onView(ev)}
          className="text-xs bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 transition-colors text-left"
        >
          <span className="text-blue-600">📄 </span>
          <span className="text-gray-600">
            {ev.filename.split("_").slice(1).join("_") || ev.filename}
          </span>
          <span className="text-gray-400"> p.{ev.page_start}</span>
        </button>
      ))}
    </div>
  );
}

// ── Side nav for results ───────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "approvals", icon: "📋", label: "Approvals" },
  { id: "documents", icon: "📁", label: "Documents" },
  { id: "incentives", icon: "💰", label: "Incentives" },
  { id: "forms",     icon: "📝", label: "Forms" },
  { id: "sources",   icon: "📄", label: "Evidence" },
];

function SideNav({ counts }: { counts: Record<string, number> }) {
  const [active, setActive] = useState("approvals");

  // IntersectionObserver: highlight whichever section is most visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // pick the entry that is intersecting and has the highest ratio
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    // offset for the sticky top-bar (~64px header)
    const yOffset = -80;
    const top = el.getBoundingClientRect().top + window.scrollY + yOffset;
    window.scrollTo({ top, behavior: "smooth" });
    setActive(id);
  }

  return (
    // self-start is critical: makes sticky work inside a flex row
    <nav className="hidden lg:block sticky top-20 self-start w-48 shrink-0">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">
        Jump to
      </p>
      <div className="space-y-0.5">
        {NAV_ITEMS.map(({ id, icon, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-all duration-150 ${
                isActive
                  ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-200"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-base leading-none">{icon}</span>
                <span>{label}</span>
              </span>
              {counts[id] !== undefined && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 font-semibold leading-none ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {counts[id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Divider + back to top */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          ↑ Back to top
        </button>
      </div>
    </nav>
  );
}


// ── Main results page ──────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [profile, setProfile] = useState<Partial<ApplicantProfile> | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [forms, setForms] = useState<FormRequirement[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceEvidence | null>(null);

  // Load assessment from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("smsws_assessment");
    const rawProfile = localStorage.getItem("smsws_profile");
    const demo = localStorage.getItem("smsws_demo");
    if (raw) {
      try {
        setAssessment(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
    if (rawProfile) {
      try {
        setProfile(JSON.parse(rawProfile));
      } catch {
        /* ignore */
      }
    }
    setIsDemo(demo === "1");
  }, []);

  // Fetch forms for the sector
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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600 text-lg">No assessment found.</p>
        <Link
          href="/assess"
          className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
        >
          Start Assessment →
        </Link>
      </div>
    );
  }

  const s = assessment.project_summary;
  const counts = {
    approvals: assessment.approvals.length,
    documents: assessment.documents_required.length,
    incentives: assessment.incentives.length,
    forms: forms.length,
    sources: assessment.sources.length,
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-blue-900 text-white px-6 py-5 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-xs uppercase tracking-widest mb-1">
                Smart Maharashtra Single Window System
              </p>
              <h1 className="text-2xl font-extrabold">
                Preliminary Assessment Report
              </h1>
            </div>
            <div className="flex gap-3">
              <Link
                href="/assess"
                className="px-4 py-2 text-sm font-medium text-blue-200 border border-blue-600 rounded-lg hover:bg-blue-800 transition-colors"
              >
                ← New Assessment
              </Link>
              <Link
                href="/assess?demo=textile"
                className="px-4 py-2 text-sm font-bold bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition-colors"
              >
                ⚡ Try Demo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Demo banner */}
      {isDemo && (
        <div className="bg-amber-400 px-6 py-2 text-center">
          <p className="text-amber-900 font-bold text-sm">
            ⚡ DEMO MODE — Results generated from sample Textile project profile
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8 items-start">

          {/* Side nav */}
          <SideNav counts={counts} />

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Project Summary card */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-800">📌 Project Summary</h2>
                {isDemo && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    DEMO DATA
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Entity", value: s.entity_name },
                  { label: "Type", value: s.entity_type },
                  { label: "Sector", value: s.sector },
                  { label: "Stage", value: s.stage },
                  { label: "District", value: s.district ?? "—" },
                  { label: "Location", value: s.location_type ?? "—" },
                  { label: "Investment", value: formatInr(s.investment_inr) },
                  { label: "Employment", value: s.employment_expected ? `${s.employment_expected} persons` : "—" },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{item.label}</p>
                    <p className="text-gray-800 font-bold mt-0.5 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Warnings */}
            {assessment.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
                <span className="text-yellow-500 text-lg mt-0.5">⚠</span>
                <div>
                  <p className="font-semibold text-yellow-800 text-sm mb-1">Notices</p>
                  <ul className="space-y-1">
                    {assessment.warnings.map((w, i) => (
                      <li key={i} className="text-yellow-700 text-sm">• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ── 1. Approvals ─────────────────────────────────────────────── */}
            <ResultSection id="approvals" icon="📋" title="Required Approvals & Clearances" count={assessment.approvals.length}>
              {assessment.approvals.length === 0 ? (
                <NoData msg="No approval requirements identified." />
              ) : (
                <div className="space-y-3">
                  {assessment.approvals.map((a, i) => (
                    <Card key={i}>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-bold text-gray-800 text-sm">{a.name}</h3>
                        {statusBadge(a.status)}
                      </div>
                      <p className="text-xs text-gray-400 mb-2">
                        Stage: {a.stage}
                        {a.authority ? ` · Authority: ${a.authority}` : ""}
                      </p>
                      <p className="text-gray-600 text-sm">{a.reason}</p>
                      {a.evidence.length > 0 && (
                        <EvidenceRow evidence={a.evidence} onView={setSelectedSource} />
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </ResultSection>

            {/* ── 2. Documents ──────────────────────────────────────────────── */}
            <ResultSection id="documents" icon="📁" title="Required Documents" count={assessment.documents_required.length}>
              {assessment.documents_required.length === 0 ? (
                <NoData msg="No specific document requirements identified." />
              ) : (
                <ul className="grid sm:grid-cols-2 gap-2">
                  {assessment.documents_required.map((doc, i) => (
                    <li key={i} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-100">
                      <span className="text-blue-500 mt-0.5 shrink-0">✓</span>
                      {doc}
                    </li>
                  ))}
                </ul>
              )}
            </ResultSection>

            {/* ── 3. Incentives ─────────────────────────────────────────────── */}
            <ResultSection id="incentives" icon="💰" title="Potential Incentives & Schemes" count={assessment.incentives.length + assessment.applicable_policies.length}>
              {assessment.incentives.length === 0 && assessment.applicable_policies.length === 0 ? (
                <NoData msg="No specific incentives identified." />
              ) : (
                <div className="space-y-4">
                  {assessment.applicable_policies.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Applicable Policy Pathways</p>
                      <div className="space-y-3">
                        {assessment.applicable_policies.map((p, i) => (
                          <Card key={i}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3 className="font-bold text-gray-800 text-sm">{p.name}</h3>
                              {statusBadge(p.status)}
                            </div>
                            <p className="text-gray-600 text-sm">{p.reason}</p>
                            {p.evidence.length > 0 && (
                              <EvidenceRow evidence={p.evidence} onView={setSelectedSource} />
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  {assessment.incentives.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Specific Incentives</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {assessment.incentives.map((inc, i) => (
                          <Card key={i}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-bold text-gray-800 text-sm">{inc.name}</h3>
                              {statusBadge(inc.status)}
                            </div>
                            <p className="text-gray-600 text-xs">{inc.reason}</p>
                            {inc.evidence.length > 0 && (
                              <EvidenceRow evidence={inc.evidence} onView={setSelectedSource} />
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ResultSection>

            {/* ── 4. Forms ──────────────────────────────────────────────────── */}
            <ResultSection id="forms" icon="📝" title="Required Government Forms" count={forms.length}>
              {formsLoading ? (
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Loading form requirements…
                </div>
              ) : forms.length === 0 ? (
                <NoData msg="No specific form requirements found for this sector in the knowledge base." />
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 mb-3">
                    Forms extracted from official government documents. Sourced from the Maharashtra policy corpus.
                  </p>
                  {forms.slice(0, 20).map((f) => (
                    <div
                      key={f.form_requirement_id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-sm">{f.form_name}</p>
                          {f.form_number && (
                            <p className="text-xs text-gray-500 font-mono mt-0.5">Form No: {f.form_number}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {formTypeBadge(f.form_type)}
                          {f.required && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              f.required.toUpperCase() === "MANDATORY"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                            }`}>
                              {f.required}
                            </span>
                          )}
                        </div>
                      </div>

                      {f.condition && (
                        <p className="text-xs text-gray-600 mb-1.5">
                          <strong>Condition:</strong> {f.condition}
                        </p>
                      )}
                      {f.evidence_text && (
                        <p className="text-xs text-gray-500 italic line-clamp-2 mb-1.5 font-mono bg-gray-50 rounded p-1.5">
                          &ldquo;{f.evidence_text}&rdquo;
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                        {f.filename && (
                          <span className="flex items-center gap-1">
                            📄
                            {f.source_url ? (
                              <a
                                href={f.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {f.filename}
                              </a>
                            ) : (
                              <span>{f.filename}</span>
                            )}
                            {f.page_start && ` p.${f.page_start}`}
                          </span>
                        )}
                        {f.submission_method && (
                          <span>Submit: {f.submission_method}</span>
                        )}
                        {f.rule_name && (
                          <span className="text-blue-500">Rule: {f.rule_name.slice(0, 60)}{f.rule_name.length > 60 ? '…' : ''}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {forms.length > 20 && (
                    <p className="text-center text-sm text-gray-400 italic pt-2">
                      Showing 20 of {forms.length} forms for this sector.
                    </p>
                  )}
                </div>
              )}
            </ResultSection>

            {/* ── 5. Evidence / Sources ─────────────────────────────────────── */}
            <ResultSection id="sources" icon="📄" title="Government Evidence & Sources" count={assessment.sources.length}>
              {assessment.sources.length === 0 ? (
                <NoData msg="No source evidence retrieved for this profile." />
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 mb-3">
                    Verbatim passages from the Maharashtra government policy corpus. Click any source to view the full extracted text.
                  </p>
                  {assessment.sources.map((src) => (
                    <div
                      key={src.chunk_id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">
                            {src.source_url ? (
                              <a
                                href={src.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-700 hover:underline"
                              >
                                {src.filename}
                              </a>
                            ) : (
                              src.filename
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Page {src.page_start === src.page_end ? src.page_start : `${src.page_start}–${src.page_end}`}
                            {src.section_reference ? ` · §${src.section_reference}` : ""}
                            {` · Score: ${(src.relevance_score * 100).toFixed(0)}%`}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedSource(src)}
                          className="shrink-0 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 font-medium transition-colors"
                        >
                          View Source →
                        </button>
                      </div>
                      <p className="text-gray-500 text-xs line-clamp-3 font-mono bg-gray-50 rounded p-2">
                        {src.text.slice(0, 350)}{src.text.length > 350 ? "…" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ResultSection>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <span className="text-amber-500 text-xl shrink-0">⚠️</span>
              <p className="text-amber-800 text-sm leading-relaxed">{assessment.disclaimer}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 justify-center pb-8 pt-2">
              <Link
                href="/assess"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-colors"
              >
                New Assessment
              </Link>
              <Link
                href="/assess?demo=textile"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors"
              >
                ⚡ Textile Demo
              </Link>
              <Link
                href="/"
                className="border border-gray-300 text-gray-600 hover:bg-gray-100 font-medium px-8 py-3 rounded-xl transition-colors"
              >
                ← Home
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Source modal */}
      <SourceModal source={selectedSource} onClose={() => setSelectedSource(null)} />
    </div>
  );
}
