'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { ApplicantProfile, EntityType, Sector, LocationType, ProjectStage } from '@/types';
import { DEMO_TEXTILE, DEMO_EV } from '@/types';
import { submitAssessment, DISTRICTS } from '@/lib/api';

// ── Constants ──────────────────────────────────────────────────────────────────
const ENTITY_TYPES: EntityType[] = ['Company', 'LLP', 'Proprietorship'];
const SECTORS: Sector[] = [
  'Textile', 'EV / Automotive', 'Electronics', 'Chemical', 'Engineering',
  'Food Processing', 'IT / ITES', 'Logistics', 'Aerospace', 'Startup', 'Other',
];
const LOCATION_TYPES: LocationType[] = ['MIDC', 'Private industrial area', 'Other'];
const PROJECT_STAGES: ProjectStage[] = [
  'Pre-establishment', 'Construction', 'Operational', 'Expansion',
];

const STAGE_DESC: Record<ProjectStage, string> = {
  'Pre-establishment': 'Planning / land not yet acquired',
  'Construction': 'Site acquired, construction underway',
  'Operational': 'Production has commenced',
  'Expansion': 'Existing unit expanding capacity',
};

// ── Small helpers ─────────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-gray-400">{children}</p>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600 font-medium">{msg}</p>;
}

