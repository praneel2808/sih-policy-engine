'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { getCanonicalRules } from '@/lib/api';
import IncentiveCalculator from '@/components/IncentiveCalculator';
import { useLanguage } from '@/context/LanguageContext';

interface FeaturedScheme {
  code: string;
  title: string;
  dept: string;
  sector: string;
  highlights: string[];
  zones: string;
  i18n?: {
    mr?: {
      title: string;
      dept: string;
      sector: string;
      highlights: string[];
      zones: string;
    };
    hi?: {
      title: string;
      dept: string;
      sector: string;
      highlights: string[];
      zones: string;
    };
  };
}

const FEATURED_SCHEMES: FeaturedScheme[] = [
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
    i18n: {
      mr: {
        title: 'प्रोत्साहन योजना २०१९ (PSI-2019)',
        dept: 'उद्योग, ऊर्जा आणि कामगार विभाग',
        sector: 'सर्व औद्योगिक उत्पादन आणि निवडक सेवा उद्योग',
        highlights: [
          'एकूण SGST शी जोडलेले औद्योगिक प्रोत्साहन अनुदान (IPS)',
          'MSME स्थिर भांडवली कर्जावर व्याज अनुदान (५% पर्यंत)',
          '३-५ वर्षांसाठी ₹१ ते ₹२ प्रति युनिट वीज दर अनुदान',
          'झोन C, D, D+ मध्ये वीज शुल्कातून १००% सूट',
          'जमीन भाडेपट्टा व खरेदीसाठी १००% मुद्रांक शुल्क माफी',
        ],
        zones: 'झोन A (विकसित) ते झोन D+ (अविकसित / नक्षलग्रस्त)',
      },
      hi: {
        title: 'प्रोत्साहन पैकेज योजना 2019 (PSI-2019)',
        dept: 'उद्योग, ऊर्जा और श्रम विभाग',
        sector: 'सभी औद्योगिक विनिर्माण और चयनित सेवाएं',
        highlights: [
          'सकल SGST से जुड़ी औद्योगिक संवर्धन सब्सिडी (IPS)',
          'MSME सावधि ऋणों पर ब्याज अनुदान (5% तक)',
          '3-5 वर्षों के लिए ₹1 से ₹2 प्रति यूनिट बिजली शुल्क सब्सिडी',
          'जोन C, D, D+ में बिजली शुल्क से 100% छूट',
          'पट्टा विलेख और भूमि खरीद पर 100% स्टाम्प शुल्क छूट',
        ],
        zones: 'जोन A (विकसित) से जोन D+ (अविकसित / नक्सल प्रभावित)',
      },
    },
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
    i18n: {
      mr: {
        title: 'एकात्मिक व शाश्वत वस्त्रोद्योग धोरण २०२३-२०२८',
        dept: 'वस्त्रोद्योग विभाग, महाराष्ट्र शासन',
        sector: 'वस्त्रोद्योग, तयार कपडे, विणकाम, जिनिंग व तांत्रिक वस्त्रे',
        highlights: [
          'स्पिनिंग, जिनिंग व प्रक्रियेसाठी २५% ते ४५% भांडवली अनुदान',
          'लघु व उच्च दाब पॉवरलूमसाठी विशेष वीज दर सवलत',
          'सांडपाणी प्रक्रिया संयंत्र (ETP/ZLD) भांडवली सहाय्य',
          'तांत्रिक वस्त्रे संशोधन अनुदान व इनक्यूबेटर सहाय्य',
        ],
        zones: 'विदर्भ, मराठवाडा व उत्तर महाराष्ट्राला प्राधान्यासह राज्यव्यापी',
      },
      hi: {
        title: 'एकीकृत एवं सतत वस्त्र नीति 2023-2028',
        dept: 'वस्त्र उद्योग विभाग, महाराष्ट्र सरकार',
        sector: 'कपड़ा, परिधान, बुनाई, जिनिंग और तकनीकी वस्त्र',
        highlights: [
          'कताई, जिनिंग और प्रसंस्करण के लिए 25% से 45% पूंजीगत सब्सिडी',
          'कम और उच्च दाब पावरलूम के लिए विशेष बिजली शुल्क सब्सिडी',
          'अपशिष्ट जल उपचार संयंत्र (ETP/ZLD) पूंजीगत सहायता',
          'तकनीकी कपड़ा अनुसंधान एवं इनक्यूबेटर समर्थन',
        ],
        zones: 'विदर्भ, मराठवाड़ा और उत्तर महाराष्ट्र को प्राथमिकता के साथ राज्यव्यापी',
      },
    },
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
    i18n: {
      mr: {
        title: 'महाराष्ट्र इलेक्ट्रिक वाहन धोरण २०२१',
        dept: 'पर्यावरण व हवामान बदल / उद्योग विभाग',
        sector: 'इलेक्ट्रिक वाहने आणि बॅटरी घटक उत्पादन',
        highlights: [
          'कमी गुंतवणुकीच्या निकषांवर पायनियर / मेगा दर्जा प्रदान',
          'EV उत्पादन घटकांसाठी १००% मुद्रांक शुल्क माफी',
          'यंत्रसामग्रीवर १५% पर्यंत भांडवली अनुदान',
          '१५ वर्षांसाठी वीज शुल्कातून पूर्ण सूट',
        ],
        zones: 'औद्योगिक क्लस्टर्सवर भर (पुणे, औरंगाबाद, नागपूर)',
      },
      hi: {
        title: 'महाराष्ट्र इलेक्ट्रिक वाहन नीति 2021',
        dept: 'पर्यावरण एवं जलवायु परिवर्तन / उद्योग विभाग',
        sector: 'इलेक्ट्रिक वाहन और बैटरी घटक विनिर्माण',
        highlights: [
          'कम निवेश सीमा पर पायनियर / मेगा दर्जा प्रदान',
          'ईवी विनिर्माण इकाइयों के लिए 100% स्टाम्प शुल्क छूट',
          'संयंत्र और मशीनरी पर 15% तक पूंजीगत सब्सिडी',
          '15 वर्षों के लिए बिजली शुल्क से पूर्ण छूट',
        ],
        zones: 'औद्योगिक समूहों पर ध्यान (पुणे, औरंगाबाद, नागपुर)',
      },
    },
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
    i18n: {
      mr: {
        title: 'महाराष्ट्र माहिती तंत्रज्ञान व ITES धोरण २०२३',
        dept: 'माहिती तंत्रज्ञान संचालनालय',
        sector: 'IT / ITES, डेटा सेंटर्स, AI/ML, GCC, AVGC',
        highlights: [
          'डेटा सेंटर्स आणि IT पार्क्ससाठी १००% मुद्रांक शुल्क माफी',
          'औद्योगिक वीज दरानुसार वीज पुरवठा',
          'ऊर्जा ऑडिटसाठी ₹१० लाखांपर्यंत वीज युक्तिसंगतीकरण अनुदान',
          'बाजार विकास आणि पेटंट नोंदणी प्रतिपूर्ती',
        ],
        zones: 'झोन I, II आणि टियर-२ / टियर-३ तंत्रज्ञान विकास केंद्रे',
      },
      hi: {
        title: 'महाराष्ट्र सूचना प्रौद्योगिकी एवं ITES नीति 2023',
        dept: 'सूचना प्रौद्योगिकी निदेशालय',
        sector: 'आईटी / आईटीईएस, डेटा सेंटर, एआई/एमएल, जीसीसी',
        highlights: [
          'डेटा सेंटर और आईटी पार्क के लिए 100% स्टाम्प शुल्क छूट',
          'औद्योगिक टैरिफ दरों पर बिजली उपलब्ध',
          'ऊर्जा ऑडिट के लिए ₹10 लाख तक बिजली युक्तिकरण सब्सिडी',
          'बाजार विकास और पेटेंट फाइलिंग प्रतिपूर्ति',
        ],
        zones: 'जोन I, II और टियर-2 / टियर-3 प्रौद्योगिकी हब',
      },
    },
  },
];

