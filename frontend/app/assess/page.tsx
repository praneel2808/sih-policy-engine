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

interface SectorCardInfo {
  sector: Sector;
  icon: string;
  tag: string;
  badgeColor: string;
  description: string;
}

const SECTOR_CARDS: SectorCardInfo[] = [
  {
    sector: 'Textile',
    icon: '🧵',
    tag: 'Textile Policy 2023-28',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Spinning, weaving, processing, technical textiles & powerlooms',
  },
  {
    sector: 'EV / Automotive',
    icon: '⚡',
    tag: 'EV Policy 2021',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Electric vehicles, battery modules, charging infra & auto-ancillary',
  },
  {
    sector: 'Chemical',
    icon: '⚗️',
    tag: 'Pollution Cat: Red',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Specialty chemicals, polymers, bulk drugs & processing units',
  },
  {
    sector: 'Electronics',
    icon: '💻',
    tag: 'ESDM Subsidies',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'PCB assembly, consumer electronics, telecom hardware & semiconductors',
  },
  {
    sector: 'Engineering',
    icon: '⚙️',
    tag: 'Capital Goods',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Heavy machinery, casting & forging, auto components & fabrication',
  },
  {
    sector: 'Food Processing',
    icon: '🌾',
    tag: 'Agro-Processing',
    badgeColor: 'bg-lime-50 text-lime-700 border-lime-200',
    description: 'Dairy, agro-produce, cold chain storage & food packaging units',
  },
  {
    sector: 'IT / ITES',
    icon: '🌐',
    tag: 'IT Policy 2023',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    description: 'Software development, BPO, data centers & tech campuses',
  },
  {
    sector: 'Logistics',
    icon: '📦',
    tag: 'Logistics Policy',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'Warehouses, dry ports, multi-modal freight & distribution hubs',
  },
  {
    sector: 'Aerospace',
    icon: '✈️',
    tag: 'Defense Cluster',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    description: 'Aviation components, MRO, defense manufacturing & precision tooling',
  },
  {
    sector: 'Startup',
    icon: '🚀',
    tag: 'MSINS Incentives',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Early-stage tech enterprises, incubators & innovation centers',
  },
  {
    sector: 'Other',
    icon: '🏭',
    tag: 'General Industry',
    badgeColor: 'bg-stone-50 text-stone-700 border-stone-200',
    description: 'Standard industrial units, packaging, consumer goods & fabrication',
  },
];

function getIncentiveTier(investmentInr?: number, employment?: number) {
  const invCr = investmentInr ? investmentInr / 1e7 : 0;
  const emp = employment || 0;

  if (invCr >= 500 || emp >= 1000) {
    return {
      tier: 'Ultra-Mega Project',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      badge: 'Cabinet Sub-Committee Slabs',
      incentiveHighlights: 'Customized subsidy package + 100% stamp duty exemption + 9-year SGST refund',
    };
  }
  if (invCr >= 250 || emp >= 500) {
    return {
      tier: 'Mega Project',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      badge: 'High-Power Committee',
      incentiveHighlights: 'Customized PSI-2019 package + priority MIDC land allotment + electricity tariff relief',
    };
  }
  if (invCr >= 50 || emp >= 250) {
    return {
      tier: 'Large Industrial Unit',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      badge: 'PSI-2019 Slabs',
      incentiveHighlights: 'Up to 60-80% SGST refund + ₹1.5/unit power tariff subsidy + 7-year electricity duty waiver',
    };
  }
  if (invCr >= 10 || emp >= 50) {
    return {
      tier: 'Medium Enterprise (MSME)',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badge: 'MSME Medium Slabs',
      incentiveHighlights: 'Capital investment subsidy + 5% interest subsidy on term loans + stamp duty exemption',
    };
  }
  if (invCr >= 1 || emp >= 10) {
    return {
      tier: 'Small Enterprise (MSME)',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      badge: 'MSME Small Slabs',
      incentiveHighlights: 'Interest subsidy on machinery loans + power tariff concession for 5 years',
    };
  }
  return {
    tier: 'Micro Enterprise (MSME)',
    color: 'bg-slate-50 text-slate-800 border-slate-200',
    badge: 'MSME Micro Slabs',
    incentiveHighlights: 'District Industries Centre (DIC) seed capital assistance + fast-track single window clearance',
  };
}