function SectionCard({
  title,
  icon,
  children,
  className = '',
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h2 className="font-bold text-blue-900 text-sm tracking-tight">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function textInput(
  value: string | number | undefined,
  onChange: (v: string) => void,
  opts: { placeholder?: string; type?: string; min?: number }
) {
  return (
    <input
      type={opts.type ?? 'text'}
      min={opts.min}
      placeholder={opts.placeholder}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function AssessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profile, setProfile] = useState<Partial<ApplicantProfile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Load demo on mount from ?demo= query param
  useEffect(() => {
    const demo = searchParams.get('demo');
    if (demo === 'textile') {
      setProfile(DEMO_TEXTILE);
      setIsDemoMode(true);
    } else if (demo === 'ev') {
      setProfile(DEMO_EV);
      setIsDemoMode(true);
    }
  }, [searchParams]);

  // ── Field update ───────────────────────────────────────────────────────────
  function set<K extends keyof ApplicantProfile>(key: K, value: ApplicantProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (isDemoMode) setIsDemoMode(false);
  }

  // ── Demo load ──────────────────────────────────────────────────────────────
  function loadDemo(type: 'textile' | 'ev') {
    const demo = type === 'textile' ? DEMO_TEXTILE : DEMO_EV;
    setProfile(demo);
    setIsDemoMode(true);
    setErrors({});
    setSubmitError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setProfile({});
    setErrors({});
    setSubmitError(null);
    setIsDemoMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!profile.entity_type) errs.entity_type = 'Entity type is required.';
    if (!profile.entity_name?.trim()) errs.entity_name = 'Entity / project name is required.';
    if (profile.pan && profile.pan.length !== 10) errs.pan = 'PAN must be exactly 10 characters.';
    if (!profile.sector) errs.sector = 'Industry sector is required.';
    if (!profile.stage) errs.stage = 'Project stage is required.';
    if (profile.investment_inr !== undefined && profile.investment_inr < 0)
      errs.investment_inr = 'Investment cannot be negative.';
    if (profile.power_kw !== undefined && profile.power_kw < 0)
      errs.power_kw = 'Power cannot be negative.';
    if (profile.employment_expected !== undefined && profile.employment_expected < 0)
      errs.employment_expected = 'Employment cannot be negative.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setLoading(true);
    setSubmitError(null);
    try {
      const result = await submitAssessment(profile as ApplicantProfile);
      localStorage.setItem('smsws_assessment', JSON.stringify(result));
      localStorage.setItem('smsws_profile', JSON.stringify(profile));
      localStorage.setItem('smsws_demo', isDemoMode ? '1' : '0');
      router.push('/results');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  const hasErrors = Object.keys(errors).length > 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <div className="bg-blue-900 text-white py-3 px-6 sticky top-0 z-20 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-300 hover:text-white text-sm transition-colors">
              ← Home
            </Link>
            <span className="text-blue-600">|</span>
            <span className="text-white font-semibold text-sm tracking-tight">
              Project Assessment
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDemo('textile')}
              className="text-xs px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-lg transition-colors"
            >
              ⚡ Textile Demo
            </button>
            <button
              onClick={() => loadDemo('ev')}
              className="text-xs px-3 py-1.5 bg-orange-500/80 hover:bg-orange-400 text-white font-semibold rounded-lg transition-colors"
            >
              ⚡ EV Demo
            </button>
            {(Object.keys(profile).length > 0) && (
              <button
                onClick={resetForm}
                className="text-xs px-3 py-1.5 border border-blue-400 text-blue-200 hover:bg-blue-800 rounded-lg transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-amber-50 border-2 border-amber-300 shadow-sm">
            <span className="text-amber-500 text-xl shrink-0">⚡</span>
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">DEMO DATA LOADED</p>
              <p className="text-amber-700 text-xs mt-0.5">
                This form is pre-filled with a sample industrial project.
                Click <strong>Assess Project</strong> to run the full assessment, or edit any field to customise.
              </p>
            </div>
            <button
              onClick={resetForm}
              className="shrink-0 text-xs text-amber-700 hover:text-amber-900 underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Error summary */}
        {hasErrors && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-red-700 font-semibold text-sm mb-1">Please fix the following:</p>
            <ul className="space-y-0.5">
              {Object.values(errors).map((e, i) => (
                <li key={i} className="text-red-600 text-xs">• {e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6">

          {/* ── Section 1: Enterprise Basics ─────────────────────────────── */}
          <SectionCard title="Enterprise Basics" icon="🏢">

            <div>
              <FieldLabel required>Entity Type</FieldLabel>
              <div className="flex flex-wrap gap-2 mt-1">
                {ENTITY_TYPES.map((t) => (
                  <label
                    key={t}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors text-sm font-medium ${
                      profile.entity_type === t
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="entity_type"
                      className="sr-only"
                      checked={profile.entity_type === t}
                      onChange={() => set('entity_type', t)}
                    />
                    {t}
                  </label>
                ))}
              </div>
              <FieldError msg={errors.entity_type} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel required>Entity / Project Name</FieldLabel>
                {textInput(profile.entity_name, (v) => set('entity_name', v), {
                  placeholder: 'e.g. Maharashtra Innovations Pvt. Ltd.',
                })}
                <FieldError msg={errors.entity_name} />
              </div>
              <div>
                <FieldLabel>PAN (optional)</FieldLabel>
                {textInput(profile.pan, (v) => set('pan', v), { placeholder: 'e.g. AABCT1234E' })}
                <FieldError msg={errors.pan} />
              </div>
            </div>

          </SectionCard>

          {/* ── Section 2: Industry & Sector ─────────────────────────────── */}
          <SectionCard title="Industry & Sector" icon="🏭">

            <div>
              <FieldLabel required>Industry Sector</FieldLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SECTORS.map((s) => (
                  <label
                    key={s}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition-colors text-sm ${
                      profile.sector === s
                        ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                        : 'border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sector"
                      className="sr-only"
                      checked={profile.sector === s}
                      onChange={() => set('sector', s as Sector)}
                    />
                    {s}
                  </label>
                ))}
              </div>
              <FieldError msg={errors.sector} />
            </div>

            <div>
              <FieldLabel>Product / Activity Description</FieldLabel>
              <textarea
                rows={2}
                placeholder="Describe the main product or industrial activity…"
                value={profile.product_description ?? ''}
                onChange={(e) => set('product_description', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <FieldHint>Helps match relevant policy keywords and evidence from the knowledge base.</FieldHint>
            </div>

          </SectionCard>

          {/* ── Section 3: Location ───────────────────────────────────────── */}
          <SectionCard title="Location" icon="📍">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>District</FieldLabel>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={profile.district ?? ''}
                  onChange={(e) => set('district', e.target.value)}
                >
                  <option value="">-- Select district --</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <FieldHint>District determines incentive zone (A/B/C/D).</FieldHint>
              </div>
              <div>
                <FieldLabel>Taluka (optional)</FieldLabel>
                {textInput(profile.taluka, (v) => set('taluka', v), { placeholder: 'e.g. Haveli' })}
              </div>
            </div>

            <div>
              <FieldLabel>Location Type</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {LOCATION_TYPES.map((lt) => (
                  <label
                    key={lt}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors text-sm font-medium ${
                      profile.location_type === lt
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="location_type"
                      className="sr-only"
                      checked={profile.location_type === lt}
                      onChange={() => set('location_type', lt)}
                    />
                    {lt}
                  </label>
                ))}
              </div>
            </div>

          </SectionCard>

          {/* ── Section 4: Project Scale ──────────────────────────────────── */}
          <SectionCard title="Project Scale & Investment" icon="📊">

            <div>
              <FieldLabel>Investment Amount (₹ INR)</FieldLabel>
              <input
                type="number"
                min={0}
                placeholder="e.g. 120000000"
                value={profile.investment_inr ?? ''}
                onChange={(e) => set('investment_inr', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {profile.investment_inr ? (
                <p className="mt-1 text-xs text-blue-600 font-medium">
                  = ₹{Number(profile.investment_inr).toLocaleString('en-IN')}
                  {profile.investment_inr >= 1e7 ? ` (₹${(profile.investment_inr / 1e7).toFixed(2)} Cr)` : ''}
                </p>
              ) : (
                <FieldHint>Investment determines Large / Mega / Ultra-Mega classification and incentive tier.</FieldHint>
              )}
              <FieldError msg={errors.investment_inr} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Expected Employment (persons)</FieldLabel>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 250"
                  value={profile.employment_expected ?? ''}
                  onChange={(e) => set('employment_expected', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FieldError msg={errors.employment_expected} />
              </div>
              <div>
                <FieldLabel>Power Requirement (kW, optional)</FieldLabel>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 2500"
                  value={profile.power_kw ?? ''}
                  onChange={(e) => set('power_kw', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FieldError msg={errors.power_kw} />
              </div>
            </div>

          </SectionCard>

          {/* ── Section 5: Project Stage ──────────────────────────────────── */}
          <SectionCard title="Project Stage" icon="🚦">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROJECT_STAGES.map((stage) => (
                <label
                  key={stage}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    profile.stage === stage
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="stage"
                    className="sr-only"
                    checked={profile.stage === stage}
                    onChange={() => set('stage', stage)}
                  />
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 ${
                        profile.stage === stage
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">{stage}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{STAGE_DESC[stage]}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <FieldError msg={errors.stage} />

          </SectionCard>

          {/* ── Assessment Summary ────────────────────────────────────────── */}
          {profile.entity_name && profile.sector && profile.stage && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Assessment Preview</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Entity', value: profile.entity_name },
                  { label: 'Sector', value: profile.sector },
                  { label: 'District', value: profile.district || '—' },
                  { label: 'Stage', value: profile.stage },
                  { label: 'Location', value: profile.location_type || '—' },
                  { label: 'Investment', value: profile.investment_inr ? `₹${(profile.investment_inr / 1e7).toFixed(1)} Cr` : '—' },
                  { label: 'Employment', value: profile.employment_expected ? `${profile.employment_expected} persons` : '—' },
                  { label: 'Type', value: profile.entity_type || '—' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-bold text-blue-900 truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error banner */}
          {submitError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              <strong>Error:</strong> {submitError}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4 items-center justify-end pt-2 pb-8">
            <button
              onClick={resetForm}
              className="px-5 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-10 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold text-base transition-colors shadow-lg shadow-orange-200 flex items-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Assessing…
                </>
              ) : (
                <>
                  <span className="text-lg">🔍</span>
                  Assess Project
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function AssessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-500 text-sm">Loading…</div>
        </div>
      }
    >
      <AssessInner />
    </Suspense>
  );
}
