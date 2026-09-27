'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { ApplicantProfile, EntityType, Sector, LocationType, ProjectStage } from '@/types';
import { DEMO_TEXTILE, DEMO_EV } from '@/types';
import { submitAssessment, DISTRICTS } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

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

function HighwayPhaseIcon({ step }: { step: string }) {
  switch (step) {
    case '01':
      return (
        <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      );
    case '02':
      return (
        <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case '03':
      return (
        <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case '04':
      return (
        <svg className="w-5 h-5 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.5 4.5H6.5h3a4 4 0 010 8H6.5m3 0 5 8M6.5 8.5h11" />
        </svg>
      );
    default:
      return null;
  }
}

function SectorMatureIcon({ sector }: { sector: Sector }) {
  switch (sector) {
    case 'Textile':
      return (
        <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16M7 4v16M12 4v16M17 4v16" />
        </svg>
      );
    case 'EV / Automotive':
      return (
        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'Chemical':
      return (
        <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      );
    case 'Electronics':
      return (
        <svg className="w-5 h-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      );
    case 'Engineering':
      return (
        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'Food Processing':
      return (
        <svg className="w-5 h-5 text-lime-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      );
    case 'IT / ITES':
      return (
        <svg className="w-5 h-5 text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      );
    case 'Logistics':
      return (
        <svg className="w-5 h-5 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'Aerospace':
      return (
        <svg className="w-5 h-5 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      );
    case 'Startup':
      return (
        <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'Other':
    default:
      return (
        <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
  }
}

function getIncentiveTier(investmentInr?: number, employment?: number, t?: (k: string, d?: string) => string) {
  const invCr = investmentInr ? investmentInr / 1e7 : 0;
  const emp = employment || 0;

  if (invCr >= 500 || emp >= 1000) {
    return {
      tier: t ? t('tier.ultra', 'Ultra-Mega Project') : 'Ultra-Mega Project',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      badge: t ? t('tier.ultra_badge', 'Cabinet Sub-Committee Slabs') : 'Cabinet Sub-Committee Slabs',
      incentiveHighlights: t
        ? t('tier.ultra_hl', 'Customized subsidy package + 100% stamp duty exemption + 9-year SGST refund')
        : 'Customized subsidy package + 100% stamp duty exemption + 9-year SGST refund',
    };
  }
  if (invCr >= 250 || emp >= 500) {
    return {
      tier: t ? t('tier.mega', 'Mega Project') : 'Mega Project',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      badge: t ? t('tier.mega_badge', 'High-Power Committee') : 'High-Power Committee',
      incentiveHighlights: t
        ? t('tier.mega_hl', 'Customized PSI-2019 package + priority MIDC land allotment + electricity tariff relief')
        : 'Customized PSI-2019 package + priority MIDC land allotment + electricity tariff relief',
    };
  }
  if (invCr >= 50 || emp >= 250) {
    return {
      tier: t ? t('tier.large', 'Large Industrial Unit') : 'Large Industrial Unit',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      badge: t ? t('tier.large_badge', 'PSI-2019 Slabs') : 'PSI-2019 Slabs',
      incentiveHighlights: t
        ? t('tier.large_hl', 'Up to 60-80% SGST refund + ₹1.5/unit power tariff subsidy + 7-year electricity duty waiver')
        : 'Up to 60-80% SGST refund + ₹1.5/unit power tariff subsidy + 7-year electricity duty waiver',
    };
  }
  if (invCr >= 10 || emp >= 50) {
    return {
      tier: t ? t('tier.medium', 'Medium Enterprise (MSME)') : 'Medium Enterprise (MSME)',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badge: t ? t('tier.medium_badge', 'MSME Medium Slabs') : 'MSME Medium Slabs',
      incentiveHighlights: t
        ? t('tier.medium_hl', 'Capital investment subsidy + 5% interest subsidy on term loans + stamp duty exemption')
        : 'Capital investment subsidy + 5% interest subsidy on term loans + stamp duty exemption',
    };
  }
  if (invCr >= 1 || emp >= 10) {
    return {
      tier: t ? t('tier.small', 'Small Enterprise (MSME)') : 'Small Enterprise (MSME)',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      badge: t ? t('tier.small_badge', 'MSME Small Slabs') : 'MSME Small Slabs',
      incentiveHighlights: t
        ? t('tier.small_hl', 'Interest subsidy on machinery loans + power tariff concession for 5 years')
        : 'Interest subsidy on machinery loans + power tariff concession for 5 years',
    };
  }
  return {
    tier: t ? t('tier.micro', 'Micro Enterprise (MSME)') : 'Micro Enterprise (MSME)',
    color: 'bg-slate-50 text-slate-800 border-slate-200',
    badge: t ? t('tier.micro_badge', 'MSME Micro Slabs') : 'MSME Micro Slabs',
    incentiveHighlights: t
      ? t('tier.micro_hl', 'District Industries Centre (DIC) seed capital assistance + fast-track single window clearance')
      : 'District Industries Centre (DIC) seed capital assistance + fast-track single window clearance',
  };
}

function getDistrictZone(district?: string, t?: (k: string, d?: string) => string): { zone: string; subsidy: string } {
  if (!district) return {
    zone: '',
    subsidy: '',
  };
  const d = district.toLowerCase();
  if (d.includes('mumbai') || d.includes('thane') || d.includes('pune')) {
    return {
      zone: t ? t('zone.a_b', 'Zone A / B (Developed)') : 'Zone A / B (Developed)',
      subsidy: t ? t('zone.a_b_sub', '40-50% SGST Refund · Standard Tariffs') : '40-50% SGST Refund · Standard Tariffs',
    };
  }
  if (d.includes('nashik') || d.includes('aurangabad') || d.includes('kolhapur') || d.includes('nagpur') || d.includes('solapur')) {
    return {
      zone: t ? t('zone.c_d', 'Zone C / D (Developing)') : 'Zone C / D (Developing)',
      subsidy: t ? t('zone.c_d_sub', '60-80% SGST Refund · ₹1.5/unit Power Subsidy') : '60-80% SGST Refund · ₹1.5/unit Power Subsidy',
    };
  }
  if (d.includes('nandurbar') || d.includes('gadchiroli') || d.includes('washim') || d.includes('hingoli')) {
    return {
      zone: t ? t('zone.d_plus', 'Zone D+ / Tribal (Priority)') : 'Zone D+ / Tribal (Priority)',
      subsidy: t ? t('zone.d_plus_sub', 'Up to 100% SGST Refund · ₹2.0/unit Power Subsidy · 10-yr Duty Waiver') : 'Up to 100% SGST Refund · ₹2.0/unit Power Subsidy · 10-yr Duty Waiver',
    };
  }
  return {
    zone: t ? t('zone.d_backward', 'Zone D (Backward District)') : 'Zone D (Backward District)',
    subsidy: t ? t('zone.d_backward_sub', '80% SGST Refund · ₹1.5/unit Power Subsidy · 7-yr Duty Waiver') : '80% SGST Refund · ₹1.5/unit Power Subsidy · 7-yr Duty Waiver',
  };
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
  const { t } = useLanguage();

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

  function handlePanChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toUpperCase();
    const clean = raw.replace(/[^A-Z0-9]/g, '').slice(0, 10);
    set('pan', clean);

    if (!clean) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.pan;
        return copy;
      });
      return;
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    if (clean.length < 10) {
      setErrors((prev) => ({
        ...prev,
        pan: `Incomplete PAN (${clean.length}/10). Standard format: 5 letters, 4 digits, 1 letter (e.g. AABCT1234E).`,
      }));
    } else if (!panRegex.test(clean)) {
      setErrors((prev) => ({
        ...prev,
        pan: 'Invalid PAN format. Must be 5 letters followed by 4 digits and 1 letter (e.g. AABCT1234E).',
      }));
    } else {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.pan;
        return copy;
      });
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!profile.entity_type) errs.entity_type = 'Entity type is required.';
    if (!profile.entity_name?.trim()) errs.entity_name = 'Entity / project name is required.';
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    if (profile.pan && !panRegex.test(profile.pan)) {
      errs.pan = 'Please enter a valid 10-character PAN in the required format: 5 letters, 4 digits, 1 letter (e.g. AABCT1234E).';
    }
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

  const topErrors = Object.entries(errors)
    .filter(([key]) => key !== 'pan')
    .map(([, val]) => val);
  const hasTopErrors = topErrors.length > 0;
  const tierInfo = getIncentiveTier(profile.investment_inr, profile.employment_expected, t);
  const zoneInfo = getDistrictZone(profile.district, t);
  const invInrValue = profile.investment_inr ?? 0;
  const invCrValue = profile.investment_inr ? Number((profile.investment_inr / 1e7).toFixed(2)) : 0;
  const empValue = profile.employment_expected ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6 w-full">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-600">{t('nav.dashboard', 'Dashboard')}</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">{t('assess.title', 'Clearance Studio')}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <img
                src="/maharashtra-emblem.png"
                alt="Maharashtra State Emblem"
                className="w-7 h-7 object-contain shrink-0"
              />
              <span>{t('assess.title', 'Industrial Clearance Studio')}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                {t('maitri.single_window', 'MAITRI Single Window')}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('assess.subtitle', 'Live deterministic regulatory sequencing, department clearance identification, and state incentive mapping.')}
            </p>
          </div>

          {/* Quick Demo Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadDemo('textile')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              <span>{t('demo.textile', 'Demo: Textile')}</span>
            </button>
            <button
              type="button"
              onClick={() => loadDemo('ev')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              <span>{t('demo.ev', 'Demo: EV')}</span>
            </button>
            {Object.keys(profile).length > 0 && (
              <button
                type="button"
                onClick={resetForm}
                className="px-2.5 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs rounded-xl transition-colors"
              >
                {t('assess.reset_form', 'Reset')}
              </button>
            )}
          </div>
        </div>

        {/* The Clearance Highway - Visual 4-Stage Regulatory Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19L8.5 5h7L20 19M4 19h16M12 7v2m0 3v2m0 3v2" />
                  </svg>
                </div>
                <span>{t('dash.highway_title', 'Maharashtra Industrial Clearance Highway')}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{t('highway.filter_sub', 'Click any stage to filter statutory sequencing:')}</p>
            </div>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
              {t('highway.flow_badge', 'MAITRI Single Window Flow')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 relative">
            {[
              {
                step: '01',
                title: t('dash.phase1_title', 'Planning & Site'),
                sub: t('highway.phase1_sub', 'MPCB Consent to Establish'),
                days: t('highway.phase1_days', '30-45 Days'),
                stageKey: 'Pre-establishment' as ProjectStage,
              },
              {
                step: '02',
                title: t('dash.phase2_title', 'Land & Civil'),
                sub: t('highway.phase2_sub', 'MIDC Plot & Building Plan'),
                days: t('highway.phase2_days', '15-30 Days'),
                stageKey: 'Construction' as ProjectStage,
              },
              {
                step: '03',
                title: t('dash.phase3_title', 'Factory Licensing'),
                sub: t('highway.phase3_sub', 'DISH Safety & Factory Act'),
                days: t('highway.phase3_days', '15 Days'),
                stageKey: 'Operational' as ProjectStage,
              },
              {
                step: '04',
                title: t('dash.phase4_title', 'State Subsidies'),
                sub: t('highway.phase4_sub', 'PSI-2019 / Sector Policies'),
                days: t('highway.phase4_days', 'Fiscal Year'),
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
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shadow-2xs">
                      <HighwayPhaseIcon step={st.step} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">{t('stage.prefix', 'STAGE')} {st.step}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-2">{st.title}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{st.sub}</p>
                  <span className={`inline-flex items-center gap-1 mt-2.5 text-[9px] font-semibold px-2 py-0.5 rounded border ${
                    isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200/80'
                  }`}>
                    <svg className="w-2.5 h-2.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{st.days}</span>
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
              <p className="font-bold text-xs text-slate-900">{t('demo.loaded_title', 'DEMO INDUSTRIAL PROJECT DATA LOADED')}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {t('demo.loaded_desc', 'Pre-filled with verified enterprise profile parameters. Click Assess Project to generate statutory report.')}
              </p>
            </div>
            <button
              onClick={resetForm}
              className="text-xs text-slate-600 hover:text-slate-900 underline font-medium shrink-0 ml-2"
            >
              {t('demo.clear', 'Clear')}
            </button>
          </div>
        )}

        {/* Validation Errors */}
        {hasTopErrors && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-red-800 font-semibold text-xs uppercase tracking-wider mb-1">Required Fields Missing:</p>
            <ul className="space-y-0.5">
              {topErrors.map((e, i) => (
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
              <h2 className="font-bold text-slate-800 text-sm">{t('assess.section1', '1. Enterprise Identity & Basic Details')}</h2>
              <span className="text-[11px] font-medium text-slate-400">Core Attribute</span>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <FieldLabel required>{t('assess.entity_type', 'Entity Constitution')}</FieldLabel>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ENTITY_TYPES.map((typeItem) => (
                    <label
                      key={typeItem}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                        profile.entity_type === typeItem
                          ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="entity_type"
                        className="sr-only"
                        checked={profile.entity_type === typeItem}
                        onChange={() => set('entity_type', typeItem)}
                      />
                      <span>{t('entity.' + typeItem, typeItem)}</span>
                    </label>
                  ))}
                </div>
                <FieldError msg={errors.entity_type} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>{t('assess.entity_name', 'Entity / Industrial Project Name')}</FieldLabel>
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
                  <div className="flex items-center justify-between">
                    <FieldLabel>{t('assess.pan', 'Enterprise PAN (Optional)')}</FieldLabel>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      {profile.pan ? `${profile.pan.length}/10` : 'Format: AAAAA9999A'}
                    </span>
                  </div>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. AABCT1234E"
                      value={profile.pan ?? ''}
                      onChange={handlePanChange}
                      className={`w-full border rounded-lg pl-3 pr-8 py-2 text-xs focus:outline-none focus:ring-2 font-mono uppercase bg-white transition-colors ${
                        errors.pan
                          ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/20 text-rose-900'
                          : profile.pan && profile.pan.length === 10
                          ? 'border-emerald-300 focus:ring-emerald-400 bg-emerald-50/20 text-emerald-900'
                          : 'border-slate-300 focus:ring-blue-500 text-slate-800'
                      }`}
                    />
                    {profile.pan && profile.pan.length === 10 && !errors.pan && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs" title="Valid PAN Format">
                        ✓
                      </span>
                    )}
                  </div>
                  {errors.pan ? (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.pan}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      5 Letters · 4 Digits · 1 Letter (Income Tax Department Govt. of India standard)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Industry Sector */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-sm">{t('assess.section2', '2. Industry Sector & Activity')}</h2>
              <span className="text-[11px] font-medium text-slate-400">Policy Matcher</span>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <FieldLabel required>{t('calc.sector', 'Select Industry Sector')}</FieldLabel>
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
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/80">
                              <SectorMatureIcon sector={card.sector} />
                            </div>
                            <div>
                              <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                {t('sector.' + card.sector, card.sector)}
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
                <FieldLabel>{t('assess.product_desc', 'Product / Manufacturing Activity Description')}</FieldLabel>
                <textarea
                  rows={2}
                  placeholder="e.g. Integrated textile spinning, weaving, powerloom knitting and apparel fabrication"
                  value={profile.product_description ?? ''}
                  onChange={(e) => set('product_description', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                />
                <FieldHint>{t('assess.product_desc_hint', 'Queried against official government policy gazettes for exact evidence extraction.')}</FieldHint>
              </div>
            </div>
          </div>

          {/* Section 3: Project Stage & Location */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-sm">{t('assess.section3', '3. Project Stage & Location')}</h2>
              <span className="text-[11px] font-medium text-slate-400">{t('assess.clearance_seq', 'Clearance Sequencing')}</span>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <FieldLabel required>{t('assess.stage', 'Project Lifecycle Stage')}</FieldLabel>
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
                        <p className="font-bold text-slate-900 text-xs">{t('stage.' + stg, stg)}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{t('stage_desc.' + stg, STAGE_DESC[stg])}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <FieldError msg={errors.stage} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <FieldLabel>{t('assess.district', 'District (Maharashtra)')}</FieldLabel>
                  <select
                    value={profile.district ?? ''}
                    onChange={(e) => set('district', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">{t('assess.select_district', '-- Select District --')}</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <FieldHint>{t('assess.psi_zone_hint', 'Determines PSI-2019 Incentive Zone (Zone A, B, C, D, D+).')}</FieldHint>
                </div>

                <div>
                  <FieldLabel>{t('assess.location', 'Location / Land Type')}</FieldLabel>
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
                        <span>{t('location.' + lt, lt)}</span>
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
                  {t('assess.section4', '4. Capital Investment & Employment')}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold">
                  {t('assess.interactive_slabs', 'Interactive Slabs')}
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">{t('assess.live_incentive_tier', 'Live Incentive Tier')}</span>
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
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">{t('assess.configured_scale', 'Configured Scale')}</span>
                    <p className="text-xs font-bold">
                      {formatInrRupees(invInrValue)} · {empValue} {empValue === 1 ? t('assess.person', 'Person') : t('assess.persons', 'Persons')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Capital Investment Range Selector & Input */}
              <div className="space-y-5 bg-slate-50/70 p-5 rounded-xl border border-slate-200/80">
                <div>
                  <FieldLabel required>{t('assess.prop_cap_inv', 'Proposed Capital Investment Range')}</FieldLabel>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('assess.select_inv_scale_desc', 'Select an investment range scale first, then enter your exact capital figure.')}
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
                          {t('rng.' + rng.key, rng.sub)}
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
                            {t('assess.enter_exact_inv', 'Enter Exact Capital Investment Amount (in Rupees)')}
                          </label>
                          <span className="text-[11px] text-slate-500">
                            {t('assess.selected_bounds', 'Selected range category bounds:')} <strong className="text-slate-700">{t('rng.' + currentConfig.key, currentConfig.sub)}</strong>
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

                              if (amountInr > 10_000_000_000) {
                                setRangeWarning(
                                  `⚠️ High Capital Investment Notice: You entered ₹${(amountInr / 1e7).toLocaleString('en-IN')} Cr (₹${amountInr.toLocaleString('en-IN')}). Please recheck your numerical entry to verify the amount is in Rupees.`
                                );
                              } else if (amountInr < currentConfig.minInr || amountInr > currentConfig.maxInr) {
                                setRangeWarning(
                                  `⚠️ Range Mismatch Warning: ₹${amountInr.toLocaleString('en-IN')} is outside your selected range category (${t('rng.' + currentConfig.key, currentConfig.sub)}). Category valid bounds: ${currentConfig.minValDisplay} to ${currentConfig.maxValDisplay}.`
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
                            {t('assess.rupees_inr', 'Rupees (₹)')}
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
                          <span>{t('assess.scale_reading', 'Formatted Scale Reading:')}</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            {formatInrRupees(profile.investment_inr)} ({t('assess.exact', 'Exact:')} ₹{profile.investment_inr.toLocaleString('en-IN')})
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
                  <FieldLabel required>{t('assess.exp_employment_scale', 'Expected Direct Employment Scale')}</FieldLabel>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('assess.select_emp_bracket_desc', 'Select an employment scale bracket first, then enter your exact manpower / headcount figure.')}
                  </p>
                </div>

                {/* Range Buttons Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {EMPLOYMENT_RANGES.map((rng) => {
                    const isSelected = selectedEmpRangeKey === rng.key;
                    const subLabel = t('emp.' + rng.key.replace('_jobs', ''), rng.sub);
                    const displayLabel = rng.label
                      .replace('Persons', t('assess.persons', 'Persons'))
                      .replace('Person', t('assess.person', 'Person'));
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
                        <p className="text-xs font-bold">{displayLabel}</p>
                        <p className={`text-[11px] mt-0.5 font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                          {subLabel}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Range Input & Real-Time Validation Area */}
                {selectedEmpRangeKey && (() => {
                  const currentEmpConfig = EMPLOYMENT_RANGES.find((r) => r.key === selectedEmpRangeKey)!;
                  const currentSubLabel = t('emp.' + currentEmpConfig.key.replace('_jobs', ''), currentEmpConfig.sub);
                  const currentDisplayLabel = currentEmpConfig.label
                    .replace('Persons', t('assess.persons', 'Persons'))
                    .replace('Person', t('assess.person', 'Person'));
                  return (
                    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-800 block">
                            {t('assess.enter_exact_workers', 'Enter Exact Number of People / Workers')}
                          </label>
                          <span className="text-[11px] text-slate-500">
                            {t('assess.selected_bracket', 'Selected bracket range:')} <strong className="text-slate-700">{currentDisplayLabel}</strong> ({currentSubLabel})
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
                            {empValue === 1 ? t('assess.person', 'Person') : t('assess.persons', 'Persons')}
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
                          <span>{t('assess.registered_emp', 'Registered Direct Employment:')}</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            👥 {empValue} {empValue === 1 ? t('assess.person', 'Person') : t('assess.workers', 'Full-Time Workers')}
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
                <p className="text-xs font-semibold text-slate-700 mb-3">{t('assess.site_utilities', 'Site Utilities & Additional Parameters (Optional)')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel>{t('assess.power_req', 'Power Requirement (kW)')}</FieldLabel>
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
                    <FieldLabel>{t('assess.taluka_name', 'Taluka Name')}</FieldLabel>
                    <input
                      type="text"
                      placeholder="e.g. Haveli"
                      value={profile.taluka ?? ''}
                      onChange={(e) => set('taluka', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <FieldLabel>{t('assess.land_area', 'Land Area (sq. metres)')}</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 10000"
                      value={profile.land_area ?? ''}
                      onChange={(e) => set('land_area', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <FieldLabel>{t('assess.taluka_class', 'Taluka Classification')}</FieldLabel>
                    <select
                      value={profile.taluka_category ?? ''}
                      onChange={(e) => set('taluka_category', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">{t('assess.select_cat', '-- Select Category --')}</option>
                      <option value="A">A (Developed)</option>
                      <option value="B">B (Developing)</option>
                      <option value="C">C (Developing)</option>
                      <option value="D">D (Backward)</option>
                      <option value="D+">D+ (Highly Backward)</option>
                      <option value="Naxal Affected">Naxal Affected Area</option>
                      <option value="No Industry District">No Industry District</option>
                    </select>
                  </div>

                  <div>
                    <FieldLabel>{t('assess.builtup_area', 'Built-up Area (sq. ft.)')}</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      placeholder={t('assess.for_it_logistics', 'For IT/Logistics Parks')}
                      value={profile.built_up_area_sqft ?? ''}
                      onChange={(e) => set('built_up_area_sqft', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <label className="flex items-start gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={profile.is_export_oriented ?? false}
                      onChange={(e) => set('is_export_oriented', e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{t('assess.eou', '100% Export Oriented (EOU)')}</p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{t('assess.eou_sub', 'Applies for specific EOU subsidies')}</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={profile.women_led_enterprise ?? false}
                      onChange={(e) => set('women_led_enterprise', e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{t('assess.women_led', 'Women-led Enterprise')}</p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{t('assess.women_led_sub', 'Triggers women entrepreneur incentives')}</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={profile.student_led_enterprise ?? false}
                      onChange={(e) => set('student_led_enterprise', e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{t('assess.student_led', 'Student-led Startup')}</p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{t('assess.student_led_sub', 'For M-Hub & innovation lab benefits')}</p>
                    </div>
                  </label>
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
              {t('assess.reset_form', 'Reset Form')}
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
                  <span>{t('assess.evaluating_rules', 'Evaluating Statutory Rules…')}</span>
                </>
              ) : (
                <span>{t('assess.generate_report', 'Assess Project & Generate Report →')}</span>
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
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t('assess.live_dossier', 'Live Dossier')}</p>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {t('assess.realtime_sync', 'REAL-TIME SYNC')}
                </span>
              </div>

              {/* Enterprise Snapshot */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">{t('assess.enterprise', 'Enterprise')}</span>
                <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                  {profile.entity_name?.trim() || t('assess.untitled_project', 'Untitled Industrial Project')}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    {profile.sector ? t('sector.' + profile.sector, profile.sector) : t('assess.select_sector', 'Select Sector')}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {profile.entity_type ? t('entity.' + profile.entity_type, profile.entity_type) : t('assess.entity_type_placeholder', 'Entity Type')}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {profile.stage ? t('stage.' + profile.stage, profile.stage) : t('assess.stage_placeholder', 'Stage')}
                  </span>
                </div>
              </div>

              {/* Location & Incentive Zone */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">{t('assess.location_zone', 'Location & Zone')}</span>
                  {profile.district && zoneInfo.zone ? (
                    <span className="text-[10px] font-bold text-blue-700">{zoneInfo.zone}</span>
                  ) : null}
                </div>
                <p className="text-xs font-semibold text-slate-800 mt-1">
                  {profile.district ? `${profile.district} ${t('assess.district_label', 'District')}` : t('assess.all_maharashtra', 'All Maharashtra')} · {profile.location_type ? t('location.' + profile.location_type, profile.location_type) : t('assess.land_type_placeholder', 'Land Type')}
                </p>
                {zoneInfo.subsidy ? (
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {zoneInfo.subsidy}
                  </p>
                ) : null}
              </div>

              {/* Live Incentive Tier Meter */}
              <div className={`p-3.5 rounded-xl border ${tierInfo.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold opacity-75">{t('assess.statutory_slabs', 'Statutory Slabs')}</span>
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
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">{t('assess.capital', 'Capital')}</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatInrRupees(invInrValue)}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">{t('assess.employment', 'Employment')}</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {empValue} {empValue === 1 ? t('assess.person', 'Person') : t('assess.persons', 'Persons')}
                  </p>
                </div>
              </div>

              {/* Primary Assessment CTA */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-xs transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{t('assess.evaluating', 'Evaluating Rules…')}</span>
                  </>
                ) : (
                  <span>{t('assess.submit', 'Generate Statutory Report →')}</span>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>{t('assess.deterministic_engine', 'Deterministic Rules Engine')}</span>
                <span className="text-emerald-600 font-medium">{t('assess.authoritative_citations', '✓ Authoritative Citations')}</span>
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
