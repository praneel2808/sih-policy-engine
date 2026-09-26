'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

const DOCUMENT_CATEGORIES = [
  {
    category: 'Corporate & Identity Documents',
    icon: '🏢',
    items: [
      { name: 'Certificate of Incorporation / Registration', authority: 'Registrar of Companies (RoC)', required: 'Mandatory' },
      { name: 'Memorandum and Articles of Association (MOA & AOA)', authority: 'RoC / Legal Draft', required: 'Mandatory for Companies' },
      { name: 'Partnership Deed / LLP Agreement', authority: 'Registrar of Firms', required: 'Mandatory for LLPs/Partnerships' },
      { name: 'Enterprise Permanent Account Number (PAN Card)', authority: 'Income Tax Dept.', required: 'Mandatory' },
      { name: 'Authorized Signatory Board Resolution / Power of Attorney', authority: 'Company Board', required: 'Mandatory' },
    ],
  },
  {
    category: 'Land & Location Clearances',
    icon: '📍',
    items: [
      { name: 'MIDC Plot Allotment Letter & Agreement to Lease', authority: 'MIDC', required: 'Mandatory for MIDC Plots' },
      { name: '7/12 Land Revenue Extract & 8A Mutation Entry', authority: 'Revenue Department, GoM', required: 'Mandatory for Private Land' },
      { name: 'Non-Agricultural (NA) Industrial Order', authority: 'District Collector', required: 'Mandatory for Private Land' },
      { name: 'Zoning Certificate / Development Plan Sanction', authority: 'Local Planning Authority / CIDCO / MMRDA', required: 'Mandatory' },
      { name: 'Land Survey / Demarcation Plan', authority: 'Land Records Dept.', required: 'Required for Boundary Approval' },
    ],
  },
  {
    category: 'Technical & Engineering Reports',
    icon: '📐',
    items: [
      { name: 'Detailed Project Report (DPR) & Process Flow Chart', authority: 'Chartered Engineer / Enterprise', required: 'Mandatory' },
      { name: 'Architectural Blueprint & Machinery Layout Drawing', authority: 'Registered Architect / DISH', required: 'Mandatory for Factories' },
      { name: 'Chartered Accountant (CA) Capital Investment Certificate', authority: 'Practicing Chartered Accountant', required: 'Mandatory for PSI-2019' },
      { name: 'Connected Electrical Load & Single Line Diagram (SLD)', authority: 'Licensed Electrical Contractor', required: 'Mandatory for Power Sanction' },
      { name: 'Water Balance Diagram & Quota Requirement', authority: 'Environmental Engineer', required: 'Mandatory for MPCB CTE' },
    ],
  },
  {
    category: 'Environmental & Safety Undertakings',
    icon: '🌿',
    items: [
      { name: 'Effluent Treatment Plant (ETP/STP) Design & Undertaking', authority: 'Pollution Control Consultant', required: 'Mandatory for Red/Orange Units' },
      { name: 'Hazardous Waste Management Plan (Form 1)', authority: 'MPCB', required: 'Required for Chemical/Engineering Units' },
      { name: 'On-site Emergency Disaster Management Plan (DMP)', authority: 'DISH / Safety Auditor', required: 'Required for Hazard Units' },
      { name: 'Fire Safety Equipment Compliance Certificate', authority: 'Fire Department', required: 'Mandatory' },
    ],
  },
];

export default function DocumentsPage() {
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  function toggleDoc(name: string) {
    setCheckedDocs((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  const totalCount = DOCUMENT_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedCount = Object.values(checkedDocs).filter(Boolean).length;

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-600">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Documents</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Standard Statutory Documents & Verification Checklist
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified document requirements across Maharashtra Single Window clearance departments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Preparation Progress</p>
              <p className="text-xs font-extrabold text-blue-700">{checkedCount} of {totalCount} Ready</p>
            </div>
            <Link
              href="/assess"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0"
            >
              Assess For My Project →
            </Link>
          </div>
        </div>

        {/* Document Categories */}
        <div className="space-y-6">
          {DOCUMENT_CATEGORIES.map((cat) => (
            <div key={cat.category} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{cat.icon}</span>
                  <h2 className="font-extrabold text-slate-900 text-sm">{cat.category}</h2>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                  {cat.items.length} Documents
                </span>
              </div>

              <div className="p-6 divide-y divide-slate-100">
                {cat.items.map((doc, idx) => {
                  const isChecked = !!checkedDocs[doc.name];
                  return (
                    <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDoc(doc.name)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mt-0.5 cursor-pointer"
                        />
                        <div>
                          <p className={`text-xs font-bold transition-colors ${isChecked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {doc.name}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Issuing / Verifying Authority: <span className="text-slate-700 font-medium">{doc.authority}</span>
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                        doc.required.includes('Mandatory')
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {doc.required}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}
