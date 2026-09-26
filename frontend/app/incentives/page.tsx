'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { getCanonicalRules } from '@/lib/api';

const FEATURED_SCHEMES = [
  {
    code: 'PSI-2019',
    title: 'Package Scheme of Incentives 2019 (PSI-2019)',
    dept: 'Industries, Energy and Labour Department',
    sector: 'All Industrial Manufacturing & Selected Services',
    highlights: [
      'Industrial Promotion Subsidy (IPS) linked to Gross SGST',
      'Interest Subsidy for MSME fixed capital loans (up to 5%)',
      'Power Tariff Subsidy of ₹1 to ₹2 per unit for 3–5 years',
      '100% Exemption from Electricity Duty across Zone C, D, D+',
      '100% Stamp Duty Waiver for lease deeds & land acquisitions',
    ],
    zones: 'Zone A (Developed) to Zone D+ (Under-developed / Naxal-affected)',
  },
  {
    code: 'TEXTILE-2023',
    title: 'Integrated and Sustainable Textile Policy 2023-2028',
    dept: 'Textiles Department, Govt. of Maharashtra',
    sector: 'Textiles, Garments, Weaving, Ginning & Technical Textiles',
    highlights: [
      'Capital subsidy of 25% to 45% for spinning, ginning & processing',
      'Special power tariff subsidy for LT & HT powerlooms',
      'Effluent Treatment Plant (ETP) zero-liquid-discharge capital aid',
      'Technical Textile R&D grant and incubator support',
    ],
    zones: 'Statewide with priority for Vidarbha, Marathwada & North Maharashtra',
  },
  {
    code: 'EV-2021',
    title: 'Maharashtra Electric Vehicle Policy 2021',
    dept: 'Environment & Climate Change / Industries Dept.',
    sector: 'Electric Vehicle & Battery Component Manufacturing',
    highlights: [
      'Pioneer / Mega status granted on lowered investment thresholds',
      '100% Stamp Duty Exemption for EV manufacturing units',
      'Capital Subsidy of up to 15% on plant & machinery',
      'Electricity Duty Exemption for 15 years',
    ],
    zones: 'Statewide focus on industrial clusters (Pune, Aurangabad, Nagpur)',
  },
  {
    code: 'IT-2023',
    title: 'Maharashtra Information Technology & ITES Policy 2023',
    dept: 'Directorate of Information Technology',
    sector: 'IT / ITES, Data Centers, AI/ML, GCC, AVGC',
    highlights: [
      '100% Stamp Duty Exemption for Data Centers and IT Parks',
      'Electricity provided at industrial tariff rates',
      'Power rationalization subsidy of up to ₹10 Lakhs for energy audits',
      'Market development and patent filing reimbursement',
    ],
    zones: 'Zone I, II and Tier-2 / Tier-3 tech development hubs',
  },
];

export default function IncentivesPage() {
  const [selectedSector, setSelectedSector] = useState('All');
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const sectorFilter = selectedSector === 'All' ? undefined : selectedSector;
    getCanonicalRules(sectorFilter, 30)
      .then((res) => {
        setRules(res.rules || []);
      })
      .catch(() => setRules([]))
      .finally(() => setLoading(false));
  }, [selectedSector]);

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-600">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Incentives & Schemes</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Maharashtra State Industrial Schemes & Subsidies
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Explore 1,279 codified canonical rules for subsidies, capital grants, and tariff exemptions.
            </p>
          </div>

          <Link
            href="/assess"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0"
          >
            Assess My Scheme Eligibility →
          </Link>
        </div>

        {/* Featured State Schemes */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Flagship Industrial Policies
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURED_SCHEMES.map((sch) => (
              <div key={sch.code} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                      {sch.code}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{sch.dept}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm mb-1">{sch.title}</h3>
                  <p className="text-xs text-blue-700 font-semibold mb-3">Target Sector: {sch.sector}</p>

                  <div className="space-y-1.5 mb-4">
                    {sch.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Geographic Scope: <strong className="text-slate-700">{sch.zones}</strong></span>
                  <Link
                    href={`/assess?demo=${sch.code.toLowerCase().includes('textile') ? 'textile' : 'ev'}`}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Test in Demo →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canonical Rules Explorer */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm">Codified Canonical Policy Rules</h2>
              <p className="text-xs text-slate-500">Structured eligibility criteria from official Maharashtra Government Gazettes</p>
            </div>

            {/* Sector Filters */}
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Textile', 'EV', 'IT', 'MSME', 'Electronics', 'Food Processing'].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    selectedSector === sec
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-6 justify-center">
                <svg className="animate-spin w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Loading policy rules from database…</span>
              </div>
            ) : rules.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No rules found for this sector filter.</p>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => {
                  let incentives: any[] = [];
                  let criteria: any = {};
                  try {
                    if (rule.incentive_details_json) incentives = JSON.parse(rule.incentive_details_json);
                    if (rule.eligibility_criteria_json) criteria = JSON.parse(rule.eligibility_criteria_json);
                  } catch {}

                  return (
                    <div key={rule.canonical_rule_id} className="border border-slate-200 rounded-xl p-4 hover:border-emerald-300 transition-colors bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {rule.canonical_rule_id}
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-sm">{rule.rule_name}</h3>
                        </div>
                        <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">
                          {rule.policy_sector}
                        </span>
                      </div>

                      {/* Criteria */}
                      {criteria.specific_conditions && criteria.specific_conditions.length > 0 && (
                        <div className="text-xs text-slate-600 mb-2">
                          <span className="font-bold text-slate-700">Eligibility Criteria: </span>
                          <span>{criteria.specific_conditions.slice(0, 2).join('; ')}</span>
                        </div>
                      )}

                      {/* Incentives */}
                      {incentives && incentives.length > 0 && (
                        <div className="mt-2 bg-emerald-50/40 border border-emerald-100 p-2.5 rounded-lg space-y-1">
                          {incentives.map((inc, iIdx) => (
                            <div key={iIdx} className="text-xs text-emerald-950 flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">💰</span>
                              <div>
                                <span className="font-bold">{inc.incentive_type}: </span>
                                <span>{inc.conditions ? inc.conditions.join(', ') : 'Standard policy reimbursement'}</span>
                                {inc.percentage_reimbursement && (
                                  <span className="font-bold ml-1">({inc.percentage_reimbursement}% Reimbursement)</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Confidence: {(rule.confidence * 100).toFixed(0)}% · Sources: {rule.source_count} references</span>
                        {rule.has_form_requirement ? (
                          <span className="text-amber-700 font-semibold font-mono">Mapped Forms: {rule.form_count}</span>
                        ) : (
                          <span>No mapped form in current KB</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
