'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

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

export default function ApplicationsPage() {
  const [selectedApp, setSelectedApp] = useState(SAMPLE_APPLICATIONS[0]);

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-600">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Applications</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Single Window Clearance Application Tracker
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tracking and SLA monitoring for MAITRI statutory filings and departmental clearances.
            </p>
          </div>

          <Link
            href="/assess"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0"
          >
            + File New Application
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
                  {app.overallStatus}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-sm">{app.project}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{app.sector} · {app.location}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Submitted: <strong className="text-slate-700">{app.submissionDate}</strong></span>
                <span className="text-amber-700 font-bold">⏱️ {app.slaRemainingDays} Days SLA Left</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Application Tracking Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Application Milestone Tracker</span>
              <h2 className="font-extrabold text-slate-900 text-base">{selectedApp.id} · {selectedApp.project}</h2>
              <p className="text-xs text-slate-500">{selectedApp.stage}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Government SLA Compliance:</span>
              <span className="text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                ON TRACK
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
                  <p className="text-xs font-bold text-slate-900">{step.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Handling Agency: <span className="font-semibold text-slate-700">{step.dept}</span> · Status Date: {step.date}
                  </p>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                  step.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : step.status === 'IN_PROGRESS'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {step.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
