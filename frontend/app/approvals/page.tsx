'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

const APPROVAL_CATEGORIES = [
  {
    stage: 'Pre-establishment',
    icon: '🏗️',
    description: 'Statutory approvals, NOCs, and environmental clearances required before ground-breaking.',
    items: [
      {
        name: 'MAITRI Combined Application Clearance',
        dept: 'Directorate of Industries / MAITRIC',
        timeline: '30 Days SLA',
        type: 'Statutory Mandatory',
        desc: 'Single Window Application routing under the Maharashtra Industry, Trade and Investment Facilitation Act 2023.',
        docs: ['Project Report (DPR)', 'Land Document / MIDC Allotment', 'PAN / Incorporation Certificate'],
      },
      {
        name: 'Consent to Establish (CTE) — MPCB',
        dept: 'Maharashtra Pollution Control Board',
        timeline: '45 Days SLA',
        type: 'Environmental Clearance',
        desc: 'Clearance under Water & Air Acts categorised by industry pollution index (Red / Orange / Green / White).',
        docs: ['Environmental Management Plan', 'Manufacturing Flow Chart', 'Effluent Treatment Plant Design'],
      },
      {
        name: 'Factory Building Plan Approval',
        dept: 'Directorate of Industrial Safety and Health (DISH)',
        timeline: '30 Days SLA',
        type: 'Safety & Layout Approval',
        desc: 'Layout and structural safety vetting under Rule 3 of Maharashtra Factories Rules 1963.',
        docs: ['Structural Drawings', 'Machinery Layout Plan', 'Ventilation & Fire Egress Plan'],
      },
      {
        name: 'Fire Department Provisional NOC',
        dept: 'Maharashtra Fire Services / Local Planning Authority',
        timeline: '21 Days SLA',
        type: 'Safety Clearance',
        desc: 'Fire fighting setup approval for industrial high-hazard or large built-up premises.',
        docs: ['Site Fire Hydrant Map', 'Architectural Layout', 'Hazardous Materials Storage Plan'],
      },
      {
        name: 'MIDC Plot Allotment & Land Possession',
        dept: 'Maharashtra Industrial Development Corporation',
        timeline: '15 Days SLA',
        type: 'Industrial Land Allotment',
        desc: 'Lease deed execution and land possession handover for industrial plots across MIDC zones.',
        docs: ['Letter of Intent (LoI)', 'Initial Premium Payment Receipt', 'Board Resolution'],
      },
    ],
  },
  {
    stage: 'Construction',
    icon: '🔨',
    description: 'Permissions for site development, structural erection, and utility connections.',
    items: [
      {
        name: 'Building Permission & Commencement Certificate (CC)',
        dept: 'MIDC Engineering Dept. / Municipal Corporation',
        timeline: '30 Days SLA',
        type: 'Building Sanction',
        desc: 'Sanction of building blueprints, setbacks, and FSI compliance.',
        docs: ['Soil Testing Report', 'Structural Engineer Undertaking', 'Approved Master Layout'],
      },
      {
        name: 'High Tension / Low Tension Power Sanction',
        dept: 'MSEDCL (Mahavitaran)',
        timeline: '15 Days SLA',
        type: 'Utility Clearance',
        desc: 'Sanction of electrical load, transformer installation, and sub-station connectivity.',
        docs: ['Connected Load Calculation', 'Contract Demand Application', 'Wiring Test Report'],
      },
      {
        name: 'Industrial Water Supply Connection',
        dept: 'MIDC Water Works / Irrigation Dept.',
        timeline: '14 Days SLA',
        type: 'Utility Clearance',
        desc: 'Allocation of daily industrial and potable water quota.',
        docs: ['Water Balance Chart', 'Pipeline Route Map', 'Plumbing Schematic'],
      },
    ],
  },
  {
    stage: 'Operational',
    icon: '⚙️',
    description: 'Statutory licenses and operating consents required before commercial production.',
    items: [
      {
        name: 'Consent to Operate (CTO) — MPCB',
        dept: 'Maharashtra Pollution Control Board',
        timeline: '45 Days SLA',
        type: 'Operating License',
        desc: 'Final operating permission verifying installation of pollution control systems.',
        docs: ['Capital Investment Certificate (CA)', 'ETP Commissioning Report', 'CTE Compliance Report'],
      },
      {
        name: 'Factory License (Factories Act 1948)',
        dept: 'Directorate of Industrial Safety and Health (DISH)',
        timeline: '30 Days SLA',
        type: 'Statutory License',
        desc: 'Registration and grant of factory operating license based on worker strength and horsepower.',
        docs: ['Form No. 2 (Application)', 'Notice of Occupation (Form 3)', 'Safety Committee Minutes'],
      },
      {
        name: 'Boiler / Pressure Vessel Registration',
        dept: 'Directorate of Steam Boilers, Maharashtra',
        timeline: '15 Days SLA',
        type: 'Equipment License',
        desc: 'Inspection and hydraulic testing certificate for steam boilers.',
        docs: ['IBR Manufacturer Certificates', 'Welder Qualification Records', 'Steam Piping Isometric'],
      },
    ],
  },
  {
    stage: 'Expansion',
    icon: '📈',
    description: 'Approvals for capacity enhancement, line diversification, or plant modernization.',
    items: [
      {
        name: 'Consent Amendment / Expansion Consent',
        dept: 'MPCB',
        timeline: '30 Days SLA',
        type: 'Statutory Amendment',
        desc: 'Revision of pollution discharge quotas for increased production capacity.',
        docs: ['Expansion DPR', 'Incremental Pollution Load Chart', 'Raw Material Balance'],
      },
      {
        name: 'Factory License Amendment',
        dept: 'DISH',
        timeline: '15 Days SLA',
        type: 'License Endorsement',
        desc: 'Endorsement of additional connected horsepower or increased workforce limits.',
        docs: ['Revised Machinery Plan', 'Additional Power Sanction Letter'],
      },
    ],
  },
];