function getDistrictZone(district?: string): { zone: string; subsidy: string } {
  if (!district) return { zone: 'Select District', subsidy: 'Zone A - D+ Slabs' };
  const d = district.toLowerCase();
  if (d.includes('mumbai') || d.includes('thane') || d.includes('pune')) {
    return { zone: 'Zone A / B (Developed)', subsidy: '40-50% SGST Refund · Standard Tariffs' };
  }
  if (d.includes('nashik') || d.includes('aurangabad') || d.includes('kolhapur') || d.includes('nagpur') || d.includes('solapur')) {
    return { zone: 'Zone C / D (Developing)', subsidy: '60-80% SGST Refund · ₹1.5/unit Power Subsidy' };
  }
  if (d.includes('nandurbar') || d.includes('gadchiroli') || d.includes('washim') || d.includes('hingoli')) {
    return { zone: 'Zone D+ / Tribal (Priority)', subsidy: 'Up to 100% SGST Refund · ₹2.0/unit Power Subsidy · 10-yr Duty Waiver' };
  }
  return { zone: 'Zone D (Backward District)', subsidy: '80% SGST Refund · ₹1.5/unit Power Subsidy · 7-yr Duty Waiver' };
}

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

function formatInrRupees(val?: number): string {
  if (!val) return '₹0';
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Cr`;
  if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} Lakh`;
  return `₹${val.toLocaleString('en-IN')}`;
}

type InvestmentRangeKey = 
  | 'rupees' 
  | 'thousands' 
  | 'lakhs' 
  | 'multi_lakhs' 
  | 'crores' 
  | 'multi_crores' 
  | 'hundred_crores' 
  | 'ultra_crores';

interface InvestmentRangeConfig {
  key: InvestmentRangeKey;
  label: string;
  sub: string;
  minInr: number;
  maxInr: number;
  minValDisplay: string;
  maxValDisplay: string;
  placeholder: string;
}

const INVESTMENT_RANGES: InvestmentRangeConfig[] = [
  {
    key: 'rupees',
    label: '₹1 – ₹9,999 (Rupees)',
    sub: 'Micro Scale',
    minInr: 1,
    maxInr: 9999,
    minValDisplay: '₹1',
    maxValDisplay: '₹9,999',
    placeholder: 'e.g. 5,000',
  },
  {
    key: 'thousands',
    label: '₹10K – ₹99K (Thousands)',
    sub: 'Small Scale',
    minInr: 10000,
    maxInr: 99999,
    minValDisplay: '₹10,000',
    maxValDisplay: '₹99,999',
    placeholder: 'e.g. 50,000',
  },
  {
    key: 'lakhs',
    label: '₹1L – ₹9.9L (Single Lakhs)',
    sub: 'Lakhs Scale',
    minInr: 100000,
    maxInr: 999999,
    minValDisplay: '₹1 Lakh',
    maxValDisplay: '₹9.99 Lakhs',
    placeholder: 'e.g. 5,00,000',
  },
  {
    key: 'multi_lakhs',
    label: '₹10L – ₹99L (Tens of Lakhs)',
    sub: 'Tens of Lakhs',
    minInr: 1000000,
    maxInr: 9999999,
    minValDisplay: '₹10 Lakhs',
    maxValDisplay: '₹99.99 Lakhs',
    placeholder: 'e.g. 50,00,000',
  },
  {
    key: 'crores',
    label: '₹1 Cr – ₹9.9 Cr (Single Crores)',
    sub: 'Single Crores',
    minInr: 10000000,
    maxInr: 99999999,
    minValDisplay: '₹1 Crore',
    maxValDisplay: '₹9.99 Crores',
    placeholder: 'e.g. 2,00,00,000',
  },
  {
    key: 'multi_crores',
    label: '₹10 Cr – ₹99 Cr (Tens of Crores)',
    sub: 'Tens of Crores',
    minInr: 100000000,
    maxInr: 999999999,
    minValDisplay: '₹10 Crores',
    maxValDisplay: '₹99.99 Crores',
    placeholder: 'e.g. 50,00,00,000',
  },
  {
    key: 'hundred_crores',
    label: '₹100 Cr – ₹999 Cr (Hundreds of Crores)',
    sub: 'Hundreds of Crores',
    minInr: 1000000000,
    maxInr: 9999999999,
    minValDisplay: '₹100 Crores',
    maxValDisplay: '₹999 Crores',
    placeholder: 'e.g. 500,00,00,000',
  },
  {
    key: 'ultra_crores',
    label: '₹1,000 Cr+ (Ultra-Mega)',
    sub: 'Ultra-Mega Scale',
    minInr: 10000000000,
    maxInr: Infinity,
    minValDisplay: '₹1,000 Crores',
    maxValDisplay: 'Unlimited',
    placeholder: 'e.g. 2500,00,00,000',
  },
];

