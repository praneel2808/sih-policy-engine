'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/context/LanguageContext';

const SAMPLE_APPLICATIONS = [
  {
    id: 'MAITRI-2026-MH-84920',
    project: 'Maharashtra Textile Innovations Pvt. Ltd.',
    sector: 'Textile Manufacturing',
    location: 'Pune MIDC (Taluka Haveli)',
    submissionDate: '24 Sep 2026',
    stage: 'Pre-establishment Combined Clearance',
    overallStatus: 'UNDER SCRUTINY',
    statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
    slaRemainingDays: 18,
    steps: [
      { name: 'Application Submitted & Fees Paid', status: 'COMPLETED', date: '24 Sep 2026', dept: 'MAITRIC' },
      { name: 'Document Verification & Scrutiny', status: 'IN_PROGRESS', date: 'In Progress (SLA: 5 Days)', dept: 'District Industries Centre' },
      { name: 'MPCB Environmental CTE Review', status: 'PENDING', date: 'Queued', dept: 'MPCB Regional Office' },
      { name: 'DISH Factory Plan Inspection', status: 'PENDING', date: 'Queued', dept: 'DISH Pune' },
      { name: 'Empowered Committee Sanction', status: 'PENDING', date: 'Scheduled post scrutiny', dept: 'State Single Window' },
    ],
  },
  {
    id: 'MAITRI-2026-MH-71204',
    project: 'Maharashtra EV Systems Pvt. Ltd.',
    sector: 'EV / Automotive',
    location: 'Aurangabad MIDC (Shendra)',
    submissionDate: '12 Sep 2026',
    stage: 'Construction Clearance & Power Sanction',
    overallStatus: 'APPROVED IN PRINCIPLE',
    statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    slaRemainingDays: 6,
    steps: [
      { name: 'Application Submitted & Fees Paid', status: 'COMPLETED', date: '12 Sep 2026', dept: 'MAITRIC' },
      { name: 'Document Verification & Scrutiny', status: 'COMPLETED', date: '15 Sep 2026', dept: 'DIC Aurangabad' },
      { name: 'MIDC Building Plan Approval', status: 'COMPLETED', date: '21 Sep 2026', dept: 'MIDC Engineering' },
      { name: 'HT Power Sanction (3000 kW)', status: 'IN_PROGRESS', date: 'Final inspection', dept: 'MSEDCL' },
      { name: 'Final Certificate Dispatch', status: 'PENDING', date: 'Expected 28 Sep', dept: 'MAITRIC' },
    ],
  },
];

function getLocalizedStepName(name: string, lang: string): string {
  if (lang === 'en') return name;
  const map: Record<string, { mr: string; hi: string }> = {
    'Application Submitted & Fees Paid': {
      mr: 'अर्ज सादर केला आणि शुल्क भरले',
      hi: 'आवेदन प्रस्तुत एवं शुल्क भुगतान पूर्ण',
    },
    'Document Verification & Scrutiny': {
      mr: 'कागदपत्र पडताळणी आणि छाननी',
      hi: 'दस्तावेज़ सत्यापन एवं संवीक्षा',
    },
    'MPCB Environmental CTE Review': {
      mr: 'MPCB पर्यावरण CTE पुनरावलोकन',
      hi: 'MPCB पर्यावरण CTE समीक्षा',
    },
    'DISH Factory Plan Inspection': {
      mr: 'DISH कारखाना नकाशा तपासणी',
      hi: 'DISH कारखाना योजना निरीक्षण',
    },
    'Empowered Committee Sanction': {
      mr: 'उच्चाधिकार समितीची अंतिम मंजुरी',
      hi: 'उच्चाधिकार समिति की अंतिम स्वीकृति',
    },
    'MIDC Building Plan Approval': {
      mr: 'MIDC इमारत नकाशा मंजुरी',
      hi: 'MIDC भवन योजना स्वीकृति',
    },
    'HT Power Sanction (3000 kW)': {
      mr: 'उच्च दाब (HT) वीज भार मंजुरी (३००० kW)',
      hi: 'उच्च दाब (HT) विद्युत भार स्वीकृति (3000 kW)',
    },
    'Final Certificate Dispatch': {
      mr: 'अंतिम प्रमाणपत्र पाठवणे',
      hi: 'अंतिम प्रमाण पत्र प्रेषण',
    },
  };
  return map[name] ? map[name][lang as 'mr' | 'hi'] : name;
}