export default function ApprovalsPage() {
  const [selectedStage, setSelectedStage] = useState('All');
  const [search, setSearch] = useState('');

  const filteredStages = APPROVAL_CATEGORIES.filter(
    (c) => selectedStage === 'All' || c.stage === selectedStage
  );

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-600">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Approvals & Compliance</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Statutory Approvals & Clearances Catalogue
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive single-window statutory approval pathways codified under the Maharashtra MAITRI Act 2023.
            </p>
          </div>

          <Link
            href="/assess"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0"
          >
            Assess My Project Approvals →
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {['All', 'Pre-establishment', 'Construction', 'Operational', 'Expansion'].map((stg) => (
              <button
                key={stg}
                onClick={() => setSelectedStage(stg)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedStage === stg
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {stg}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search clearances, depts (e.g. MPCB, DISH)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Approvals Listing by Stage */}
        <div className="space-y-6">
          {filteredStages.map((group) => {
            const items = group.items.filter(
              (it) =>
                it.name.toLowerCase().includes(search.toLowerCase()) ||
                it.dept.toLowerCase().includes(search.toLowerCase()) ||
                it.desc.toLowerCase().includes(search.toLowerCase())
            );

            if (items.length === 0) return null;

            return (
              <div key={group.stage} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{group.icon}</span>
                    <div>
                      <h2 className="font-extrabold text-slate-900 text-sm">{group.stage} Stage</h2>
                      <p className="text-[11px] text-slate-500">{group.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                    {items.length} Clearances
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  {items.map((it, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                          <h3 className="font-bold text-slate-900 text-sm">{it.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                            ⏱️ {it.timeline}
                          </span>
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                            {it.type}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 mb-1 font-medium">
                        Competent Department: <span className="text-slate-800 font-semibold">{it.dept}</span>
                      </p>

                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                        {it.desc}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-bold text-slate-500">Key Submissions:</span>
                        {it.docs.map((d, dIdx) => (
                          <span key={dIdx} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </AppLayout>
  );
}
