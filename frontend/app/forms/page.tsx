'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { FormRequirement } from '@/types';
import { getForms } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

function formTypeBadge(type?: string): React.ReactNode {
  if (!type) return null;
  const colors: Record<string, string> = {
    APPLICATION_FORM: 'bg-blue-50 text-blue-700 border-blue-200',
    PRESCRIBED_FORM: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ANNEXURE: 'bg-purple-50 text-purple-700 border-purple-200',
    UNDERTAKING: 'bg-orange-50 text-orange-700 border-orange-200',
    RETURN_REPORTING_FORM: 'bg-teal-50 text-teal-700 border-teal-200',
    AFFIDAVIT: 'bg-rose-50 text-rose-700 border-rose-200',
    PROFORMA: 'bg-amber-50 text-amber-700 border-amber-200',
    DECLARATION: 'bg-pink-50 text-pink-700 border-pink-200',
  };
  const cls = colors[type] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${cls}`}>
      {type.replace(/_/g, ' ')}
    </span>
  );
}

function getFormBrief(form: FormRequirement, lang: string): string | null {
  if (lang === 'en') return null;
  const name = form.form_name.toLowerCase();
  const type = form.form_type?.toUpperCase() || '';

  if (lang === 'mr') {
    if (name.includes('water') || name.includes('effluent') || name.includes('etp')) {
      return 'पाणी पुरवठा, सांडपाणी प्रक्रिया व जल विसर्जनासंबंधीचा अधिकृत फॉर्म.';
    }
    if (name.includes('electricity') || name.includes('power') || name.includes('load') || name.includes('substation')) {
      return 'विद्युत जोडणी, भार मंजुरी आणि वीज उपकेंद्रासंबंधीचा अधिकृत फॉर्म.';
    }
    if (name.includes('pollution') || name.includes('consent') || name.includes('mpcb') || name.includes('cte') || name.includes('cto')) {
      return 'प्रदूषण नियंत्रण मंडळाची संमती आणि पर्यावरण नियम पालनाचा फॉर्म.';
    }
    if (name.includes('stamp') || name.includes('duty') || name.includes('exemption')) {
      return 'मुद्रांक शुल्क सवलत, नोंदणी शुल्क माफी व कर सूट मिळवण्यासाठीचा फॉर्म.';
    }
    if (name.includes('subsidy') || name.includes('incentive') || name.includes('psi') || name.includes('grant')) {
      return 'राज्य औद्योगिक प्रोत्साहन धोरणांतर्गत वित्तीय अनुदान मिळवण्याचा विहित फॉर्म.';
    }
    if (name.includes('factory') || name.includes('dish') || name.includes('license') || name.includes('safety')) {
      return 'कारखाना कायदा व कामगार सुरक्षेशी संबंधित नोंदणी आणि परवाना अर्ज.';
    }
    if (name.includes('fire') || name.includes('noc')) {
      return 'अग्निशमन सुरक्षा व्यवस्था व तात्पुरता/अंतिम ना-हरकत (NOC) अर्ज.';
    }
    if (name.includes('boiler') || name.includes('vessel')) {
      return 'स्टीम बॉयलर व प्रेशर उपकरणांची अधिकृत तपासणी व प्रमाणपत्र अर्ज.';
    }
    if (name.includes('land') || name.includes('midc') || name.includes('allotment') || name.includes('possession')) {
      return 'एमआयडीसी औद्योगिक भूखंड वाटप, भाडेपट्टा व जमीन ताबा फॉर्म.';
    }
    if (type === 'UNDERTAKING') return 'उद्योजकाने कायदेशीर बंधनांचे पालन करण्याचे अधिकृत हमीपत्र.';
    if (type === 'ANNEXURE') return 'अर्जासोबत आवश्यक कागदपत्रांचे विहित परिशिष्ट / जोडपत्र.';
    if (type === 'AFFIDAVIT') return 'सत्यता आणि नियमांचे पालन दर्शवणारे विहित सत्यप्रतिज्ञापत्र.';
    if (type === 'PROFORMA') return 'शासनाने विहित केलेला अधिकृत नमुना तक्ता किंवा विवरणपत्र.';
    if (type === 'DECLARATION') return 'प्रकल्प माहिती आणि नियमांचे अधिकृत स्वयंघोषणा पत्र.';
    if (type === 'RETURN_REPORTING_FORM') return 'विभागाकडे नियमित सादर करावयाचे नियतकालिक विवरण पत्र.';
    return 'महाराष्ट्र एक खिडकी प्रणालीअंतर्गत विहित केलेला अधिकृत वैधानिक अर्ज.';
  }

  if (lang === 'hi') {
    if (name.includes('water') || name.includes('effluent') || name.includes('etp')) {
      return 'जल आपूर्ति, अपशिष्ट जल उपचार और निर्वहन संबंधी आधिकारिक प्रपत्र।';
    }
    if (name.includes('electricity') || name.includes('power') || name.includes('load') || name.includes('substation')) {
      return 'बिजली कनेक्शन, विद्युत भार स्वीकृति और सबस्टेशन से संबंधित आधिकारिक प्रपत्र।';
    }
    if (name.includes('pollution') || name.includes('consent') || name.includes('mpcb') || name.includes('cte') || name.includes('cto')) {
      return 'प्रदूषण नियंत्रण बोर्ड की सहमति और पर्यावरण नियमों के अनुपालन का प्रपत्र।';
    }
    if (name.includes('stamp') || name.includes('duty') || name.includes('exemption')) {
      return 'स्टाम्प शुल्क छूट, पंजीकरण शुल्क माफी व कर रियायत प्राप्त करने हेतु प्रपत्र।';
    }
    if (name.includes('subsidy') || name.includes('incentive') || name.includes('psi') || name.includes('grant')) {
      return 'राज्य औद्योगिक प्रोत्साहन नीति के तहत वित्तीय सब्सिडी दावे का निर्धारित प्रपत्र।';
    }
    if (name.includes('factory') || name.includes('dish') || name.includes('license') || name.includes('safety')) {
      return 'कारखाना अधिनियम और श्रमिक सुरक्षा संबंधी पंजीकरण व लाइसेंस आवेदन।';
    }
    if (name.includes('fire') || name.includes('noc')) {
      return 'अग्नि सुरक्षा उपाय और अनंतिम/अंतिम अनापत्ति प्रमाण पत्र (NOC) आवेदन।';
    }
    if (name.includes('boiler') || name.includes('vessel')) {
      return 'स्टीम बॉयलर और प्रेशर वेसल्स के आधिकारिक निरीक्षण व प्रमाणन का आवेदन।';
    }
    if (name.includes('land') || name.includes('midc') || name.includes('allotment') || name.includes('possession')) {
      return 'एमआईडीसी औद्योगिक भूखंड आवंटन, पट्टा विलेख और भूमि कब्जा प्रपत्र।';
    }
    if (type === 'UNDERTAKING') return 'उद्यमी द्वारा कानूनी दायित्वों के अनुपालन का आधिकारिक वचनपत्र।';
    if (type === 'ANNEXURE') return 'आवेदन के साथ संलग्न आवश्यक दस्तावेजों का निर्धारित अनुलग्नक।';
    if (type === 'AFFIDAVIT') return 'सत्यता और नियमों के अनुपालन का निर्धारित शपथ पत्र / हलफनामा।';
    if (type === 'PROFORMA') return 'सरकार द्वारा निर्धारित आधिकारिक प्रोफॉर्मा प्रारूप या विवरणी।';
    if (type === 'DECLARATION') return 'परियोजना विवरण और नियमों का आधिकारिक स्व-घोषणा पत्र।';
    if (type === 'RETURN_REPORTING_FORM') return 'विभाग को नियमित रूप से प्रस्तुत किया जाने वाला आवधिक रिटर्न प्रपत्र।';
    return 'महाराष्ट्र एकल खिड़की प्रणाली के तहत निर्धारित आधिकारिक वैधानिक आवेदन।';
  }

  return null;
}

import FormFillerModal from '@/components/FormFillerModal';

export default function FormsPage() {
  const { t, lang } = useLanguage();
  const [forms, setForms] = useState<FormRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [fillerOpen, setFillerOpen] = useState(false);
  const [selectedFormsToFill, setSelectedFormsToFill] = useState<FormRequirement[]>([]);

  useEffect(() => {
    setLoading(true);
    const sector = sectorFilter === 'All' ? undefined : sectorFilter;
    getForms(sector)
      .then(setForms)
      .catch(() => setForms([]))
      .finally(() => setLoading(false));
  }, [sectorFilter]);

  const filteredForms = forms.filter((f) => {
    const matchesSearch =
      !search ||
      f.form_name.toLowerCase().includes(search.toLowerCase()) ||
      (f.form_number && f.form_number.toLowerCase().includes(search.toLowerCase())) ||
      (f.filename && f.filename.toLowerCase().includes(search.toLowerCase())) ||
      (f.rule_name && f.rule_name.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'All' || f.form_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/" className="hover:text-blue-600">{t('nav.dashboard', 'Dashboard')}</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">{t('nav.forms', 'Forms Repository')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('forms.title', 'Maharashtra Single Window Statutory Forms Repository')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('forms.subtitle', '186 extracted application forms, undertakings, annexures, and proformas from Maharashtra Government Gazettes.')}
            </p>
          </div>

          <Link
            href="/assess"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0"
          >
            {t('forms.assess_btn', 'Find Forms For My Project →')}
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="w-full sm:w-80">
              <input
                type="text"
                placeholder={t('forms.search_ph', 'Search by form name, number, gazette…')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>

            {/* Type selector */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {['All', 'APPLICATION_FORM', 'ANNEXURE', 'UNDERTAKING', 'PROFORMA', 'AFFIDAVIT'].map((tType) => (
                <button
                  key={tType}
                  onClick={() => setTypeFilter(tType)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    typeFilter === tType
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tType === 'All' ? (lang === 'mr' ? 'सर्व' : lang === 'hi' ? 'सभी' : 'All') : tType.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Sector tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">{t('forms.sector_label', 'Sector:')}</span>
            {['All', 'Textile', 'EV', 'Electronics', 'IT', 'Chemical', 'Food', 'MSME', 'Labour'].map((sec) => (
              <button
                key={sec}
                onClick={() => setSectorFilter(sec)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  sectorFilter === sec
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {sec === 'All' ? (lang === 'mr' ? 'सर्व' : lang === 'hi' ? 'सभी' : 'All') : sec}
              </button>
            ))}
          </div>
        </div>

        {/* Forms Listing */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-slate-900 text-sm">
              {t('forms.extracted_title', 'Extracted Government Form Requirements')} ({filteredForms.length})
            </h2>
            <span className="text-xs text-slate-400">{t('forms.total_kb', 'Total in Knowledge Base: 186 Forms')}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-12">
              <svg className="animate-spin w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>{t('forms.loading', 'Loading extracted government forms…')}</span>
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-700">{t('forms.no_forms', 'No mapped form found in current knowledge base.')}</p>
              <p className="text-[11px] text-slate-400 mt-1">{t('forms.no_forms_sub', 'Try clearing or adjusting your search filters.')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredForms.map((f) => {
                const formBrief = getFormBrief(f, lang);
                return (
                  <div key={f.form_requirement_id} className="border border-slate-200 rounded-xl p-4 hover:border-purple-300 transition-colors bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            REQ-{f.form_requirement_id}
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-sm">{f.form_name}</h3>
                        </div>
                        {formBrief && (
                          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-purple-900 bg-purple-50/80 border border-purple-200/70 rounded-md px-2.5 py-1">
                            <span className="shrink-0 text-sm">💡</span>
                            <span className="font-medium leading-relaxed">{formBrief}</span>
                          </div>
                        )}
                        {f.form_number && (
                          <p className="text-xs font-mono text-purple-700 font-semibold mt-1">
                            {t('forms.statutory_num', 'Statutory Form Number:')} {f.form_number}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFormsToFill([f]);
                            setFillerOpen(true);
                          }}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg border border-purple-200 transition-colors flex items-center gap-1"
                        >
                          <span>✍️</span>
                          <span>Fill Form</span>
                        </button>
                        {formTypeBadge(f.form_type)}
                        {f.required && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            f.required.toUpperCase() === 'MANDATORY'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {f.required}
                          </span>
                        )}
                      </div>
                    </div>

                    {f.condition && (
                      <p className="text-xs text-slate-600 mb-2">
                        <strong className="text-slate-800">{t('forms.trigger_cond', 'Trigger Condition:')}</strong> {f.condition}
                      </p>
                    )}

                    {f.evidence_text && (
                      <div className="mb-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-xs text-slate-600">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">{t('forms.gazette_passage', 'Gazette Passage:')}</span>
                        &ldquo;{f.evidence_text}&rdquo;
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        {f.filename && (
                          <span className="flex items-center gap-1">
                            📄
                            {f.source_url ? (
                              <a href={f.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {f.filename}
                              </a>
                            ) : (
                              <span>{f.filename}</span>
                            )}
                            {f.page_start && ` (Page ${f.page_start})`}
                          </span>
                        )}
                        {f.submission_method && (
                          <span>{t('forms.mode', 'Mode:')} <strong className="text-slate-600">{f.submission_method}</strong></span>
                        )}
                      </div>

                      {f.fields && f.fields.length > 0 && (
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 text-[10px]">
                          {f.fields.length} Configured Field{f.fields.length === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <FormFillerModal
        isOpen={fillerOpen}
        onClose={() => setFillerOpen(false)}
        forms={selectedFormsToFill}
      />
    </AppLayout>
  );
}