type EmploymentRangeKey = 'micro_jobs' | 'small_jobs' | 'medium_jobs' | 'large_jobs' | 'mega_jobs';

interface EmploymentRangeConfig {
  key: EmploymentRangeKey;
  label: string;
  sub: string;
  minEmp: number;
  maxEmp: number;
  minValDisplay: string;
  maxValDisplay: string;
  placeholder: string;
}

const EMPLOYMENT_RANGES: EmploymentRangeConfig[] = [
  {
    key: 'micro_jobs',
    label: '1 – 9 Persons',
    sub: 'Micro Team',
    minEmp: 1,
    maxEmp: 9,
    minValDisplay: '1 Person',
    maxValDisplay: '9 Persons',
    placeholder: 'e.g. 5',
  },
  {
    key: 'small_jobs',
    label: '10 – 49 Persons',
    sub: 'Small Unit',
    minEmp: 10,
    maxEmp: 49,
    minValDisplay: '10 Persons',
    maxValDisplay: '49 Persons',
    placeholder: 'e.g. 25',
  },
  {
    key: 'medium_jobs',
    label: '50 – 249 Persons',
    sub: 'Medium Industry',
    minEmp: 50,
    maxEmp: 249,
    minValDisplay: '50 Persons',
    maxValDisplay: '249 Persons',
    placeholder: 'e.g. 120',
  },
  {
    key: 'large_jobs',
    label: '250 – 999 Persons',
    sub: 'Large Enterprise',
    minEmp: 250,
    maxEmp: 999,
    minValDisplay: '250 Persons',
    maxValDisplay: '999 Persons',
    placeholder: 'e.g. 500',
  },
  {
    key: 'mega_jobs',
    label: '1,000+ Persons',
    sub: 'Mega Employer',
    minEmp: 1000,
    maxEmp: Infinity,
    minValDisplay: '1,000 Persons',
    maxValDisplay: 'Unlimited',
    placeholder: 'e.g. 2500',
  },
];

function AssessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profile, setProfile] = useState<Partial<ApplicantProfile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedRangeKey, setSelectedRangeKey] = useState<InvestmentRangeKey>('crores');
  const [typedRangeVal, setTypedRangeVal] = useState<string>('');
  const [rangeWarning, setRangeWarning] = useState<string | null>(null);

  const [selectedEmpRangeKey, setSelectedEmpRangeKey] = useState<EmploymentRangeKey>('medium_jobs');
  const [typedEmpVal, setTypedEmpVal] = useState<string>('');
  const [empRangeWarning, setEmpRangeWarning] = useState<string | null>(null);

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
  const tierInfo = getIncentiveTier(profile.investment_inr, profile.employment_expected);
  const zoneInfo = getDistrictZone(profile.district);
  const invInrValue = profile.investment_inr ?? 0;
  const invCrValue = profile.investment_inr ? Number((profile.investment_inr / 1e7).toFixed(2)) : 0;
  const empValue = profile.employment_expected ?? 0;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-600">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Clearance Studio</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <img
                src="/maharashtra-emblem.png"
                alt="Maharashtra State Emblem"
                className="w-7 h-7 object-contain shrink-0"
              />
              <span>Industrial Clearance Studio</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                Single Window Assessment
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live deterministic regulatory sequencing, department clearance identification, and state incentive mapping.
            </p>
          </div>

          {/* Quick Demo Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadDemo('textile')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>🧵</span>
              <span>Demo: Textile</span>
            </button>
            <button
              type="button"
              onClick={() => loadDemo('ev')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>🚗</span>
              <span>Demo: EV</span>
            </button>
            {Object.keys(profile).length > 0 && (
              <button
                type="button"
                onClick={resetForm}
                className="px-2.5 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs rounded-xl transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* The Clearance Highway - Visual 4-Stage Regulatory Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>🛣️</span>
                <span>Maharashtra Industrial Clearance Highway</span>
              </p>
              <p className="text-[11px] text-slate-500">Click any stage to filter statutory sequencing:</p>
            </div>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
              MAITRI Single Window Flow
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 relative">
            {[
              {
                step: '01',
                title: 'Planning & Site',
                sub: 'MPCB Consent to Establish',
                days: '30-45 Days',
                icon: '🌱',
                stageKey: 'Pre-establishment' as ProjectStage,
              },
              {
                step: '02',
                title: 'Land & Civil',
                sub: 'MIDC Plot & Building Plan',
                days: '15-30 Days',
                icon: '🏗️',
                stageKey: 'Construction' as ProjectStage,
              },
              {
                step: '03',
                title: 'Factory Licensing',
                sub: 'DISH Safety & Factory Act',
                days: '15 Days',
                icon: '🏭',
                stageKey: 'Operational' as ProjectStage,
              },
              {
                step: '04',
                title: 'State Subsidies',
                sub: 'PSI-2019 / Sector Policies',
                days: 'Fiscal Year',
                icon: '💰',
                stageKey: 'Expansion' as ProjectStage,
              },
            ].map((st) => {
              const isSelected = profile.stage === st.stageKey;
              return (
                <div
                  key={st.step}
                  onClick={() => set('stage', st.stageKey)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{st.icon}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">STAGE {st.step}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-1">{st.title}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{st.sub}</p>
                  <span className={`inline-block mt-2 text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                    isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200/80'
                  }`}>
                    ⏱️ {st.days}
                  </span>
                </div>
              );
            })}
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

        {/* Split Grid: Left Form (8 cols) + Right Live Dossier (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Form Column */}
          <div className="lg:col-span-8 space-y-5">

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-1.5">
                  {SECTOR_CARDS.map((card) => {
                    const isSelected = profile.sector === card.sector;
                    return (
                      <div
                        key={card.sector}
                        onClick={() => set('sector', card.sector)}
                        className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl shrink-0 p-1 rounded-lg bg-slate-100/80">{card.icon}</span>
                            <div>
                              <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                {card.sector}
                              </p>
                              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${card.badgeColor}`}>
                                {card.tag}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    );
                  })}
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
          {/* Section 4: Interactive Investment & Employment Scale */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">
                  4. Investment Scale & Dynamic Subsidy Calculator
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold">
                  Interactive Slabs
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">Live Incentive Tier</span>
            </div>

            <div className="p-6 space-y-6">
              {/* Dynamic Live Incentive Tier Banner */}
              <div className={`p-4 rounded-xl border transition-all ${tierInfo.color}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/90 border border-current/20 flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                      🏆
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider">{tierInfo.tier}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 border border-current/20 shadow-xs">
                          {tierInfo.badge}
                        </span>
                      </div>
                      <p className="text-xs mt-1 font-medium leading-relaxed opacity-95">
                        {tierInfo.incentiveHighlights}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-current/10">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">Configured Scale</span>
                    <p className="text-xs font-bold">
                      {formatInrRupees(invInrValue)} · {empValue} {empValue === 1 ? 'Person' : 'Persons'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Capital Investment Range Selector & Input */}
              <div className="space-y-5 bg-slate-50/70 p-5 rounded-xl border border-slate-200/80">
                <div>
                  <FieldLabel required>Proposed Capital Investment Range</FieldLabel>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select an investment range scale first, then enter your exact capital figure.
                  </p>
                </div>

                {/* Range Buttons Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {INVESTMENT_RANGES.map((rng) => {
                    const isSelected = selectedRangeKey === rng.key;
                    return (
                      <button
                        key={rng.key}
                        type="button"
                        onClick={() => {
                          setSelectedRangeKey(rng.key);
                          setRangeWarning(null);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/30 shadow-sm'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:bg-slate-100/70'
                        }`}
                      >
                        <p className="text-xs font-bold">{rng.label}</p>
                        <p className={`text-[11px] mt-0.5 font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                          {rng.sub}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Range Input & Real-Time Validation Area */}
                {selectedRangeKey && (() => {
                  const currentConfig = INVESTMENT_RANGES.find((r) => r.key === selectedRangeKey)!;
                  return (
                    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-800 block">
                            Enter Exact Capital Investment Amount (in Rupees)
                          </label>
                          <span className="text-[11px] text-slate-500">
                            Selected range category bounds: <strong className="text-slate-700">{currentConfig.sub}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-500">₹</span>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            placeholder={currentConfig.placeholder}
                            value={typedRangeVal}
                            onChange={(e) => {
                              const inputRaw = e.target.value;
                              setTypedRangeVal(inputRaw);
                              if (inputRaw === '') {
                                set('investment_inr', undefined);
                                setRangeWarning(null);
                                return;
                              }
                              const amountInr = parseInt(inputRaw, 10);
                              if (isNaN(amountInr)) return;

                              set('investment_inr', amountInr);

                              if (amountInr < currentConfig.minInr || amountInr > currentConfig.maxInr) {
                                setRangeWarning(
                                  `⚠️ Range Mismatch Warning: ₹${amountInr.toLocaleString('en-IN')} is outside your selected range category (${currentConfig.sub}). Category valid bounds: ${currentConfig.minValDisplay} to ${currentConfig.maxValDisplay}.`
                                );
                              } else {
                                setRangeWarning(null);
                              }
                            }}
                            className={`w-52 text-right border rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 shadow-xs ${
                              rangeWarning ? 'border-amber-400 bg-amber-50/40 focus:ring-amber-500' : 'border-slate-300 bg-white focus:ring-blue-500'
                            }`}
                          />
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg shrink-0">
                            Rupees (₹)
                          </span>
                        </div>
                      </div>

                      {/* Out of Range Warning Banner */}
                      {rangeWarning && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2 text-xs font-medium">
                          <span className="text-sm shrink-0">🚨</span>
                          <p>{rangeWarning}</p>
                        </div>
                      )}

                      {/* Live Calculated Equivalent in Words */}
                      {profile.investment_inr !== undefined && profile.investment_inr > 0 && (
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-600">
                          <span>Formatted Scale Reading:</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            {formatInrRupees(profile.investment_inr)} (Exact: ₹{profile.investment_inr.toLocaleString('en-IN')})
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <FieldError msg={errors.investment_inr} />
              </div>

              {/* Direct Employment Range Selector & Input */}
              <div className="space-y-5 bg-slate-50/70 p-5 rounded-xl border border-slate-200/80">
                <div>
                  <FieldLabel required>Expected Direct Employment Scale</FieldLabel>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select an employment scale bracket first, then enter your exact manpower / headcount figure.
                  </p>
                </div>

                {/* Range Buttons Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {EMPLOYMENT_RANGES.map((rng) => {
                    const isSelected = selectedEmpRangeKey === rng.key;
                    return (
                      <button
                        key={rng.key}
                        type="button"
                        onClick={() => {
                          setSelectedEmpRangeKey(rng.key);
                          setEmpRangeWarning(null);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/30 shadow-sm'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:bg-slate-100/70'
                        }`}
                      >
                        <p className="text-xs font-bold">{rng.label}</p>
                        <p className={`text-[11px] mt-0.5 font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                          {rng.sub}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Range Input & Real-Time Validation Area */}
                {selectedEmpRangeKey && (() => {
                  const currentEmpConfig = EMPLOYMENT_RANGES.find((r) => r.key === selectedEmpRangeKey)!;
                  return (
                    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-800 block">
                            Enter Exact Number of People / Workers
                          </label>
                          <span className="text-[11px] text-slate-500">
                            Selected bracket range: <strong className="text-slate-700">{currentEmpConfig.label}</strong> ({currentEmpConfig.sub})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            placeholder={currentEmpConfig.placeholder}
                            value={typedEmpVal}
                            onChange={(e) => {
                              const inputRaw = e.target.value;
                              setTypedEmpVal(inputRaw);
                              if (inputRaw === '') {
                                set('employment_expected', undefined);
                                setEmpRangeWarning(null);
                                return;
                              }
                              const count = parseInt(inputRaw, 10);
                              if (isNaN(count)) return;

                              set('employment_expected', count);

                              if (count < currentEmpConfig.minEmp || count > currentEmpConfig.maxEmp) {
                                setEmpRangeWarning(
                                  `⚠️ Range Mismatch Warning: ${count} Persons is outside your selected employment bracket (${currentEmpConfig.label}). Category valid bounds: ${currentEmpConfig.minValDisplay} to ${currentEmpConfig.maxValDisplay}.`
                                );
                              } else {
                                setEmpRangeWarning(null);
                              }
                            }}
                            className={`w-44 text-right border rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 shadow-xs ${
                              empRangeWarning ? 'border-amber-400 bg-amber-50/40 focus:ring-amber-500' : 'border-slate-300 bg-white focus:ring-blue-500'
                            }`}
                          />
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg shrink-0">
                            {empValue === 1 ? 'Person' : 'Persons'}
                          </span>
                        </div>
                      </div>

                      {/* Out of Range Warning Banner */}
                      {empRangeWarning && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2 text-xs font-medium">
                          <span className="text-sm shrink-0">🚨</span>
                          <p>{empRangeWarning}</p>
                        </div>
                      )}

                      {/* Live Manpower Counter Display */}
                      {empValue !== undefined && empValue > 0 && (
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-600">
                          <span>Registered Direct Employment:</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            👥 {empValue} {empValue === 1 ? 'Person' : 'Full-Time Workers'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <FieldError msg={errors.employment_expected} />
              </div>

              {/* Utility & Location Specifics */}
              <div className="pt-2 border-t border-slate-200/80">
                <p className="text-xs font-semibold text-slate-700 mb-3">Site Utilities & Additional Parameters (Optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <FieldLabel>Power Requirement (kW)</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 1500"
                      value={profile.power_kw ?? ''}
                      onChange={(e) => set('power_kw', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <FieldError msg={errors.power_kw} />
                  </div>

                  <div>
                    <FieldLabel>Taluka</FieldLabel>
                    <input
                      type="text"
                      placeholder="e.g. Haveli"
                      value={profile.taluka ?? ''}
                      onChange={(e) => set('taluka', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <FieldLabel>Land Area (sq. metres)</FieldLabel>
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
            </div>
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
          {/* End Left Form Column */}

          {/* Right Sticky Live Statutory Dossier Column */}
          <div className="lg:col-span-4 sticky top-20 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live Dossier</p>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  REAL-TIME SYNC
                </span>
              </div>

              {/* Enterprise Snapshot */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Enterprise</span>
                <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                  {profile.entity_name?.trim() || 'Untitled Industrial Project'}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    {profile.sector || 'Select Sector'}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {profile.entity_type || 'Entity Type'}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {profile.stage || 'Stage'}
                  </span>
                </div>
              </div>

              {/* Location & Incentive Zone */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Location & Zone</span>
                  <span className="text-[10px] font-bold text-blue-700">{zoneInfo.zone}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 mt-1">
                  {profile.district ? `${profile.district} District` : 'All Maharashtra'} · {profile.location_type || 'Land Type'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {zoneInfo.subsidy}
                </p>
              </div>

              {/* Live Incentive Tier Meter */}
              <div className={`p-3.5 rounded-xl border ${tierInfo.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold opacity-75">Statutory Slabs</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/80 border border-current/20">
                    {tierInfo.badge}
                  </span>
                </div>
                <p className="text-xs font-bold mt-1">{tierInfo.tier}</p>
                <p className="text-[11px] mt-1 opacity-90 leading-relaxed">
                  {tierInfo.incentiveHighlights}
                </p>
              </div>

              {/* Configured Metrics Summary */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Capital</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatInrRupees(invInrValue)}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Employment</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {empValue} {empValue === 1 ? 'Person' : 'Persons'}
                  </p>
                </div>
              </div>

              {/* Primary Assessment CTA */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-xs transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Evaluating Rules…</span>
                  </>
                ) : (
                  <span>Generate Statutory Report →</span>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Deterministic Rules Engine</span>
                <span className="text-emerald-600 font-medium">✓ Authoritative Citations</span>
              </div>
            </div>
          </div>
          {/* End Right Column */}

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