function getRuleBrief(rule: any, lang: string): string | null {
  if (lang === 'en') return null;
  const id = (rule.canonical_rule_id || '').toUpperCase();
  const name = (rule.rule_name || '').toLowerCase();
  const sector = (rule.policy_sector || '').toLowerCase();

  if (lang === 'mr') {
    if (id === 'CANON-0062' || name.includes('ultra mega logistics')) {
      return '२०० एकरपेक्षा जास्त सलग जागेवरील रोबोटिक्स व ड्रोन तंत्रज्ञानाने सुसज्ज अल्ट्रा-मेगा लॉजिस्टिक्स पार्क.';
    }
    if (id === 'CANON-0061' || name.includes('mega logistics park')) {
      return '१०० एकर जागेवरील रोबोटिक्स, AI, IoT व ब्लॉकचेन तंत्रज्ञानयुक्त मेगा लॉजिस्टिक्स पार्क प्रोत्साहन.';
    }
    if (id === 'CANON-0063' || name.includes('multi-storeyed') || name.includes('multi storeyed')) {
      return 'MMRDA, CIDCO, PMRDA हद्दीतील किमान २०,००० चौ. फूट जागेवरील बहुमजली लॉजिस्टिक्स पार्क.';
    }
    if (id === 'CANON-0067' || name.includes('truck terminals') || name.includes('integrated truck')) {
      return 'किमान ५ एकर जागेवरील एकात्मिक ट्रक टर्मिनल्स व लॉजिस्टिक्स हबसाठी शासकीय सवलती.';
    }
    if (id === 'CANON-0070' || name.includes('green logistics')) {
      return 'किमान १०% हरित ऊर्जा वापरणारे आणि पुनर्वापर केंद्र असणारे पर्यावरणपूरक ग्रीन लॉजिस्टिक्स पार्क.';
    }
    if (id === 'CANON-0075' || name.includes('special capital incentives for integrated truck')) {
      return 'झोन-१ व २ मधील राष्ट्रीय महामार्ग किंवा मुख्य रस्त्यावरील ट्रक टर्मिनल्ससाठी २०% भांडवली अनुदान.';
    }
    if (name.includes('electricity') || name.includes('power') || name.includes('duty exemption')) {
      return 'विहित कालावधीसाठी औद्योगिक वीज शुल्कातून १००% परतावा व सवलत.';
    }
    if (name.includes('building permission') || name.includes('low risk')) {
      return 'कमी जोखमीच्या इमारतींसाठी स्वयं-प्रमाणीकरणाद्वारे जलदगती बांधकाम परवानगी.';
    }
    if (name.includes('fsi') || name.includes('pharma')) {
      return 'औद्योगिक विस्तारासाठी अतिरिक्त चटई क्षेत्र (FSI) आणि प्रीमियम परतावा सवलत.';
    }
    if (name.includes('epr') || name.includes('registration fee')) {
      return 'विस्तारित उत्पादक जबाबदारी (EPR) नोंदणी शुल्क व वार्षिक अनुपालन निकष.';
    }
    if (name.includes('ultra mega') || name.includes('mega ev') || name.includes('logistics park')) {
      return 'अल्ट्रा-मेगा प्रकल्पांसाठी विशेष सवलती, भूखंड वाटप व अनुदान पॅकेज.';
    }
    if (name.includes('information technology') || name.includes('it establishment')) {
      return 'माहिती तंत्रज्ञान उद्योगांसाठी पायाभूत सुविधा, वाढीव FSI आणि वीज दर सवलत.';
    }
    if (name.includes('bank guarantee') || name.includes('health care')) {
      return 'पर्यावरण संमतीसाठी सादर करावयाची बँक हमी व प्रदूषण नियंत्रण अटी.';
    }
    if (name.includes('validity') || name.includes('industrial policy')) {
      return 'महाराष्ट्र राज्य औद्योगिक धोरणाची अधिकृत अंमलबजावणी व वैधता मुदत.';
    }
    if (name.includes('fly ash') || name.includes('thermal')) {
      return 'औष्णिक केंद्रांमधून निघणाऱ्या फ्लाय ॲशचा पुनर्वापर व पर्यावरणीय उद्दिष्टे.';
    }
    if (name.includes('lay-off') || name.includes('review')) {
      return 'कामगार कायदा व तात्पुरती कामबंदी (Lay-off) पुनरावलोकनाची कालमर्यादा.';
    }
    return `शासकीय राजपत्रातील संहिताबद्ध नियम (${rule.policy_sector || 'उद्योग'}).`;
  }

  if (lang === 'hi') {
    if (id === 'CANON-0062' || name.includes('ultra mega logistics')) {
      return '200 एकड़ से अधिक संलग्न भूमि पर रोबोटिक्स व ड्रोन तकनीक से सुसज्जित अल्ट्रा-मेगा लॉजिस्टिक्स पार्क।';
    }
    if (id === 'CANON-0061' || name.includes('mega logistics park')) {
      return '100 एकड़ भूमि पर रोबोटिक्स, AI, IoT व ब्लॉकचेन तकनीक युक्त मेगा लॉजिस्टिक्स पार्क प्रोत्साहन।';
    }
    if (id === 'CANON-0063' || name.includes('multi-storeyed') || name.includes('multi storeyed')) {
      return 'MMRDA, CIDCO, PMRDA क्षेत्र में न्यूनतम 20,000 वर्ग फुट भूमि पर बहुमंजिला लॉजिस्टिक्स पार्क।';
    }
    if (id === 'CANON-0067' || name.includes('truck terminals') || name.includes('integrated truck')) {
      return 'न्यूनतम 5 एकड़ भूमि पर एकीकृत ट्रक टर्मिनल और लॉजिस्टिक्स हब के लिए सरकारी रियायतें।';
    }
    if (id === 'CANON-0070' || name.includes('green logistics')) {
      return 'न्यूनतम 10% हरित ऊर्जा का उपयोग करने वाले और पुनर्चक्रण केंद्र युक्त पर्यावरण अनुकूल ग्रीन लॉजिस्टिक्स पार्क।';
    }
    if (id === 'CANON-0075' || name.includes('special capital incentives for integrated truck')) {
      return 'ज़ोन-1 और 2 में राष्ट्रीय राजमार्ग या मुख्य मार्ग पर ट्रक टर्मिनलों के लिए 20% पूंजीगत सब्सिडी।';
    }
    if (name.includes('electricity') || name.includes('power') || name.includes('duty exemption')) {
      return 'निर्धारित अवधि के लिए औद्योगिक विद्युत शुल्क से 100% रिफंड व छूट।';
    }
    if (name.includes('building permission') || name.includes('low risk')) {
      return 'कम जोखिम वाली इमारतों के लिए स्व-प्रमाणीकरण द्वारा त्वरित निर्माण अनुमति।';
    }
    if (name.includes('fsi') || name.includes('pharma')) {
      return 'औद्योगिक विस्तार हेतु अतिरिक्त एफएसआई (FSI) और प्रीमियम प्रतिपूर्ति रियायत।';
    }
    if (name.includes('epr') || name.includes('registration fee')) {
      return 'विस्तारित उत्पादक उत्तरदायित्व (EPR) पंजीकरण शुल्क एवं वार्षिक अनुपालन मानदंड।';
    }
    if (name.includes('ultra mega') || name.includes('mega ev') || name.includes('logistics park')) {
      return 'अल्ट्रा-मेगा परियोजनाओं के लिए विशेष प्रोत्साहन, भूमि आवंटन एवं सब्सिडी पैकेज।';
    }
    if (name.includes('information technology') || name.includes('it establishment')) {
      return 'सूचना प्रौद्योगिकी उद्योगों हेतु बुनियादी ढांचा, अतिरिक्त FSI और बिजली दर छूट।';
    }
    if (name.includes('bank guarantee') || name.includes('health care')) {
      return 'पर्यावरण सम्मति हेतु प्रस्तुत की जाने वाली बैंक गारंटी एवं प्रदूषण नियंत्रण शर्तें।';
    }
    if (name.includes('validity') || name.includes('industrial policy')) {
      return 'महाराष्ट्र राज्य औद्योगिक नीति की आधिकारिक संचालन और वैधता अवधि।';
    }
    if (name.includes('fly ash') || name.includes('thermal')) {
      return 'ताप विद्युत संयंत्रों से निकलने वाली फ्लाई ऐश का पुनर्चक्रण व पर्यावरणीय लक्ष्य।';
    }
    if (name.includes('lay-off') || name.includes('review')) {
      return 'श्रम कानून एवं अस्थायी कार्यबंदी (Lay-off) समीक्षा की समय-सीमा।';
    }
    return `सरकारी राजपत्र में संहिताबद्ध नियम (${rule.policy_sector || 'उद्योग'})।`;
  }

  return null;
}

