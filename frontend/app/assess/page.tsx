'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { ApplicantProfile, EntityType, Sector, LocationType, ProjectStage } from '@/types';
import { DEMO_TEXTILE, DEMO_EV } from '@/types';
import { submitAssessment, DISTRICTS } from '@/lib/api';

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
  'Pre-establishment': 'Planning / site evaluation / seeking initial statutory approvals',
  'Construction': 'Site acquired, civil works / infrastructure construction in progress',
  'Operational': 'Production commenced / factory operating',
  'Expansion': 'Existing operational enterprise expanding fixed capacity or line',
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1 font-bold">*</span>}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[11px] text-slate-500">{children}</p>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600 font-medium">{msg}</p>;
}

function AssessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profile, setProfile] = useState<Partial<ApplicantProfile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const demo = searchParams.get('demo');
    if (demo === 'textile') {
      setProfile(DEMO_TEXTILE);
      setIsDemoMode(true);
      setShowAdvanced(true);
    } else if (demo === 'ev') {
      setProfile(DEMO_EV);
      setIsDemoMode(true);
      setShowAdvanced(true);
    }
  }, [searchParams]);

  function set<K extends keyof ApplicantProfile>(key: K, value: ApplicantProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (isDemoMode) setIsDemoMode(false);
  }

  function loadDemo(type: 'textile' | 'ev') {
    const demo = type === 'textile' ? DEMO_TEXTILE : DEMO_EV;
    setProfile(demo);
    setIsDemoMode(true);
    setShowAdvanced(true);
    setErrors({});
    setSubmitError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setProfile({});
    setErrors({});
    setSubmitError(null);
    setIsDemoMode(false);
    setShowAdvanced(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please check API server.');
      setLoading(false);
    }
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-600">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Project Assessment</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Single Window Project Profile & Assessment
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluates statutory clearance pathways, department requirements, and state incentive eligibility.
            </p>
          </div>

          {/* Quick Demo Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadDemo('textile')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition-colors"
            >
              Demo: Textile
            </button>
            <button
              type="button"
              onClick={() => loadDemo('ev')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg transition-colors"
            >
              Demo: EV Mfg
            </button>
            {Object.keys(profile).length > 0 && (
              <button
                type="button"
                onClick={resetForm}
                className="px-2.5 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs rounded-lg transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Demo Data Notice */}
        {isDemoMode && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-900">
            <div>
              <p className="font-bold text-xs text-slate-900">DEMO INDUSTRIAL PROJECT DATA LOADED</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Pre-filled with verified enterprise profile parameters. Click <strong>Assess Project</strong> to generate statutory report.
              </p>
            </div>
            <button
              onClick={resetForm}
              className="text-xs text-slate-600 hover:text-slate-900 underline font-medium shrink-0 ml-2"
            >
              Clear
            </button>
          </div>
        )}

        {/* Validation Errors */}
        {hasErrors && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-red-800 font-semibold text-xs uppercase tracking-wider mb-1">Required Fields Missing:</p>
            <ul className="space-y-0.5">
              {Object.values(errors).map((e, i) => (
                <li key={i} className="text-red-600 text-xs font-medium">• {e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Sections */}
        <div className="space-y-5">

          {/* Section 1: Enterprise Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-sm">1. Enterprise Identity & Basic Details</h2>
              <span className="text-[11px] font-medium text-slate-400">Core Attribute</span>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <FieldLabel required>Entity Constitution</FieldLabel>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ENTITY_TYPES.map((t) => (
                    <label
                      key={t}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                        profile.entity_type === t
                          ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="entity_type"
                        className="sr-only"
                        checked={profile.entity_type === t}
                        onChange={() => set('entity_type', t)}
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
                <FieldError msg={errors.entity_type} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Entity / Industrial Project Name</FieldLabel>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra Textile Innovations Pvt. Ltd."
                    value={profile.entity_name ?? ''}
                    onChange={(e) => set('entity_name', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <FieldError msg={errors.entity_name} />
                </div>
                <div>
                  <FieldLabel>Enterprise PAN (Optional)</FieldLabel>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. AABCT1234E"
                    value={profile.pan ?? ''}
                    onChange={(e) => set('pan', e.target.value.toUpperCase())}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase bg-white"
                  />
                  <FieldError msg={errors.pan} />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Industry Sector */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-sm">2. Industry Sector & Activity</h2>
              <span className="text-[11px] font-medium text-slate-400">Policy Matcher</span>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <FieldLabel required>Select Industry Sector</FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-1">
                  {SECTORS.map((s) => (
                    <label
                      key={s}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        profile.sector === s
                          ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="sector"
                        className="sr-only"
                        checked={profile.sector === s}
                        onChange={() => set('sector', s)}
                      />
                      <span className="truncate">{s}</span>
                    </label>
                  ))}
                </div>
                <FieldError msg={errors.sector} />
              </div>

              <div>
                <FieldLabel>Product / Manufacturing Activity Description</FieldLabel>
                <textarea
                  rows={2}
                  placeholder="e.g. Integrated textile spinning, weaving, powerloom knitting and apparel fabrication"
                  value={profile.product_description ?? ''}
                  onChange={(e) => set('product_description', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                />
                <FieldHint>Queried against official government policy gazettes for exact evidence extraction.</FieldHint>
              </div>
            </div>
          </div>

          {/* Section 3: Project Stage & Location */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-sm">3. Project Stage & Location</h2>
              <span className="text-[11px] font-medium text-slate-400">Clearance Sequencing</span>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <FieldLabel required>Project Lifecycle Stage</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {PROJECT_STAGES.map((stg) => (
                    <label
                      key={stg}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        profile.stage === stg
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="stage"
                        className="sr-only"
                        checked={profile.stage === stg}
                        onChange={() => set('stage', stg)}
                      />
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{stg}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{STAGE_DESC[stg]}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <FieldError msg={errors.stage} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <FieldLabel>District (Maharashtra)</FieldLabel>
                  <select
                    value={profile.district ?? ''}
                    onChange={(e) => set('district', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Select District --</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <FieldHint>Determines PSI-2019 Incentive Zone (Zone A, B, C, D, D+).</FieldHint>
                </div>

                <div>
                  <FieldLabel>Location / Land Type</FieldLabel>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {LOCATION_TYPES.map((lt) => (
                      <label
                        key={lt}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          profile.location_type === lt
                            ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="location_type"
                          className="sr-only"
                          checked={profile.location_type === lt}
                          onChange={() => set('location_type', lt)}
                        />
                        <span>{lt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Progressive Scale Parameters */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full bg-slate-50 hover:bg-slate-100 px-6 py-3 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">
                  4. Investment Scale & Utility Parameters
                </span>
                <span className="text-xs text-slate-500 font-normal">
                  ({showAdvanced ? 'Click to collapse' : 'Investment, Employment, Power'})
                </span>
              </div>
              <span className="text-xs font-semibold text-blue-600">
                {showAdvanced ? '▲ Less' : '▼ Expand'}
              </span>
            </button>

            {showAdvanced && (
              <div className="p-6 space-y-4 border-t border-slate-200">
                <div>
                  <FieldLabel>Proposed Capital Investment (₹ INR)</FieldLabel>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 120000000"
                    value={profile.investment_inr ?? ''}
                    onChange={(e) => set('investment_inr', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  {profile.investment_inr ? (
                    <p className="mt-1 text-xs text-slate-700 font-medium">
                      = ₹{Number(profile.investment_inr).toLocaleString('en-IN')}
                      {profile.investment_inr >= 1e7 ? ` (₹${(profile.investment_inr / 1e7).toFixed(2)} Crore)` : ''}
                    </p>
                  ) : null}
                  <FieldError msg={errors.investment_inr} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Expected Direct Employment (Persons)</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 250"
                      value={profile.employment_expected ?? ''}
                      onChange={(e) => set('employment_expected', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <FieldError msg={errors.employment_expected} />
                  </div>

                  <div>
                    <FieldLabel>Power Requirement (kW)</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 2500"
                      value={profile.power_kw ?? ''}
                      onChange={(e) => set('power_kw', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <FieldError msg={errors.power_kw} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Taluka (Optional)</FieldLabel>
                    <input
                      type="text"
                      placeholder="e.g. Haveli"
                      value={profile.taluka ?? ''}
                      onChange={(e) => set('taluka', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <FieldLabel>Land Area (sq. metres / acres)</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 10000"
                      value={profile.land_area ?? ''}
                      onChange={(e) => set('land_area', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              <strong>Error:</strong> {submitError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 pb-6">
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Reset Form
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Evaluating Statutory Rules…</span>
                </>
              ) : (
                <span>Assess Project & Generate Report →</span>
              )}
            </button>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}

export default function AssessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Assessment Module…</div>}>
      <AssessInner />
    </Suspense>
  );
}
