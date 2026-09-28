'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { AssessmentResponse, FormRequirement, SourceEvidence } from '@/types';
import { getForms } from '@/lib/api';
import SourceModal from '@/components/SourceModal';
import IncentiveCalculator from '@/components/IncentiveCalculator';
import QRVerificationModal from '@/components/QRVerificationModal';
import QRCode from 'qrcode';
import { useLanguage } from '@/context/LanguageContext';

/* ─── Helpers ─────────────────────────────────────────────── */
function formatInr(val?: number | null): string {
  if (!val) return '—';
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Cr`;
  if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

const STATUS_META: Record<string, { bg: string; dot: string; labelKey: string; defaultLabel: string }> = {
  potentially_applicable: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-500', labelKey: 'status.applicable', defaultLabel: 'Applicable' },
  required:               { bg: 'bg-blue-50 border-blue-200 text-blue-800',           dot: 'bg-blue-500',    labelKey: 'status.required', defaultLabel: 'Required' },
  potentially_required:   { bg: 'bg-amber-50 border-amber-200 text-amber-800',        dot: 'bg-amber-400',   labelKey: 'status.pending', defaultLabel: 'Pending' },
  not_applicable:         { bg: 'bg-slate-100 border-slate-200 text-slate-500',       dot: 'bg-slate-400',   labelKey: 'status.na', defaultLabel: 'N/A' },
  insufficient_evidence:  { bg: 'bg-slate-100 border-slate-200 text-slate-500',       dot: 'bg-slate-400',   labelKey: 'status.verify', defaultLabel: 'Verify' },
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const m = STATUS_META[status] ?? { bg: 'bg-slate-100 border-slate-200 text-slate-500', dot: 'bg-slate-400', labelKey: `status.${status}`, defaultLabel: status };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${m.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {t(m.labelKey, m.defaultLabel)}
    </span>
  );
}

function FormTypeBadge({ type }: { type?: string }) {
  const { t } = useLanguage();
  if (!type) return null;
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 uppercase tracking-wider">
      {t(`form_type.${type}`, type.replace(/_/g, ' '))}
    </span>
  );
}

function DeptIcon({ authority }: { authority: string }) {
  const lower = authority.toLowerCase();
  if (lower.includes('env') || lower.includes('pollut') || lower.includes('pcb') || lower.includes('mpcb')) {
    return (
      <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    );
  }
  if (lower.includes('fire') || lower.includes('safe') || lower.includes('cfo')) {
    return (
      <svg className="w-4.5 h-4.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  }
  if (lower.includes('elect') || lower.includes('power') || lower.includes('msedcl')) {
    return (
      <svg className="w-4.5 h-4.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }
  if (lower.includes('lab') || lower.includes('employ') || lower.includes('dish')) {
    return (
      <svg className="w-4.5 h-4.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  if (lower.includes('water') || lower.includes('ground') || lower.includes('irrig')) {
    return (
      <svg className="w-4.5 h-4.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    );
  }
  if (lower.includes('land') || lower.includes('rev') || lower.includes('talat')) {
    return (
      <svg className="w-4.5 h-4.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    );
  }
  if (lower.includes('munic') || lower.includes('corp') || lower.includes('council')) {
    return (
      <svg className="w-4.5 h-4.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    );
  }
  if (lower.includes('gst') || lower.includes('tax')) {
    return (
      <svg className="w-4.5 h-4.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.5 4.5H6.5h3a4 4 0 010 8H6.5m3 0 5 8M6.5 8.5h11" />
      </svg>
    );
  }
  if (lower.includes('midc') || lower.includes('fact') || lower.includes('build')) {
    return (
      <svg className="w-4.5 h-4.5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    );
  }
  return (
    <svg className="w-4.5 h-4.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

/* ─── TABS CONFIG ─────────────────────────────────────────── */
type Tab = 'all' | 'approvals' | 'incentives' | 'documents' | 'forms' | 'sources';

function TabIcon({ id, className = "w-4 h-4 shrink-0" }: { id: Tab; className?: string }) {
  switch (id) {
    case 'all':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'approvals':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'incentives':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.5 4.5H6.5h3a4 4 0 010 8H6.5m3 0 5 8M6.5 8.5h11" />
        </svg>
      );
    case 'documents':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'forms':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case 'sources':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      );
  }
}

import FormFillerModal from '@/components/FormFillerModal';

/* ─── MAIN PAGE ───────────────────────────────────────────── */
export default function ResultsPage() {
  const { t } = useLanguage();
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [forms, setForms] = useState<FormRequirement[]>([]);
  const [formsLoading, setFormsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<SourceEvidence | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [printQrUrl, setPrintQrUrl] = useState('');
  const [formFillerOpen, setFormFillerOpen] = useState(false);
  const [selectedFormsToFill, setSelectedFormsToFill] = useState<FormRequirement[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('smsws_assessment');
    const demo = localStorage.getItem('smsws_demo');
    if (raw) {
      try { setAssessment(JSON.parse(raw)); } catch { /* ignore */ }
    }
    setIsDemo(demo === '1');
  }, []);

  useEffect(() => {
    if (!assessment) return;
    setFormsLoading(true);
    getForms(assessment.project_summary.sector)
      .then(setForms)
      .catch(() => setForms([]))
      .finally(() => setFormsLoading(false));

    const ref = `MH-GR-2019-PSI-${Math.abs(
      (assessment.project_summary.entity_name || 'SMSWS').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % 89999 + 10000}`;
    const url = typeof window !== 'undefined' ? `${window.location.href}?verify=${ref}` : 'http://localhost:3000/results';
    QRCode.toDataURL(url, { width: 140, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(setPrintQrUrl)
      .catch(() => setPrintQrUrl(''));
  }, [assessment]);

  /* ── Empty state ── */
  if (!assessment) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center shadow-inner">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900">{t('res.no_assessment_title', 'No Assessment Report Found')}</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              {t('res.no_assessment_sub', 'Submit an industrial project profile or launch a demo to view your clearance dossier.')}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/assess?demo=textile"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              <span>{t('res.try_textile_demo', 'Try Textile Demo')}</span>
            </Link>
            <Link
              href="/assess"
              className="px-5 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-sm rounded-xl transition-all"
            >
              {t('res.new_assessment_btn', 'New Assessment')}
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const s = assessment.project_summary;
  const totalIncentives = assessment.incentives.length + assessment.applicable_policies.length;

  const TABS: { id: Tab; label: string; count: number | string }[] = [
    { id: 'all',        label: t('nav.dashboard', 'Overview'),   count: '' },
    { id: 'approvals',  label: t('res.clearances_tab', 'Approvals'),  count: assessment.approvals.length },
    { id: 'incentives', label: t('res.incentives_tab', 'Incentives'), count: totalIncentives },
    { id: 'documents',  label: t('res.documents_tab', 'Documents'),  count: assessment.documents_required.length },
    { id: 'forms',      label: t('res.forms_tab', 'Forms'),      count: forms.length || '…' },
    { id: 'sources',    label: t('res.evidence_tab', 'Evidence'),   count: assessment.sources.length },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* ── OFFICIAL GOVERNMENT PRINT LETTERHEAD (PRINT ONLY) ── */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center border border-slate-400 rounded p-1 shrink-0">
                <img
                  src="/maharashtra-emblem.png"
                  alt="Government of Maharashtra"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-600">
                  {t('letterhead.dept', 'Government of Maharashtra · Industry & Investment Department')}
                </p>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {t('letterhead.dossier_title', 'OFFICIAL INDUSTRIAL CLEARANCE & INCENTIVE DOSSIER')}
                </h1>
                <p className="text-[11px] text-slate-600">
                  {t('letterhead.system_sub', 'MAITRI Single Window Clearance System · Gazette Ref: GR-PSI-2019/CR-48/IND-8')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-right text-xs text-slate-700 shrink-0">
              {printQrUrl && (
                <img src={printQrUrl} alt="Scannable QR Verification Badge" className="w-16 h-16 border border-slate-300 p-0.5 rounded" />
              )}
              <div>
                <p className="font-bold text-slate-900">{s.entity_name || t('res.default_project_name', 'Industrial Project')}</p>
                <p className="text-[11px]">{t('res.date_label', 'Date:')} {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                <p className="text-[10px] font-mono text-emerald-800 font-bold mt-0.5">● {t('res.gazette_ver', 'GAZETTE VERIFIED')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── HERO HEADER ─────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-6 shadow-xl print:hidden">
          <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-indigo-500/10 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-blue-500/10 translate-y-1/2" />

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3 relative">
            <Link href="/" className="hover:text-white transition-colors">{t('nav.dashboard', 'Dashboard')}</Link>
            <span>/</span>
            <Link href="/assess" className="hover:text-white transition-colors">{t('assess.title', 'Assessment Studio')}</Link>
            <span>/</span>
            <span className="text-white font-medium">{t('res.clearance_report', 'Clearance Report')}</span>
          </div>

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {s.entity_name || t('res.default_project_name', 'Industrial Project')}
                </h1>
                {isDemo && (
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                    {t('res.demo_run', 'Demo Run')}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">
                {t('res.clearance_report', 'Clearance Dossier')} · {t('sector.' + s.sector, s.sector)} · {t('stage.' + s.stage, s.stage)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-900 flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>{t('res.export_pdf', 'Export PDF Dossier')}</span>
              </button>
              <Link
                href="/assess"
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl transition-all backdrop-blur-sm"
              >
                {t('res.edit_profile', '← Edit Profile')}
              </Link>
              <Link
                href="/assess?demo=textile"
                className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-900 flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                <span>Demo</span>
              </Link>
            </div>
          </div>

          {/* Stat Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 relative">
            {[
              { id: 'approvals' as Tab, val: assessment.approvals.length, label: t('res.clearances_tab', 'Clearances'), color: 'from-blue-600/30 to-blue-500/10 border-blue-500/30' },
              { id: 'incentives' as Tab, val: totalIncentives, label: t('res.incentives_tab', 'Incentive Schemes'), color: 'from-emerald-600/30 to-emerald-500/10 border-emerald-500/30' },
              { id: 'documents' as Tab, val: assessment.documents_required.length, label: t('res.documents_tab', 'Documents'), color: 'from-amber-600/30 to-amber-500/10 border-amber-500/30' },
              { id: 'sources' as Tab, val: assessment.sources.length, label: t('res.evidence_tab', 'Policy Citations'), color: 'from-indigo-600/30 to-indigo-500/10 border-indigo-500/30' },
            ].map(({ id, val, label, color }) => (
              <div key={label} className={`rounded-xl bg-gradient-to-br ${color} border p-3 backdrop-blur-sm flex flex-col justify-between`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="p-1 rounded-lg bg-white/10 text-white">
                    <TabIcon id={id} className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 uppercase">{t('res.verified_badge', 'VERIFIED')}</span>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{val}</div>
                  <div className="text-[11px] text-slate-300 font-medium">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PROJECT PROFILE STRIP ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 print:border-slate-300 print:shadow-none print:break-inside-avoid">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{t('res.eval_profile', 'Evaluated Profile')}</span>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t('res.gazette_ver', 'Official Gazette Verified')}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold">
                {t('res.gazette_ref', 'Gazette Ref: GR-PSI-2019/CR-48/IND-8')}
              </span>
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] px-2.5 py-1 rounded-lg font-mono transition-all cursor-pointer shadow-sm hover:shadow group print:bg-slate-100 print:text-slate-800 print:border print:border-slate-300"
                title="Click to view & scan official QR verification code"
              >
                <svg className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform print:text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span className="group-hover:underline">{t('res.scan_qr', 'Scan QR for Live Verification')}</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {[
              { label: t('calc.sector', 'Sector'), val: t('sector.' + s.sector, s.sector), accent: 'text-blue-700' },
              { label: t('assess.stage', 'Lifecycle Stage'), val: t('stage.' + s.stage, s.stage), accent: 'text-slate-900' },
              { label: t('assess.district', 'District'), val: s.district || t('assess.all_maharashtra', 'All Maharashtra'), accent: 'text-slate-900' },
              { label: t('assess.location', 'Location Type'), val: t('location.' + (s.location_type || 'Other'), s.location_type || 'General'), accent: 'text-slate-900' },
              { label: t('assess.investment', 'Investment'), val: formatInr(s.investment_inr), accent: 'text-emerald-700' },
              { label: t('assess.employment', 'Employment'), val: s.employment_expected ? `${s.employment_expected} ${t('results.persons', 'persons')}` : '—', accent: 'text-slate-900' },
              { label: t('assess.entity_type', 'Constitution'), val: t('entity.' + s.entity_type, s.entity_type), accent: 'text-slate-900' },
              { label: t('res.clearances_tab', 'Clearances'), val: `${assessment.approvals.length} ${t('res.identified', 'identified')}`, accent: 'text-indigo-700' },
            ].map(({ label, val, accent }) => (
              <div key={label} className="bg-slate-50 rounded-xl border border-slate-100 px-3 py-2.5 print:border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{label}</p>
                <p className={`font-bold truncate ${accent}`}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── WARNINGS ────────────────────────────────────────── */}
        {assessment.warnings.length > 0 && (
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 print:border-amber-300 print:break-inside-avoid">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold text-[11px] uppercase tracking-wider">{t('res.eval_notices', 'Evaluation Notices')}</p>
              {assessment.warnings.map((w, idx) => (
                <p key={idx}>• {w}</p>
              ))}
            </div>
          </div>
        )}

        {/* ── ICON TABS ────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 print:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              <TabIcon id={tab.id} className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.count !== '' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════
            MODULE 1 · APPROVALS
        ══════════════════════════════════════════════════════ */}
        <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-slate-300 print:shadow-none print:break-inside-avoid ${activeTab === 'all' || activeTab === 'approvals' ? 'block' : 'hidden print:block'}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900 text-sm">{t('res.statutory_approvals_title', 'Statutory Approvals & Clearances')}</h2>
            </div>
            <span className="text-[11px] bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full border border-blue-200">
              {assessment.approvals.length} {t('res.required', 'Required')}
            </span>
          </div>

          <div className="p-6">
            {assessment.approvals.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold">{t('res.no_approvals', 'No specific approvals triggered')}</p>
                <p className="text-xs mt-1">{t('res.no_approvals_sub', 'Your profile may qualify for simplified clearance.')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assessment.approvals.map((appr, i) => (
                  <div
                    key={i}
                    className="group border border-slate-200 hover:border-slate-300 rounded-2xl p-4 bg-white hover:shadow-md transition-all print:border-slate-300 print:shadow-none print:break-inside-avoid"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <DeptIcon authority={appr.authority || appr.name} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">{appr.name}</h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={appr.status} />
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                              {t('stage.' + appr.stage, appr.stage)}
                            </span>
                          </div>
                        </div>

                        {appr.authority && (
                          <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                            <span className="font-semibold text-slate-700">{appr.authority}</span>
                          </p>
                        )}

                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 print:border-slate-200 font-normal">
                          {appr.reason}
                        </p>

                        {appr.evidence && appr.evidence.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2 items-center">
                            <span className="text-[10px] uppercase font-bold text-slate-400">{t('res.policy_source', 'Policy Source:')}</span>
                            {appr.evidence.map((ev) => (
                              <button
                                key={ev.chunk_id}
                                onClick={() => setSelectedSource(ev)}
                                className="text-[11px] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-2.5 py-1 text-blue-700 font-medium transition-colors flex items-center gap-1 print:hidden"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <span>{ev.filename.replace(/^MH_/, '')} · p.{ev.page_start}</span>
                              </button>
                            ))}
                            <div className="hidden print:flex flex-wrap gap-2 text-[10px] font-mono text-slate-600">
                              {appr.evidence.map((ev) => (
                                <span key={ev.chunk_id}>[{ev.filename.replace(/^MH_/, '')} p.{ev.page_start}]</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            MODULE 2 · INCENTIVES & SUBSIDIES
        ══════════════════════════════════════════════════════ */}
        <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-slate-300 print:shadow-none print:break-inside-avoid ${activeTab === 'all' || activeTab === 'incentives' ? 'block' : 'hidden print:block'}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.5 4.5H6.5h3a4 4 0 010 8H6.5m3 0 5 8M6.5 8.5h11" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900 text-sm">{t('res.incentives_title', 'Incentives, Subsidies & Amortization')}</h2>
            </div>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
              {totalIncentives} {t('res.schemes_active', 'Schemes Active')}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Interactive Calculator pre-populated with live project summary */}
            <div className="mb-6 print:break-inside-avoid">
              <IncentiveCalculator
                initialInvestmentInr={s.investment_inr || 250000000}
                initialDistrict={s.district || 'Nagpur / Solapur / Amravati'}
                initialSector={s.sector || 'Textile & Garments'}
                initialIsMsme={(s.investment_inr || 250000000) <= 500000000}
                initialPowerKw={500}
              />
            </div>

            {/* Policy Frameworks */}
            {assessment.applicable_policies.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{t('res.governing_policies', 'Governing Policy Frameworks')}</span>
                </p>
                <div className="space-y-3">
                  {assessment.applicable_policies.map((p, i) => (
                    <div key={i} className="border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 bg-white transition-all hover:shadow-sm print:border-slate-300 print:shadow-none print:break-inside-avoid">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{p.reason}</p>
                      {p.evidence && p.evidence.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 items-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400">{t('res.policy_source', 'Policy Source:')}</span>
                          {p.evidence.map((ev) => (
                            <button
                              key={ev.chunk_id}
                              onClick={() => setSelectedSource(ev)}
                              className="text-[11px] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg px-2.5 py-1 text-indigo-700 font-medium transition-colors flex items-center gap-1 print:hidden"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              <span>{ev.filename.replace(/^MH_/, '')} · p.{ev.page_start}</span>
                            </button>
                          ))}
                          <div className="hidden print:flex flex-wrap gap-2 text-[10px] font-mono text-slate-600">
                            {p.evidence.map((ev) => (
                              <span key={ev.chunk_id}>[{ev.filename.replace(/^MH_/, '')} p.{ev.page_start}]</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specific Subsidies */}
            {assessment.incentives.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span>{t('res.subsidies_benefits', 'Subsidies & Benefits')}</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assessment.incentives.map((inc, i) => (
                    <div key={i} className="relative border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 bg-white transition-all hover:shadow-md overflow-hidden group print:border-slate-300 print:shadow-none print:break-inside-avoid">
                      <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{inc.name}</h4>
                        <StatusBadge status={inc.status} />
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{inc.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalIncentives === 0 && (
              <div className="text-center py-8 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold">{t('res.no_incentives', 'No incentive schemes identified')}</p>
                <p className="text-xs mt-1">{t('res.no_incentives_sub', 'Refine your sector/location/investment profile to unlock incentives.')}</p>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            MODULE 3 · DOCUMENTS
        ══════════════════════════════════════════════════════ */}
        <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-slate-300 print:shadow-none print:break-inside-avoid ${activeTab === 'all' || activeTab === 'documents' ? 'block' : 'hidden print:block'}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900 text-sm">{t('res.mandatory_docs', 'Mandatory Document Checklist')}</h2>
            </div>
            <span className="text-[11px] bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full border border-amber-200">
              {assessment.documents_required.length} {t('res.required', 'Required')}
            </span>
          </div>

          <div className="p-6">
            {assessment.documents_required.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm">{t('res.no_docs', 'No additional documents identified.')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {assessment.documents_required.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all group print:border-slate-300 print:break-inside-avoid"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-amber-200 transition-colors">
                      <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{doc}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{t('res.statutory_filing', 'Required for statutory filing')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            MODULE 4 · FORMS
        ══════════════════════════════════════════════════════ */}
        <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-slate-300 print:shadow-none print:break-inside-avoid ${activeTab === 'all' || activeTab === 'forms' ? 'block' : 'hidden print:block'}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900 text-sm">{t('res.prescribed_forms', 'Prescribed Government Forms')}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full border border-indigo-200">
                {forms.length} {t('res.mapped', 'Mapped')}
              </span>
              {forms.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFormsToFill(forms);
                    setFormFillerOpen(true);
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 print:hidden"
                >
                  <span>📝</span>
                  <span>Fill All Mapped Forms</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {formsLoading ? (
              <div className="flex items-center gap-3 py-6 text-slate-500 text-xs">
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                {t('res.querying_forms', 'Querying form requirements…')}
              </div>
            ) : forms.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 text-center p-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700">{t('res.no_forms', 'No mapped forms in knowledge base')}</p>
                <p className="text-xs text-slate-400 mt-1">{t('res.forms_routing', 'Forms will be designated upon departmental routing.')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {forms.slice(0, 15).map((f) => (
                  <div key={f.form_requirement_id} className="border border-slate-200 hover:border-indigo-200 rounded-2xl p-4 bg-white transition-all hover:shadow-sm print:border-slate-300 print:shadow-none print:break-inside-avoid">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{f.form_name}</p>
                        {f.form_number && (
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">{t('res.form_no', 'Form №')} {f.form_number}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFormsToFill([f]);
                            setFormFillerOpen(true);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 print:hidden"
                        >
                          <span>✍️</span>
                          <span>Fill Form</span>
                        </button>
                        <FormTypeBadge type={f.form_type} />
                        {f.required && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                            {t('status.' + f.required.toLowerCase(), f.required)}
                          </span>
                        )}
                      </div>
                    </div>

                    {f.condition && (
                      <p className="text-xs text-slate-600 mb-2">
                        <span className="font-semibold text-slate-700">{t('res.condition', 'Condition:')}</span> {f.condition}
                      </p>
                    )}

                    {f.evidence_text && (
                      <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2 mb-2 print:border-slate-200">
                        &ldquo;{f.evidence_text}&rdquo;
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        {f.filename && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{f.filename} {f.page_start && `(p.${f.page_start})`}</span>
                          </span>
                        )}
                        {f.submission_method && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{f.submission_method}</span>
                          </span>
                        )}
                      </div>
                      {f.fields && f.fields.length > 0 && (
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[10px]">
                          {f.fields.length} Configured Field{f.fields.length === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {forms.length > 15 && (
                  <div className="text-center pt-2 print:hidden">
                    <Link href="/forms" className="text-xs text-blue-600 hover:text-blue-500 font-bold hover:underline">
                      {t('res.view_all_forms', 'View all')} {forms.length} {t('res.forms_in_repo', 'forms in Forms Repository →')}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            MODULE 5 · EVIDENCE CITATIONS
        ══════════════════════════════════════════════════════ */}
        <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-slate-300 print:shadow-none print:break-inside-avoid ${activeTab === 'all' || activeTab === 'sources' ? 'block' : 'hidden print:block'}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900 text-sm">{t('res.grounded_evidence', 'Grounded Policy Evidence')}</h2>
            </div>
            <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full border border-slate-200">
              {assessment.sources.length} {t('res.citations', 'Citations')}
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {assessment.sources.map((src, idx) => (
              <div key={src.chunk_id} className="border border-slate-200 hover:border-indigo-200 rounded-2xl p-4 bg-white transition-all hover:shadow-md group print:border-slate-300 print:shadow-none print:break-inside-avoid">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{src.filename.replace(/^MH_/, '')}</p>
                      <p className="text-[11px] text-slate-400">
                        p.{src.page_start === src.page_end ? src.page_start : `${src.page_start}–${src.page_end}`}
                        {src.section_reference ? ` · §${src.section_reference}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSource(src)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 text-[11px] font-semibold rounded-lg transition-all shrink-0 print:hidden"
                  >
                    {t('res.view_evidence', 'View →')}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 font-mono bg-slate-50/90 p-3 rounded-xl border border-slate-200 line-clamp-4 leading-relaxed print:border-slate-200 print:line-clamp-none">
                  {src.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── DISCLAIMER ──────────────────────────────────────── */}
        <div className="flex gap-3.5 bg-slate-100 border border-slate-300 rounded-2xl p-4.5 text-sm text-slate-700 print:border-slate-300 print:break-inside-avoid">
          <svg className="w-5.5 h-5.5 text-slate-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          <div>
            <p className="font-extrabold text-slate-900 mb-1 text-sm">{t('res.statutory_advisory', 'Statutory Advisory Note')}</p>
            <p className="leading-relaxed font-normal text-slate-700 text-sm">{assessment.disclaimer}</p>
          </div>
        </div>

      </div>

      <SourceModal source={selectedSource} onClose={() => setSelectedSource(null)} />
      <QRVerificationModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        projectSummary={s}
        clearanceCount={assessment.approvals.length}
        incentiveCount={totalIncentives}
      />
      <FormFillerModal
        isOpen={formFillerOpen}
        onClose={() => setFormFillerOpen(false)}
        forms={selectedFormsToFill}
        projectName={s.entity_name}
      />
    </AppLayout>
  );
}