function getLocalizedCriteria(cond: string, lang: string): string {
  if (lang === 'en' || !cond) return cond;

  const c = cond.trim();

  if (c.includes('Sale of Base oil') || c.includes('Lubrication Oil')) {
    return lang === 'mr' ? 'बेस ऑईल / ल्युब्रिकेशन ऑईलची विक्री > १,००,००० MTPA' : 'बेस ऑयल / ल्युब्रिकेशन ऑयल की बिक्री > 1,00,000 MTPA';
  }
  if (c.includes('200 acres') && c.includes('robotics')) {
    return lang === 'mr'
      ? 'किमान २०० एकर सलग जमिनीवर विस्तार; जागतिक दर्जाचे तंत्रज्ञान, रोबोटिक्स आणि ड्रोन प्रणालींचा समावेश.'
      : 'न्यूनतम 200 एकड़ संलग्न भूमि पर विस्तार; विश्वस्तरीय तकनीक, रोबोटिक्स और ड्रोन प्रणालियों का समावेश।';
  }
  if (c.includes('100 acres') && c.includes('robotics')) {
    return lang === 'mr'
      ? 'किमान १०० एकर सलग जमिनीवर विस्तार; रोबोटिक्स, AI, IoT आणि ब्लॉकचेनसारखे जागतिक तंत्रज्ञान.'
      : 'न्यूनतम 100 एकड़ संलग्न भूमि पर विस्तार; रोबोटिक्स, AI, IoT और ब्लॉकचेन जैसी विश्वस्तरीय तकनीक।';
  }
  if (c.includes('20,000 sq.ft') || c.includes('MMRDA, CIDCO')) {
    return lang === 'mr'
      ? 'किमान २०,००० चौ. फूट जागा; MMRDA, CIDCO, PMRDA, महानगरपालिका अशा विशेष नगर नियोजन प्राधिकरणांच्या अखत्यारीत.'
      : 'न्यूनतम 20,000 वर्ग फुट भूमि; MMRDA, CIDCO, PMRDA, नगर निगम जैसे विशेष नगर नियोजन प्राधिकरणों के अधिकार क्षेत्र में।';
  }
  if (c.includes('Minimum area of 5 Acres (3 acres') || (c.includes('5 Acres') && c.includes('National Highway'))) {
    return lang === 'mr'
      ? 'किमान ५ एकर जागा (राष्ट्रीय महामार्गालगत असल्यास ३ एकर); केवळ झोन-१ आणि झोन-२ भागात स्थित.'
      : 'न्यूनतम 5 एकड़ भूमि (राष्ट्रीय राजमार्ग से संलग्न होने पर 3 एकड़); केवल ज़ोन-1 और ज़ोन-2 क्षेत्रों में स्थित।';
  }
  if (c.includes('Minimum area of 5 acres') || c.includes('5 acres')) {
    return lang === 'mr' ? 'किमान ५ एकर क्षेत्रफळ' : 'न्यूनतम 5 एकड़ क्षेत्रफल';
  }
  if (c.includes('10% of power consumed') || c.includes('green energy sources')) {
    return lang === 'mr'
      ? 'किमान १०% वीज वापर हरित ऊर्जा स्त्रोतांद्वारे असावा; पुनर्वापर (Recycling) केंद्रांची उपलब्धता.'
      : 'कम से कम 10% बिजली की खपत हरित ऊर्जा स्रोतों से होनी चाहिए; पुनर्चक्रण (Recycling) केंद्रों की उपस्थिति।';
  }
  return cond;
}

