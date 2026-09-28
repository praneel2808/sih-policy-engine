'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { FormRequirement, FormField } from '@/types';
import { getForms, submitFormSubmissions } from '@/lib/api';
import AppLayout from '@/components/AppLayout';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProcessedField {
  field_name: string;
  official_field_label: string;
  input_type: string;
  required: boolean;
  options: string[] | null;
  validationObj: Record<string, any>;
  /** which form IDs contain this field */
  formIds: number[];
  formNames: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normaliseKey(name: string): string {
  return name.toLowerCase().replace(/[\W_]+/g, '_').replace(/^_+|_+$/g, '');
}

function parseOptions(raw: string | null | undefined): string[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {/* fall through */}
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function parseValidation(raw: string | null | undefined): Record<string, any> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

// ─── Field control renderer ────────────────────────────────────────────────────

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: ProcessedField;
  value: string;
  onChange: (v: string) => void;
}) {
  const base =
    'w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors';

  if (field.options && field.options.length > 0) {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className={base}>
        <option value="">— Select —</option>
        {field.options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (field.input_type === 'date') {
    return <input type="date" value={value} onChange={e => onChange(e.target.value)} className={base} />;
  }

  if (field.input_type === 'number') {
    return (
      <input
        type="number"
        min={field.validationObj?.min_value ?? 0}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.official_field_label}
        className={base}
      />
    );
  }

  return (
    <input
      type="text"
      maxLength={field.validationObj?.max_length}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={field.official_field_label}
      className={base}
    />
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

import { Suspense } from 'react';

function FillFormsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawIds = searchParams.get('ids') ?? '';
  const backHref = searchParams.get('back') ?? '/forms';
  const projectName = searchParams.get('project') ?? 'Industrial Application';

  const selectedIds = useMemo<number[]>(() => {
    return rawIds
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));
  }, [rawIds]);

  const [allForms, setAllForms] = useState<FormRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Fetch all forms (with fields embedded) then filter to the selected IDs
  useEffect(() => {
    setLoading(true);
    getForms()
      .then(data => {
        if (selectedIds.length > 0) {
          setAllForms(data.filter(f => selectedIds.includes(f.form_requirement_id)));
        } else {
          // No IDs → show all forms that have fields
          setAllForms(data.filter(f => f.fields && f.fields.length > 0));
        }
      })
      .catch(() => setAllForms([]))
      .finally(() => setLoading(false));
  }, [rawIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only forms that actually have field blueprints in the DB
  const activeForms = useMemo(
    () => allForms.filter(f => f.fields && f.fields.length > 0),
    [allForms]
  );

  // ── Shared / specific field analysis ─────────────────────────────────────────
  const { sharedFields, specificFieldsMap } = useMemo(() => {
    const occurrence: Record<string, { field: FormField; formId: number; formName: string }[]> = {};

    activeForms.forEach(form => {
      form.fields?.forEach(field => {
        const key = normaliseKey(field.field_name);
        if (!occurrence[key]) occurrence[key] = [];
        occurrence[key].push({ field, formId: form.form_requirement_id, formName: form.form_name });
      });
    });

    const shared: ProcessedField[] = [];
    const specific: Record<number, ProcessedField[]> = {};

    Object.entries(occurrence).forEach(([, occs]) => {
      const first = occs[0].field;
      const pf: ProcessedField = {
        field_name: first.field_name,
        official_field_label: first.official_field_label,
        input_type: first.input_type || 'text',
        required: first.required === 1,
        options: parseOptions(first.options),
        validationObj: parseValidation(first.validation),
        formIds: occs.map(o => o.formId),
        formNames: occs.map(o => o.formName),
      };

      if (occs.length > 1) {
        shared.push(pf);
      } else {
        const fid = occs[0].formId;
        if (!specific[fid]) specific[fid] = [];
        specific[fid].push(pf);
      }
    });

    return { sharedFields: shared, specificFieldsMap: specific };
  }, [activeForms]);

  const allProcessedFields = useMemo(
    () => [...sharedFields, ...Object.values(specificFieldsMap).flat()],
    [sharedFields, specificFieldsMap]
  );

  const totalFields = allProcessedFields.length;
  const filledFields = allProcessedFields.filter(
    f => (formData[f.field_name] ?? '').trim() !== ''
  ).length;
  const progressPct = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  const handleChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate required fields
    for (const f of allProcessedFields) {
      if (f.required && (formData[f.field_name] ?? '').trim() === '') {
        setErrorMsg(`Please fill the required field: "${f.official_field_label}"`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // Map collected values back to EACH individual form
      const submissions = activeForms.map(form => {
        const collected: Record<string, string> = {};
        form.fields?.forEach(f => {
          if ((formData[f.field_name] ?? '').trim() !== '') {
            collected[f.field_name] = formData[f.field_name];
          }
        });
        return {
          form_requirement_id: form.form_requirement_id,
          form_name: form.form_name,
          form_number: form.form_number ?? undefined,
          collected_values: collected,
        };
      });

      const result = await submitFormSubmissions({
        project_id: `PROJ-${Date.now()}`,
        entity_name: projectName,
        submissions,
      });

      setSavedCount(result.saved_submissions_count ?? submissions.length);
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting forms. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading form blueprints…</p>
        </div>
      </AppLayout>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-300 flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Forms Submitted Successfully</h1>
            <p className="text-slate-500 text-sm mt-2">
              {savedCount} form submission{savedCount !== 1 ? 's' : ''} saved. Your answers have been mapped back to each individual required government form.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link
              href={backHref}
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ← Back
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors shadow-sm"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── No active forms with field data ──────────────────────────────────────────
  if (activeForms.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">No Field Blueprints Available</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            The selected form(s) don't have field definitions in the database yet. Field blueprints need to be added for each form before they can be filled digitally.
          </p>
          <Link
            href={backHref}
            className="inline-block px-6 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            ← Go Back
          </Link>
        </div>
      </AppLayout>
    );
  }

  // ── Main form UI ──────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <form onSubmit={handleSubmit}>
        <div className="max-w-4xl mx-auto space-y-6 pb-24">

          {/* ── Header ── */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href={backHref}
              className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Unified Form Studio
                </span>
                <span className="text-xs text-slate-400 font-mono">{activeForms.length} Statutory Form{activeForms.length !== 1 ? 's' : ''}</span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 mt-0.5 truncate">
                {projectName}
              </h1>
            </div>
          </div>

          {/* ── Progress bar ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Completion Progress</span>
              <span className={progressPct === 100 ? 'text-emerald-600' : 'text-blue-600'}>
                {filledFields} / {totalFields} fields filled · {progressPct}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {sharedFields.length > 0 && (
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <span>✨</span>
                <span>{sharedFields.length} shared field{sharedFields.length !== 1 ? 's' : ''} detected — asked only once, auto-filled across all forms.</span>
              </p>
            )}
          </div>

          {/* ── Error message ── */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-semibold flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── SECTION 1: Shared Fields ── */}
          {sharedFields.length > 0 && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl overflow-hidden">
              {/* Section header */}
              <div className="bg-blue-600 px-6 py-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <div>
                  <h2 className="text-sm font-extrabold text-white">Common Fields (Shared Across Forms)</h2>
                  <p className="text-blue-100 text-[11px]">Fill these once — values will be used in all applicable forms automatically.</p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {sharedFields.map(field => (
                  <div key={field.field_name} className="bg-white rounded-xl border border-blue-200/70 p-4 shadow-sm space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <label className="text-sm font-bold text-slate-800 leading-snug">
                        {field.official_field_label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                        Shared
                      </span>
                    </div>
                    <FieldControl
                      field={field}
                      value={formData[field.field_name] ?? ''}
                      onChange={v => handleChange(field.field_name, v)}
                    />
                    <p className="text-[10px] text-blue-600 font-mono">
                      Auto-fills: {field.formNames.map(n => n.length > 40 ? n.slice(0, 40) + '…' : n).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SECTION 2: Per-form specific fields ── */}
          {activeForms.map(form => {
            const specFields = specificFieldsMap[form.form_requirement_id] ?? [];
            return (
              <div key={form.form_requirement_id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Form header */}
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold font-mono text-slate-400">
                        REQ-{form.form_requirement_id}
                      </span>
                      {form.form_number && (
                        <span className="text-[10px] font-bold text-blue-300 font-mono">
                          {form.form_number}
                        </span>
                      )}
                      {form.form_type && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                          {form.form_type.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-extrabold text-white mt-0.5 leading-snug">
                      {form.form_name}
                    </h3>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[11px] text-slate-400">
                      {specFields.length} form-specific field{specFields.length !== 1 ? 's' : ''}
                    </div>
                    {sharedFields.filter(f => f.formIds.includes(form.form_requirement_id)).length > 0 && (
                      <div className="text-[11px] text-blue-400">
                        + {sharedFields.filter(f => f.formIds.includes(form.form_requirement_id)).length} shared
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {specFields.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400 italic">
                      <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      All fields for this form are covered by the shared fields above.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {specFields.map(field => (
                        <div key={field.field_name} className="space-y-1.5">
                          <label className="block text-sm font-bold text-slate-800">
                            {field.official_field_label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <FieldControl
                            field={field}
                            value={formData[field.field_name] ?? ''}
                            onChange={v => handleChange(field.field_name, v)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* ── Sticky Submit Bar ── */}
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <span className="font-bold text-slate-700">{activeForms.length}</span> form{activeForms.length !== 1 ? 's' : ''} ·{' '}
                <span className="font-bold text-slate-700">{filledFields}</span> / {totalFields} fields filled
                {progressPct === 100 && (
                  <span className="ml-2 text-emerald-600 font-bold">✓ Ready to submit</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={backHref}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Submitting…
                    </>
                  ) : (
                    <>Submit &amp; Save All Forms →</>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </form>
    </AppLayout>
  );
}

export default function FillFormsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    }>
      <FillFormsContent />
    </Suspense>
  );
}
