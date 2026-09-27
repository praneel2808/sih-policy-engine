'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/context/LanguageContext';

interface DocumentItem {
  name: string;
  authority: string;
  required: string;
  brief?: {
    mr: string;
    hi: string;
  };
}

interface DocumentCategory {
  categoryKey: string;
  category: string;
  icon: string;
  items: DocumentItem[];
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    categoryKey: 'docs.cat_corp',
    category: 'Corporate & Identity Documents',
    icon: '🏢',
    items: [
      {
        name: 'Certificate of Incorporation / Registration',
        authority: 'Registrar of Companies (RoC)',
        required: 'Mandatory',
        brief: {
          mr: 'कंपनी किंवा फर्मचे अधिकृत नोंदणी प्रमाणपत्र (ROC/निबंधक).',
          hi: 'कंपनी अथवा फर्म का आधिकारिक पंजीकरण प्रमाण पत्र (ROC)।',
        },
      },
      {
        name: 'Memorandum and Articles of Association (MOA & AOA)',
        authority: 'RoC / Legal Draft',
        required: 'Mandatory for Companies',
        brief: {
          mr: 'कंपनीचे व्यावसायिक उद्देश व अंतर्गत नियमावली (MOA आणि AOA).',
          hi: 'कंपनी के व्यावसायिक उद्देश्य और आंतरिक नियमावली (MOA एवं AOA)।',
        },
      },
      {
        name: 'Partnership Deed / LLP Agreement',
        authority: 'Registrar of Firms',
        required: 'Mandatory for LLPs/Partnerships',
        brief: {
          mr: 'भागीदारी करार किंवा एलएलपी कायदेशीर नोंदणीकृत करारनामा.',
          hi: 'साझेदारी विलेख अथवा एलएलपी पंजीकृत कानूनी अनुबंध।',
        },
      },
      {
        name: 'Enterprise Permanent Account Number (PAN Card)',
        authority: 'Income Tax Dept.',
        required: 'Mandatory',
        brief: {
          mr: 'उद्योगाचे अधिकृत व्यवसाय पॅन कार्ड (आयकर विभाग).',
          hi: 'उद्यम का आधिकारिक व्यवसाय पैन कार्ड (आयकर विभाग)।',
        },
      },
      {
        name: 'Authorized Signatory Board Resolution / Power of Attorney',
        authority: 'Company Board',
        required: 'Mandatory',
        brief: {
          mr: 'अधिकृत स्वाक्षरीकर्ता संचालक मंडळ ठराव किंवा मुखत्यारपत्र.',
          hi: 'अधिकृत हस्ताक्षरकर्ता निदेशक मंडल प्रस्ताव अथवा मुख्तारनामा।',
        },
      },
    ],
  },
  {
    categoryKey: 'docs.cat_land',
    category: 'Land & Location Clearances',
    icon: '📍',
    items: [
      {
        name: 'MIDC Plot Allotment Letter & Agreement to Lease',
        authority: 'MIDC',
        required: 'Mandatory for MIDC Plots',
        brief: {
          mr: 'एमआयडीसी औद्योगिक भूखंड वाटप पत्र व भाडेपट्टा करार.',
          hi: 'एमआईडीसी औद्योगिक भूखंड आवंटन पत्र एवं पट्टा अनुबंध।',
        },
      },
      {
        name: '7/12 Land Revenue Extract & 8A Mutation Entry',
        authority: 'Revenue Department, GoM',
        required: 'Mandatory for Private Land',
        brief: {
          mr: 'जमिनीचा अद्ययावत ७/१२ उतारा आणि ८-अ फेरफार नोंद.',
          hi: 'भूमि का अद्यतन 7/12 राजस्व उद्धरण एवं 8A नामांतरण प्रविष्टि।',
        },
      },
      {
        name: 'Non-Agricultural (NA) Industrial Order',
        authority: 'District Collector',
        required: 'Mandatory for Private Land',
        brief: {
          mr: 'जिल्हाधिकाऱ्यांचा अकृषिक (NA) औद्योगिक वापर अधिकृत आदेश.',
          hi: 'जिलाधिकारी का गैर-कृषि (NA) औद्योगिक उपयोग आदेश।',
        },
      },
      {
        name: 'Zoning Certificate / Development Plan Sanction',
        authority: 'Local Planning Authority / CIDCO / MMRDA',
        required: 'Mandatory',
        brief: {
          mr: 'झोनिंग दाखला व नियोजन प्राधिकरणाचा विकास आराखडा मंजुरी.',
          hi: 'ज़ोनिंग प्रमाण पत्र एवं नियोजन प्राधिकरण की विकास योजना स्वीकृति।',
        },
      },
      {
        name: 'Land Survey / Demarcation Plan',
        authority: 'Land Records Dept.',
        required: 'Required for Boundary Approval',
        brief: {
          mr: 'भूमी अभिलेख विभागाचा जमीन मोजणी नकाशा व हद्द निश्चिती.',
          hi: 'भूमि अभिलेख विभाग का भूमि सर्वेक्षण नक्शा एवं सीमांकन।',
        },
      },
    ],
  },
  {
    categoryKey: 'docs.cat_tech',
    category: 'Technical & Engineering Reports',
    icon: '📐',
    items: [
      {
        name: 'Detailed Project Report (DPR) & Process Flow Chart',
        authority: 'Chartered Engineer / Enterprise',
        required: 'Mandatory',
        brief: {
          mr: 'सविस्तर तांत्रिक प्रकल्प अहवाल (DPR) व उत्पादन प्रक्रिया तक्ता.',
          hi: 'विस्तृत तकनीकी परियोजना रिपोर्ट (DPR) एवं निर्माण प्रक्रिया चार्ट।',
        },
      },
      {
        name: 'Architectural Blueprint & Machinery Layout Drawing',
        authority: 'Registered Architect / DISH',
        required: 'Mandatory for Factories',
        brief: {
          mr: 'कारखाना इमारत आराखडा व यंत्रसामग्री मांडणी नकाशा.',
          hi: 'कारखाना भवन ब्लूप्रिंट एवं मशीनरी लेआउट ड्राइंग।',
        },
      },
      {
        name: 'Chartered Accountant (CA) Capital Investment Certificate',
        authority: 'Practicing Chartered Accountant',
        required: 'Mandatory for PSI-2019',
        brief: {
          mr: 'सनदी लेखापाल (CA) भांडवली गुंतवणूक व यंत्रसामग्री प्रमाणपत्र.',
          hi: 'सनदी लेखाकार (CA) पूंजीगत निवेश एवं मशीनरी प्रमाण पत्र।',
        },
      },
      {
        name: 'Connected Electrical Load & Single Line Diagram (SLD)',
        authority: 'Licensed Electrical Contractor',
        required: 'Mandatory for Power Sanction',
        brief: {
          mr: 'वीज भार मागणी गणना व विद्युत सिंगल लाइन आकृती (SLD).',
          hi: 'विद्युत भार गणना एवं इलेक्ट्रिकल सिंगल लाइन आरेख (SLD)।',
        },
      },
      {
        name: 'Water Balance Diagram & Quota Requirement',
        authority: 'Environmental Engineer',
        required: 'Mandatory for MPCB CTE',
        brief: {
          mr: 'दैनिक पाणी समतोल तक्ता व औद्योगिक पाण्याचा कोटा आवश्यकता.',
          hi: 'दैनिक जल संतुलन आरेख एवं औद्योगिक जल कोटा आवश्यकता।',
        },
      },
    ],
  },
  {
    categoryKey: 'docs.cat_env',
    category: 'Environmental & Safety Undertakings',
    icon: '🌿',
    items: [
      {
        name: 'Effluent Treatment Plant (ETP/STP) Design & Undertaking',
        authority: 'Pollution Control Consultant',
        required: 'Mandatory for Red/Orange Units',
        brief: {
          mr: 'सांडपाणी प्रक्रिया संयंत्र (ETP) डिझाइन व शून्य विसर्ग हमीपत्र.',
          hi: 'अपशिष्ट जल उपचार संयंत्र (ETP) डिजाइन व शून्य निर्वहन वचनपत्र।',
        },
      },
      {
        name: 'Hazardous Waste Management Plan (Form 1)',
        authority: 'MPCB',
        required: 'Required for Chemical/Engineering Units',
        brief: {
          mr: 'धोकादायक कचरा सुरक्षित विल्हेवाट व्यवस्थापन योजना (फॉर्म १).',
          hi: 'खतरनाक अपशिष्ट सुरक्षित निपटान प्रबंधन योजना (फॉर्म 1)।',
        },
      },
      {
        name: 'On-site Emergency Disaster Management Plan (DMP)',
        authority: 'DISH / Safety Auditor',
        required: 'Required for Hazard Units',
        brief: {
          mr: 'कारखान्यातील आपत्कालीन संकट व्यवस्थापन योजना (DMP).',
          hi: 'कारखाने में ऑन-साइट आपातकालीन आपदा प्रबंधन योजना (DMP)।',
        },
      },
      {
        name: 'Fire Safety Equipment Compliance Certificate',
        authority: 'Fire Department',
        required: 'Mandatory',
        brief: {
          mr: 'अग्निशामक सुरक्षा उपकरणे उभारणी व पूर्तता प्रमाणपत्र.',
          hi: 'अग्निशमन सुरक्षा उपकरण स्थापना एवं अनुपालन प्रमाण पत्र।',
        },
      },
    ],
  },
];

