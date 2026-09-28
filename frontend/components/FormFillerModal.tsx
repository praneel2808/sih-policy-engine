'use client';

import { useState, useEffect, useMemo } from 'react';
import type { FormRequirement, FormField } from '@/types';

interface FormFillerModalProps {
  isOpen: boolean;
  onClose: () => void;
  forms: FormRequirement[];
  projectName?: string;
  onSuccess?: () => void;
}

interface ProcessedField {
  field_name: string;
  official_field_label: string;
  input_type: string;
  required: boolean;
  options: string[] | null;
  validationObj: Record<string, any>;
  formIds: number[];
  formNames: string[];
}

export default function FormFillerModal({
  isOpen,
  onClose,
  forms,
  projectName = 'Industrial Application',
  onSuccess,
}: FormFillerModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter forms that have loaded fields or fall back to default fields
  const activeForms = useMemo(() => {
    return forms.filter((f) => f.fields && f.fields.length > 0);
  }, [forms]);

  // Analyze shared vs form-specific fields across selected forms
  const { sharedFields, specificFieldsMap } = useMemo(() => {
    const fieldOccurrence: Record<string, { field: FormField; formId: number; formName: string }[]> = {};

    activeForms.forEach((form) => {
      form.fields?.forEach((field) => {
        const key = field.field_name.toLowerCase().trim();
        if (!fieldOccurrence[key]) {
          fieldOccurrence[key] = [];
        }
        fieldOccurrence[key].push({
          field,
          formId: form.form_requirement_id,
          formName: form.form_name,
        });
      });
    });

    const shared: ProcessedField[] = [];
    const specific: Record<number, ProcessedField[]> = {};

    Object.entries(fieldOccurrence).forEach(([key, occs]) => {
      const first = occs[0].field;
      let parsedOptions: string[] | null = null;
      if (first.options) {
        try {
          parsedOptions = JSON.parse(first.options);
        } catch {
          parsedOptions = first.options.split(',').map((s) => s.trim());
        }
      }

      let parsedVal: Record<string, any> = {};
      if (first.validation) {
        try {
          parsedVal = JSON.parse(first.validation);
        } catch {
          /* ignore */
        }
      }

      const pField: ProcessedField = {
        field_name: first.field_name,
        official_field_label: first.official_field_label,
        input_type: first.input_type || 'text',
        required: first.required === 1,
        options: parsedOptions,
        validationObj: parsedVal,
        formIds: occs.map((o) => o.formId),
        formNames: occs.map((o) => o.formName),
      };

      if (occs.length > 1) {
        shared.push(pField);
      } else {
        const formId = occs[0].formId;
        if (!specific[formId]) specific[formId] = [];
        specific[formId].push(pField);
      }
    });

    return { sharedFields: shared, specificFieldsMap: specific };
  }, [activeForms]);

  if (!isOpen) return null;

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    // Validate required fields
    const allFields = [...sharedFields, ...Object.values(specificFieldsMap).flat()];
    for (const f of allFields) {
      if (f.required) {
        const val = formData[f.field_name];
        if (val === undefined || val === null || String(val).trim() === '') {
          setErrorMsg(`Please fill required field: "${f.official_field_label}"`);
          setSubmitting(false);
          return;
        }
      }
    }

    try {
      // Map collected answers back to EACH individual form requirement
      const submissionsPayload = activeForms.map((form) => {
        const formValues: Record<string, any> = {};
        form.fields?.forEach((f) => {
          if (formData[f.field_name] !== undefined) {
            formValues[f.field_name] = formData[f.field_name];
          }
        });

        return {
          form_requirement_id: form.form_requirement_id,
          form_name: form.form_name,
          form_number: form.form_number,
          collected_values: formValues,
        };
      });

      const body = {
        project_id: `PROJ-${Date.now()}`,
        entity_name: projectName,
        submissions: submissionsPayload,
      };

      const res = await fetch('http://127.0.0.1:8000/api/form-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to save form submissions to server.');

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting forms');
    } finally {
      setSubmitting(false);
    }
  };

  const renderControl = (field: ProcessedField) => {
    const val = formData[field.field_name] ?? '';

    if (field.options && field.options.length > 0) {
      return (
        <select
          value={val}
          onChange={(e) => handleChange(field.field_name, e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">-- Select Option --</option>
          {field.options.map((opt: string) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (field.input_type === 'date') {
      return (
        <input
          type="date"
          value={val}
          onChange={(e) => handleChange(field.field_name, e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      );
    }

    if (field.input_type === 'number') {
      return (
        <input
          type="number"
          min={field.validationObj?.min_value ?? 0}
          value={val}
          onChange={(e) => handleChange(field.field_name, e.target.value)}
          placeholder={`Enter ${field.official_field_label}`}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      );
    }

    return (
      <input
        type="text"
        maxLength={field.validationObj?.max_length}
        value={val}
        onChange={(e) => handleChange(field.field_name, e.target.value)}
        placeholder={`Enter ${field.official_field_label}`}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider">
                Unified Form Studio
              </span>
              <span className="text-slate-400 text-xs font-mono">{activeForms.length} Statutory Forms Selected</span>
            </div>
            <h2 className="text-base font-extrabold text-white mt-1">Single-Entry Application Form Filler</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Progress & Info Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium">Enterprise Project:</span>
            <strong className="text-slate-900">{projectName}</strong>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
            {sharedFields.length > 0 && (
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                ✨ {sharedFields.length} Shared Fields (Asked Once)
              </span>
            )}
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {success ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md">
                ✓
              </div>
              <h3 className="text-base font-extrabold text-emerald-900">
                Statutory Form Submissions Completed & Saved!
              </h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
                All answers have been mapped back to each individual required government form requirement and saved to the Unified Approval System database.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-6 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-700 transition-colors"
              >
                Close & Return to Dossier
              </button>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Shared Fields Section */}
              {sharedFields.length > 0 && (
                <div className="bg-blue-50/60 rounded-2xl border border-blue-200/80 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
                    <div>
                      <h3 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🔗</span>
                        <span>Common & Shared Statutory Fields</span>
                      </h3>
                      <p className="text-[11px] text-blue-700 mt-0.5">
                        These fields appear in multiple forms. Fill them once here to auto-populate across all required forms.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sharedFields.map((field) => (
                      <div key={field.field_name} className="bg-white p-3 rounded-xl border border-blue-200/60 shadow-2xs">
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          {field.official_field_label}
                          {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                        </label>
                        {renderControl(field)}
                        <span className="inline-block mt-1 text-[10px] text-blue-600 font-mono">
                          Auto-fills: {field.formNames.join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specific Fields per Form */}
              {activeForms.map((form) => {
                const specFields = specificFieldsMap[form.form_requirement_id] || [];
                return (
                  <div key={form.form_requirement_id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                          REQ-{form.form_requirement_id} · {form.form_number || 'FORM'}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-900 leading-snug">{form.form_name}</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {specFields.length} Form-Specific Field{specFields.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {specFields.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        All fields for this form are automatically covered by the shared fields above.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {specFields.map((field) => (
                          <div key={field.field_name}>
                            <label className="block text-xs font-semibold text-slate-800 mb-1">
                              {field.official_field_label}
                              {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                            </label>
                            {renderControl(field)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Footer CTA */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Submitting Forms…</span>
                  ) : (
                    <span>Submit & Save All Completed Forms →</span>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