function getLocalizedDept(dept: string, lang: string): string {
  if (lang === 'en') return dept;
  const map: Record<string, { mr: string; hi: string }> = {
    'District Industries Centre': { mr: 'जिल्हा उद्योग केंद्र (DIC)', hi: 'जिला उद्योग केंद्र (DIC)' },
    'DIC Aurangabad': { mr: 'जिल्हा उद्योग केंद्र, औरंगाबाद', hi: 'जिला उद्योग केंद्र, औरंगाबाद' },
    'MPCB Regional Office': { mr: 'MPCB प्रादेशिक कार्यालय', hi: 'MPCB क्षेत्रीय कार्यालय' },
    'DISH Pune': { mr: 'औद्योगिक सुरक्षा संचालनालय (DISH) पुणे', hi: 'औद्योगिक सुरक्षा निदेशालय (DISH) पुणे' },
    'State Single Window': { mr: 'राज्य एक खिडकी प्राधिकरण', hi: 'राज्य एकल खिड़की प्राधिकरण' },
    'MIDC Engineering': { mr: 'MIDC अभियांत्रिकी विभाग', hi: 'MIDC इंजीनियरिंग विभाग' },
    'MSEDCL': { mr: 'महावितरण (MSEDCL)', hi: 'महावितरण (MSEDCL)' },
    'MAITRIC': { mr: 'मैत्री सेल (MAITRIC)', hi: 'मैत्री सेल (MAITRIC)' },
  };
  return map[dept] ? map[dept][lang as 'mr' | 'hi'] : dept;
}

function getLocalizedDateText(date: string, lang: string): string {
  if (lang === 'en') return date;
  if (date.includes('In Progress')) {
    return lang === 'mr' ? 'छाननी सुरू आहे (SLA: ५ दिवस)' : 'जांच जारी है (SLA: 5 दिन)';
  }
  if (date === 'Queued') {
    return lang === 'mr' ? 'रांगेत प्रलंबित' : 'कतार में लंबित';
  }
  if (date.includes('Scheduled post scrutiny')) {
    return lang === 'mr' ? 'छाननीनंतर नियोजित' : 'जांच के बाद निर्धारित';
  }
  if (date === 'Final inspection') {
    return lang === 'mr' ? 'अंतिम तपासणी' : 'अंतिम निरीक्षण';
  }
  if (date.includes('Expected')) {
    return lang === 'mr' ? 'अपेक्षित २८ सप्टें' : 'अपेक्षित 28 सितं';
  }
  let localized = date;
  if (lang === 'mr') {
    localized = localized
      .replace(/Sep/g, 'सप्टें')
      .replace(/Oct/g, 'ऑक्टो')
      .replace(/Nov/g, 'नोव्हें')
      .replace(/Dec/g, 'डिसें')
      .replace(/Jan/g, 'जाने')
      .replace(/Feb/g, 'फेब्रु')
      .replace(/Mar/g, 'मार्च')
      .replace(/Apr/g, 'एप्रिल')
      .replace(/May/g, 'मे')
      .replace(/Jun/g, 'जून')
      .replace(/Jul/g, 'जुलै')
      .replace(/Aug/g, 'ऑगस्ट');
  } else if (lang === 'hi') {
    localized = localized
      .replace(/Sep/g, 'सितं')
      .replace(/Oct/g, 'अक्तू')
      .replace(/Nov/g, 'नवं')
      .replace(/Dec/g, 'दिसं')
      .replace(/Jan/g, 'जन')
      .replace(/Feb/g, 'फ़र')
      .replace(/Mar/g, 'मार्च')
      .replace(/Apr/g, 'अप्रैल')
      .replace(/May/g, 'मई')
      .replace(/Jun/g, 'जून')
      .replace(/Jul/g, 'जुलाई')
      .replace(/Aug/g, 'अगस्त');
  }
  return localized;
}