function getLocalizedRequiredBadge(req: string, t: (k: string, d?: string) => string): string {
  switch (req) {
    case 'Mandatory':
      return t('docs.mandatory', 'Mandatory');
    case 'Mandatory for Companies':
      return t('docs.mand_companies', 'Mandatory for Companies');
    case 'Mandatory for LLPs/Partnerships':
      return t('docs.mand_llp', 'Mandatory for LLPs/Partnerships');
    case 'Mandatory for MIDC Plots':
      return t('docs.mand_midc', 'Mandatory for MIDC Plots');
    case 'Mandatory for Private Land':
      return t('docs.mand_private', 'Mandatory for Private Land');
    case 'Mandatory for Factories':
      return t('docs.mand_factories', 'Mandatory for Factories');
    case 'Mandatory for PSI-2019':
      return t('docs.mand_psi', 'Mandatory for PSI-2019');
    case 'Mandatory for Power Sanction':
      return t('docs.mand_power', 'Mandatory for Power Sanction');
    case 'Mandatory for MPCB CTE':
      return t('docs.mand_cte', 'Mandatory for MPCB CTE');
    case 'Mandatory for Red/Orange Units':
      return t('docs.mand_red_orange', 'Mandatory for Red/Orange Units');
    case 'Required for Chemical/Engineering Units':
      return t('docs.req_chemical', 'Required for Chemical/Engineering Units');
    case 'Required for Hazard Units':
      return t('docs.req_hazard', 'Required for Hazard Units');
    case 'Required for Boundary Approval':
      return t('docs.req_boundary', 'Required for Boundary Approval');
    default:
      return req;
  }
}