function getLocalizedIncentiveType(type: string, lang: string): string {
  if (lang === 'en' || !type) return type;
  const map: Record<string, { mr: string; hi: string }> = {
    'Capital Subsidy': { mr: 'भांडवली अनुदान', hi: 'पूंजीगत सब्सिडी' },
    'Interest Subsidy': { mr: 'व्याज अनुदान', hi: 'ब्याज सब्सिडी' },
    'Electricity Duty Exemption': { mr: 'वीज शुल्क माफी', hi: 'विद्युत शुल्क छूट' },
    'Power Tariff Subsidy': { mr: 'वीज दर सवलत', hi: 'बिजली दर रियायत' },
    'Stamp Duty Exemption': { mr: 'मुद्रांक शुल्क माफी', hi: 'स्टाम्प शुल्क छूट' },
    'SGST Refund': { mr: 'SGST परतावा', hi: 'SGST प्रतिपूर्ति' },
    'Industrial Promotion Subsidy (IPS)': { mr: 'औद्योगिक प्रोत्साहन अनुदान (IPS)', hi: 'औद्योगिक प्रोत्साहन सब्सिडी (IPS)' },
  };
  return map[type]?.[lang as 'mr' | 'hi'] || type;
}

export default function IncentivesPage() {
  const { t, lang } = useLanguage();
  const [selectedSector, setSelectedSector] = useState('All');
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
              <Link href="/" className="hover:text-blue-600">{t('nav.dashboard', 'Dashboard')}</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">{t('nav.incentives', 'Incentives & Schemes')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('inc.title', 'Maharashtra State Industrial Schemes & Subsidies')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('inc.subtitle', 'Explore 1,279 codified canonical rules for subsidies, capital grants, and tariff exemptions.')}
            </p>
          </div>

          <Link
            href="/assess"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0"
          >
            {t('inc.assess_btn', 'Assess My Scheme Eligibility →')}
          </Link>
        </div>

        {/* Interactive Subsidy & Amortization Calculator */}
        <IncentiveCalculator />

        {/* Featured State Schemes */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            {t('inc.flagship', 'Flagship Industrial Policies')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURED_SCHEMES.map((sch) => {
              const localized = (lang !== 'en' && sch.i18n && sch.i18n[lang as 'mr' | 'hi']) || sch;
              return (
                <div key={sch.code} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                        {sch.code}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{localized.dept}</span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm mb-1">{localized.title}</h3>
                    <p className="text-xs text-blue-700 font-semibold mb-3">
                      {t('inc.target_sector', 'Target Sector:')} {localized.sector}
                    </p>

                    <div className="space-y-1.5 mb-4">
                      {localized.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{t('inc.geo_scope', 'Geographic Scope:')} <strong className="text-slate-700">{localized.zones}</strong></span>
                    <Link
                      href={`/assess?demo=${sch.code.toLowerCase().includes('textile') ? 'textile' : 'ev'}`}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      {t('inc.test_demo', 'Test in Demo →')}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Canonical Rules Explorer */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm">{t('inc.codified_rules', 'Codified Canonical Policy Rules')}</h2>
              <p className="text-xs text-slate-500">{t('inc.codified_sub', 'Structured eligibility criteria from official Maharashtra Government Gazettes')}</p>
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
                  {sec === 'All' ? (lang === 'mr' ? 'सर्व' : lang === 'hi' ? 'सभी' : 'All') : t('sector.' + sec, sec)}
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
                <span>{t('inc.loading', 'Loading policy rules from database…')}</span>
              </div>
            ) : rules.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">{t('inc.no_rules', 'No rules found for this sector filter.')}</p>
            ) : (
              <div className="space-y-4">
                {rules.map((rule) => {
                  let incentives: any[] = [];
                  let criteria: any = {};
                  try {
                    if (rule.incentive_details_json) incentives = JSON.parse(rule.incentive_details_json);
                    if (rule.eligibility_criteria_json) criteria = JSON.parse(rule.eligibility_criteria_json);
                  } catch {}

                  const ruleBrief = getRuleBrief(rule, lang);

                  return (
                    <div key={rule.canonical_rule_id} className="border border-slate-200 rounded-xl p-4 hover:border-emerald-300 transition-colors bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {rule.canonical_rule_id}
                            </span>
                            <h3 className="font-extrabold text-slate-900 text-sm">{rule.rule_name}</h3>
                          </div>
                          {ruleBrief && (
                            <div className="mt-1.5 flex items-start gap-1.5 text-xs text-emerald-900 bg-emerald-50/80 border border-emerald-200/70 rounded-md px-2.5 py-1">
                              <span className="shrink-0 text-sm">💡</span>
                              <span className="font-medium leading-relaxed">{ruleBrief}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100 shrink-0">
                          {rule.policy_sector ? t('sector.' + rule.policy_sector, rule.policy_sector) : ''}
                        </span>
                      </div>

                      {/* Criteria */}
                      {criteria.specific_conditions && criteria.specific_conditions.length > 0 && (
                        <div className="text-xs text-slate-600 mb-2">
                          <span className="font-bold text-slate-700">{t('inc.eligibility_criteria', 'Eligibility Criteria:')} </span>
                          <span>{criteria.specific_conditions.slice(0, 2).map((c: string) => getLocalizedCriteria(c, lang)).join('; ')}</span>
                        </div>
                      )}

                      {/* Incentives */}
                      {incentives && incentives.length > 0 && (
                        <div className="mt-2 bg-emerald-50/40 border border-emerald-100 p-2.5 rounded-lg space-y-1">
                          {incentives.map((inc, iIdx) => (
                            <div key={iIdx} className="text-xs text-emerald-950 flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">💰</span>
                              <div>
                                <span className="font-bold">{getLocalizedIncentiveType(inc.incentive_type, lang)}: </span>
                                <span>{inc.conditions ? inc.conditions.join(', ') : (lang === 'mr' ? 'मानक धोरण परतावा' : lang === 'hi' ? 'मानक नीति प्रतिपूर्ति' : 'Standard policy reimbursement')}</span>
                                {inc.percentage_reimbursement && (
                                  <span className="font-bold ml-1">({inc.percentage_reimbursement}% {lang === 'mr' ? 'परतावा' : lang === 'hi' ? 'रिफंड' : 'Reimbursement'})</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{t('inc.confidence', 'Confidence')}: {(rule.confidence * 100).toFixed(0)}% · {t('inc.sources', 'Sources')}: {rule.source_count} {t('inc.references', 'references')}</span>
                        {rule.has_form_requirement ? (
                          <span className="text-amber-700 font-semibold font-mono">{t('inc.mapped_forms', 'Mapped Forms')}: {rule.form_count}</span>
                        ) : (
                          <span>{t('inc.no_mapped_forms', 'No mapped form in current KB')}</span>
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
