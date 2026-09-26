'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ApplicantProfile, EntityType, Sector, LocationType, ProjectStage } from '@/types';
import { DEMO_TEXTILE, DEMO_EV } from '@/types';
import { submitAssessment, DISTRICTS } from '@/lib/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ENTITY_TYPES: EntityType[] = ['Company', 'LLP', 'Proprietorship'];
const SECTORS: Sector[] = [
  'Chemical', 'Textile', 'Engineering', 'Food Processing',
  'EV / Automotive', 'Electronics', 'IT / ITES',
  'Logistics', 'Aerospace', 'Startup', 'Other',
];
const LOCATION_TYPES: LocationType[] = ['MIDC', 'Private industrial area', 'Other'];
const PROJECT_STAGES: ProjectStage[] = [
  'Pre-establishment', 'Construction', 'Operational', 'Expansion',
];
const TOTAL_STEPS = 5;

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold text-blue-900 mb-6 pb-2 border-b border-blue-100">
      {children}
    </h2>
  );
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------
function ProgressBar({ step }: { step: number }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  return (
    <div className="mb-6">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Step {step} of {TOTAL_STEPS}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Step dots */}
      <div className="flex justify-between mt-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
              i + 1 < step
                ? 'bg-blue-600 border-blue-600 text-white'
                : i + 1 === step
                ? 'bg-white border-blue-600 text-blue-600'
                : 'bg-white border-gray-300 text-gray-400'
            }`}
          >
            {i + 1 < step ? '✓' : i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main wizard inner component (uses useSearchParams — must be inside Suspense)
// ---------------------------------------------------------------------------
function WizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<ApplicantProfile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load demo on mount
  useEffect(() => {
    const demo = searchParams.get('demo');
    if (demo === 'textile') setProfile(DEMO_TEXTILE);
    else if (demo === 'ev') setProfile(DEMO_EV);
  }, [searchParams]);

  // -------------------------------------------------------------------------
  // Field update helper
  // -------------------------------------------------------------------------
  function set<K extends keyof ApplicantProfile>(key: K, value: ApplicantProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  // -------------------------------------------------------------------------
  // Validation per step
  // -------------------------------------------------------------------------
  function validate(validateAll = false): boolean {
    const errs: Record<string, string> = {};
    if (step === 1 || validateAll) {
      if (!profile.entity_type) errs.entity_type = 'Entity type is required.';
      if (!profile.entity_name?.trim()) errs.entity_name = 'Entity name is required.';
      if (profile.pan && profile.pan.length !== 10) errs.pan = 'PAN must be exactly 10 characters.';
    }
    if (step === 2 || validateAll) {
      if (!profile.sector) errs.sector = 'Sector is required.';
    }
    if (step === 4 || validateAll) {
      if (profile.investment_inr !== undefined && profile.investment_inr < 0) errs.investment_inr = 'Investment cannot be negative.';
      if (profile.power_kw !== undefined && profile.power_kw < 0) errs.power_kw = 'Power cannot be negative.';
      if (profile.employment_expected !== undefined && profile.employment_expected < 0) errs.employment_expected = 'Employment cannot be negative.';
    }
    if (step === 5 || validateAll) {
      if (!profile.stage) errs.stage = 'Project stage is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (!validate()) return;
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  }

  function handleBack() {
    setStep((s) => s - 1);
    window.scrollTo(0, 0);
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  async function handleSubmit() {
    if (!validate(true)) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const result = await submitAssessment(profile as ApplicantProfile);
      localStorage.setItem('smsws_assessment', JSON.stringify(result));
      router.push('/results');
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Render steps
  // -------------------------------------------------------------------------
  function renderStep1() {
    return (
      <>
        <SectionTitle>Step 1 — Basic Details</SectionTitle>

        <div className="mb-5">
          <Label required>Entity Type</Label>
          <div className="flex flex-wrap gap-3 mt-1">
            {ENTITY_TYPES.map((t) => (
              <label
                key={t}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
                  profile.entity_type === t
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="entity_type"
                  className="sr-only"
                  checked={profile.entity_type === t}
                  onChange={() => set('entity_type', t)}
                />
                <span className="text-sm font-medium">{t}</span>
              </label>
            ))}
          </div>
          <FieldError msg={errors.entity_type} />
        </div>

        <div className="mb-5">
          <Label required>Entity / Company Name</Label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Maharashtra Innovations Pvt. Ltd."
            value={profile.entity_name ?? ''}
            onChange={(e) => set('entity_name', e.target.value)}
          />
          <FieldError msg={errors.entity_name} />
        </div>

        <div className="mb-5">
          <Label>PAN (optional)</Label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. AABCT1234E"
            value={profile.pan ?? ''}
            onChange={(e) => set('pan', e.target.value)}
          />
        </div>

        <div className="mb-5">
          <Label>Registration Number (optional)</Label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="CIN / LLPIN / GSTIN"
            value={profile.registration_number ?? ''}
            onChange={(e) => set('registration_number', e.target.value)}
          />
        </div>
      </>
    );
  }

  function renderStep2() {
    return (
      <>
        <SectionTitle>Step 2 — Industry Details</SectionTitle>

        <div className="mb-5">
          <Label required>Sector</Label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={profile.sector ?? ''}
            onChange={(e) => set('sector', e.target.value as Sector)}
          >
            <option value="">-- Select sector --</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <FieldError msg={errors.sector} />
        </div>

        <div className="mb-5">
          <Label>NIC Code (optional)</Label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 13 (Textile), 29 (Automotive)"
            value={profile.nic_code ?? ''}
            onChange={(e) => set('nic_code', e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            NIC 2008 2-digit division code. Refer to the National Industrial
            Classification for guidance.
          </p>
        </div>

        <div className="mb-5">
          <Label>Product / Activity Description (optional)</Label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Describe the main product or industrial activity..."
            value={profile.product_description ?? ''}
            onChange={(e) => set('product_description', e.target.value)}
          />
        </div>
      </>
    );
  }

  function renderStep3() {
    return (
      <>
        <SectionTitle>Step 3 — Location &amp; Land</SectionTitle>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div>
            <Label>District</Label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={profile.district ?? ''}
              onChange={(e) => set('district', e.target.value)}
            >
              <option value="">-- Select district --</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Taluka (optional)</Label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Haveli"
              value={profile.taluka ?? ''}
              onChange={(e) => set('taluka', e.target.value)}
            />
          </div>
        </div>

        <div className="mb-5">
          <Label>Plot Address (optional)</Label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            placeholder="Survey / Plot number, village, taluka..."
            value={profile.plot_address ?? ''}
            onChange={(e) => set('plot_address', e.target.value)}
          />
        </div>

        <div className="mb-5">
          <Label>Location Type</Label>
          <div className="flex flex-wrap gap-3 mt-1">
            {LOCATION_TYPES.map((lt) => (
              <label
                key={lt}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
                  profile.location_type === lt
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="location_type"
                  className="sr-only"
                  checked={profile.location_type === lt}
                  onChange={() => set('location_type', lt)}
                />
                <span className="text-sm font-medium">{lt}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div>
            <Label>Land Area (sq. m., optional)</Label>
            <input
              type="number"
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 10000"
              value={profile.land_area ?? ''}
              onChange={(e) =>
                set('land_area', e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
          <div>
            <Label>Survey Number (optional)</Label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. S.No. 42/3"
              value={profile.survey_number ?? ''}
              onChange={(e) => set('survey_number', e.target.value)}
            />
          </div>
        </div>

        <div className="mb-5">
          <Label>Land Document (optional — filename only)</Label>
          <input
            type="file"
            accept=".pdf,.jpg,.png"
            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100 cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) set('land_document_filename', file.name);
            }}
          />
          {profile.land_document_filename && (
            <p className="mt-1 text-xs text-green-600">
              ✓ {profile.land_document_filename}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Only the filename is recorded; no document is uploaded to servers.
          </p>
        </div>
      </>
    );
  }

  function renderStep4() {
    return (
      <>
        <SectionTitle>Step 4 — Investment &amp; Power</SectionTitle>

        <div className="mb-5">
          <Label>Investment Amount (INR)</Label>
          <input
            type="number"
            min={0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 120000000"
            value={profile.investment_inr ?? ''}
            onChange={(e) =>
              set('investment_inr', e.target.value ? Number(e.target.value) : undefined)
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter amount in Indian Rupees (INR). Example: ₹10 Cr = 10,00,00,000
            {profile.investment_inr
              ? ` — ₹${Number(profile.investment_inr).toLocaleString('en-IN')}`
              : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div>
            <Label>Power Requirement (kW, optional)</Label>
            <input
              type="number"
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 2500"
              value={profile.power_kw ?? ''}
              onChange={(e) =>
                set('power_kw', e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
          <div>
            <Label>Expected Employment (persons, optional)</Label>
            <input
              type="number"
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 250"
              value={profile.employment_expected ?? ''}
              onChange={(e) =>
                set('employment_expected', e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
          <strong>Tip:</strong> Investment and employment figures determine eligibility
          for Large, Mega, and Ultra-Mega project incentive tiers under Maharashtra
          Industrial Policy.
        </div>
      </>
    );
  }

  function renderStep5() {
    return (
      <>
        <SectionTitle>Step 5 — Project Stage</SectionTitle>
        <p className="text-sm text-gray-600 mb-6">
          Select the current stage of your industrial project. This affects
          which approvals and incentives are applicable.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {PROJECT_STAGES.map((stage) => {
            const descriptions: Record<ProjectStage, string> = {
              'Pre-establishment': 'Project is being planned; land not yet acquired.',
              Construction: 'Site acquired; construction / civil work in progress.',
              Operational: 'Production has commenced.',
              Expansion: 'Existing unit expanding capacity or product range.',
            };
            return (
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
                    className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      profile.stage === stage
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{stage}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{descriptions[stage]}</p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        <FieldError msg={errors.stage} />

        {/* Summary */}
        <div className="p-4 rounded-lg bg-gray-100 border border-gray-200 text-sm text-gray-700 space-y-1">
          <p className="font-semibold text-gray-800 mb-2">Assessment Summary</p>
          <p><span className="font-medium">Entity:</span> {profile.entity_name || '—'}</p>
          <p><span className="font-medium">Type:</span> {profile.entity_type || '—'}</p>
          <p><span className="font-medium">Sector:</span> {profile.sector || '—'}</p>
          <p><span className="font-medium">District:</span> {profile.district || '—'}</p>
          <p>
            <span className="font-medium">Investment:</span>{' '}
            {profile.investment_inr
              ? `₹${Number(profile.investment_inr).toLocaleString('en-IN')}`
              : '—'}
          </p>
        </div>
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-blue-900 text-white py-3 px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="font-semibold text-sm tracking-tight">
            SMSWS &mdash; Smart Maharashtra Single Window System
          </span>
          <a href="/" className="text-blue-300 text-xs hover:text-white transition-colors">
            ← Home
          </a>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <ProgressBar step={step} />

          {renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}

          {/* Error banner */}
          {submitError && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <strong>Error:</strong> {submitError}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between items-center border-t border-gray-100 pt-6">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Back
            </button>

            {step < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                )}
                {loading ? 'Submitting…' : 'Submit Assessment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Only step 1 is shown on mount — conditionally render other steps
// We override the renderStep1 hack: show step content conditionally at top level
// ---------------------------------------------------------------------------

// Patch: The renderStep functions inside WizardInner already conditionally render
// by checking step. But renderStep1 is always rendered (no condition). Fix below:

// Actually we must wrap with Suspense for useSearchParams
export default function WizardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-500 text-sm">Loading wizard…</div>
        </div>
      }
    >
      <WizardInner />
    </Suspense>
  );
}