function getLocalizedLocation(loc: string, lang: string): string {
  if (lang === 'en') return loc;
  const map: Record<string, { mr: string; hi: string }> = {
    'Pune MIDC (Taluka Haveli)': {
      mr: 'पुणे MIDC (हवेली तालुका)',
      hi: 'पुणे MIDC (तालुका हवेली)',
    },
    'Aurangabad MIDC (Shendra)': {
      mr: 'औरंगाबाद MIDC (शेंद्रा)',
      hi: 'औरंगाबाद MIDC (शेंद्रा)',
    },
  };
  return map[loc]?.[lang as 'mr' | 'hi'] || loc;
}

function getLocalizedStage(stage: string, lang: string): string {
  if (lang === 'en') return stage;
  if (stage.includes('Pre-establishment')) {
    return lang === 'mr' ? 'स्थापनापूर्व एकत्रित मंजुरी' : 'स्थापना-पूर्व संयुक्त स्वीकृति';
  }
  if (stage.includes('Construction')) {
    return lang === 'mr' ? 'बांधकाम मंजुरी व वीज मंजुरी' : 'निर्माण स्वीकृति एवं विद्युत स्वीकृति';
  }
  return stage;
}

export default function ApplicationsPage() {
  const { t, lang } = useLanguage();
  const [selectedApp, setSelectedApp] = useState(SAMPLE_APPLICATIONS[0]);

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-600">{t('nav.dashboard', 'Dashboard')}</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">{t('nav.applications', 'Applications')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('appls.title', 'Single Window Clearance Application Tracker')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('appls.subtitle', 'Live tracking and SLA monitoring for MAITRI statutory filings and departmental clearances.')}
            </p>
          </div>

          <Link
            href="/assess"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0"
          >
            {t('appls.file_new', '+ File New Application')}
          </Link>
        </div>

        {/* Application Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_APPLICATIONS.map((app) => (
            <div
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                selectedApp.id === app.id
                  ? 'border-blue-600 bg-blue-50/20 shadow-sm ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {app.id}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${app.statusColor}`}>
                  {t('status.' + app.overallStatus, app.overallStatus)}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-sm">{app.project}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('sector.' + (app.sector.includes('Textile') ? 'Textile' : 'EV / Automotive'), app.sector)} · {getLocalizedLocation(app.location, lang)}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{t('appls.submitted', 'Submitted:')} <strong className="text-slate-700">{getLocalizedDateText(app.submissionDate, lang)}</strong></span>
                <span className="text-amber-700 font-bold">⏱️ {app.slaRemainingDays} {t('appls.sla_left', 'Days SLA Left')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Application Tracking Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">{t('appls.milestone_tracker', 'Application Milestone Tracker')}</span>
              <h2 className="font-extrabold text-slate-900 text-base">{selectedApp.id} · {selectedApp.project}</h2>
              <p className="text-xs text-slate-500">{getLocalizedStage(selectedApp.stage, lang)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">{t('appls.sla_compliance', 'Government SLA Compliance:')}</span>
              <span className="text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                {t('appls.on_track', 'ON TRACK')}
              </span>
            </div>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {selectedApp.steps.map((step, idx) => (
              <div key={idx} className="relative flex items-start justify-between gap-4">
                <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                  step.status === 'COMPLETED'
                    ? 'border-emerald-600 bg-emerald-600'
                    : step.status === 'IN_PROGRESS'
                    ? 'border-blue-600 animate-pulse'
                    : 'border-slate-300'
                }`}>
                  {step.status === 'COMPLETED' && <span className="text-white text-[8px]">✓</span>}
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-900">{getLocalizedStepName(step.name, lang)}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t('appls.agency', 'Handling Agency:')} <span className="font-semibold text-slate-700">{getLocalizedDept(step.dept, lang)}</span> · {t('appls.status_date', 'Status Details:')} {getLocalizedDateText(step.date, lang)}
                  </p>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                  step.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : step.status === 'IN_PROGRESS'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {t('status.' + step.status, step.status.replace(/_/g, ' '))}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