export default function DocumentsPage() {
  const { t, lang } = useLanguage();
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
              <Link href="/" className="hover:text-blue-600">{t('nav.dashboard', 'Dashboard')}</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">{t('nav.documents', 'Documents')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('docs.title', 'Standard Statutory Documents & Verification Checklist')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('docs.subtitle', 'Verified document requirements across Maharashtra Single Window clearance departments.')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold">{t('docs.prep_progress', 'Preparation Progress')}</p>
              <p className="text-xs font-extrabold text-blue-700">
                {lang === 'mr'
                  ? `${totalCount} पैकी ${checkedCount} ${t('docs.ready_count', 'तयार')}`
                  : lang === 'hi'
                  ? `${totalCount} में से ${checkedCount} ${t('docs.ready_count', 'तैयार')}`
                  : `${checkedCount} of ${totalCount} ${t('docs.ready_count', 'Ready')}`}
              </p>
            </div>
            <Link
              href="/assess"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0"
            >
              {t('docs.assess_btn', 'Assess For My Project →')}
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
                  <h2 className="font-extrabold text-slate-900 text-sm">{t(cat.categoryKey, cat.category)}</h2>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                  {cat.items.length} {t('res.documents_tab', 'Documents')}
                </span>
              </div>

              <div className="p-6 divide-y divide-slate-100">
                {cat.items.map((doc, idx) => {
                  const isChecked = !!checkedDocs[doc.name];
                  const docBrief = lang !== 'en' && doc.brief ? doc.brief[lang as 'mr' | 'hi'] : null;

                  return (
                    <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDoc(doc.name)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 mt-0.5 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold transition-colors ${isChecked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {doc.name}
                          </p>
                          {docBrief && (
                            <div className="mt-1 flex items-start gap-1.5 text-xs text-blue-800 bg-blue-50/80 border border-blue-200/70 rounded-md px-2 py-0.5">
                              <span className="shrink-0 text-sm">💡</span>
                              <span className="font-medium leading-relaxed">{docBrief}</span>
                            </div>
                          )}
                          <p className="text-[11px] text-slate-500 mt-1">
                            {t('docs.issuing_auth', 'Issuing / Verifying Authority:')} <span className="text-slate-700 font-medium">{doc.authority}</span>
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                        doc.required.includes('Mandatory')
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {getLocalizedRequiredBadge(doc.required, t)}
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
