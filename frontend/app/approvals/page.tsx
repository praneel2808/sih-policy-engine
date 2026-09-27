'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/context/LanguageContext';

interface ApprovalItem {
  name: string;
  dept: string;
  timeline: string;
  type: string;
  desc: string;
  docs: string[];
  brief?: {
    mr: string;
    hi: string;
  };
}

interface ApprovalGroup {
  stage: string;
  icon: string;
  description: string;
  items: ApprovalItem[];
}

const APPROVAL_CATEGORIES: ApprovalGroup[] = [
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
        brief: {
          mr: 'उद्योग सुरू करण्यासाठी एकाच अर्जाद्वारे विविध शासकीय विभागांच्या परवानग्या मिळवण्याची एकत्रित प्रणाली.',
          hi: 'उद्योग शुरू करने के लिए एकल आवेदन द्वारा विभिन्न सरकारी विभागों से स्वीकृतियां प्राप्त करने की एकीकृत प्रणाली।',
        },
      },
      {
        name: 'Consent to Establish (CTE) — MPCB',
        dept: 'Maharashtra Pollution Control Board',
        timeline: '45 Days SLA',
        type: 'Environmental Clearance',
        desc: 'Clearance under Water & Air Acts categorised by industry pollution index (Red / Orange / Green / White).',
        docs: ['Environmental Management Plan', 'Manufacturing Flow Chart', 'Effluent Treatment Plant Design'],
        brief: {
          mr: 'प्रदूषण नियंत्रण मंडळाकडून (MPCB) कारखाना बांधकाम सुरू करण्यापूर्वी मिळवायचा पर्यावरण ना-हरकत परवाना.',
          hi: 'प्रदूषण नियंत्रण बोर्ड (MPCB) से कारखाना निर्माण शुरू करने से पहले प्राप्त की जाने वाली पर्यावरण स्वीकृति।',
        },
      },
      {
        name: 'Factory Building Plan Approval',
        dept: 'Directorate of Industrial Safety and Health (DISH)',
        timeline: '30 Days SLA',
        type: 'Safety & Layout Approval',
        desc: 'Layout and structural safety vetting under Rule 3 of Maharashtra Factories Rules 1963.',
        docs: ['Structural Drawings', 'Machinery Layout Plan', 'Ventilation & Fire Egress Plan'],
        brief: {
          mr: 'कामगार सुरक्षा व संरचनेच्या नियमांनुसार (DISH) कारखान्याच्या इमारतीचा नकाशा मंजूर करून घेणे.',
          hi: 'श्रमिक सुरक्षा और संरचना नियमों के तहत (DISH) कारखाने के भवन का नक्शा स्वीकृत कराना।',
        },
      },
      {
        name: 'Fire Department Provisional NOC',
        dept: 'Maharashtra Fire Services / Local Planning Authority',
        timeline: '21 Days SLA',
        type: 'Safety Clearance',
        desc: 'Fire fighting setup approval for industrial high-hazard or large built-up premises.',
        docs: ['Site Fire Hydrant Map', 'Architectural Layout', 'Hazardous Materials Storage Plan'],
        brief: {
          mr: 'अग्निशमन विभागाकडून तात्पुरता ना-हरकत दाखला, ज्यामध्ये आग प्रतिबंधक उपाययोजनांची पडताळणी होते.',
          hi: 'अग्निशमन विभाग से अनंतिम अनापत्ति प्रमाण पत्र (NOC), जिसमें अग्नि सुरक्षा उपायों का सत्यापन होता है।',
        },
      },
      {
        name: 'MIDC Plot Allotment & Land Possession',
        dept: 'Maharashtra Industrial Development Corporation',
        timeline: '15 Days SLA',
        type: 'Industrial Land Allotment',
        desc: 'Lease deed execution and land possession handover for industrial plots across MIDC zones.',
        docs: ['Letter of Intent (LoI)', 'Initial Premium Payment Receipt', 'Board Resolution'],
        brief: {
          mr: 'एमआयडीसी (MIDC) औद्योगिक क्षेत्रात भूखंड वाटप आणि जमिनीचा प्रत्यक्ष ताबा घेण्याची कायदेशीर प्रक्रिया.',
          hi: 'एमआईडीसी (MIDC) औद्योगिक क्षेत्र में भूखंड आवंटन और भूमि का वास्तविक कब्जा लेने की कानूनी प्रक्रिया।',
        },
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
        brief: {
          mr: 'इमारत बांधकाम सुरू करण्यासाठी सक्षम प्राधिकरणाकडून (MIDC/महानगरपालिका) बांधकाम प्रारंभ प्रमाणपत्र.',
          hi: 'भवन निर्माण शुरू करने के लिए सक्षम प्राधिकरण (MIDC/नगर निगम) से निर्माण प्रारंभ प्रमाण पत्र (CC)।',
        },
      },
      {
        name: 'High Tension / Low Tension Power Sanction',
        dept: 'MSEDCL (Mahavitaran)',
        timeline: '15 Days SLA',
        type: 'Utility Clearance',
        desc: 'Sanction of electrical load, transformer installation, and sub-station connectivity.',
        docs: ['Connected Load Calculation', 'Contract Demand Application', 'Wiring Test Report'],
        brief: {
          mr: 'महावितरणकडून (MSEDCL) कारखान्यासाठी आवश्यक उच्च किंवा कमी दाबाच्या वीज पुरवठ्याची मंजुरी.',
          hi: 'महावितरण (MSEDCL) से कारखाने के लिए आवश्यक उच्च या निम्न दाब बिजली कनेक्शन की स्वीकृति।',
        },
      },
      {
        name: 'Industrial Water Supply Connection',
        dept: 'MIDC Water Works / Irrigation Dept.',
        timeline: '14 Days SLA',
        type: 'Utility Clearance',
        desc: 'Allocation of daily industrial and potable water quota.',
        docs: ['Water Balance Chart', 'Pipeline Route Map', 'Plumbing Schematic'],
        brief: {
          mr: 'औद्योगिक उत्पादनासाठी आणि पिण्यासाठी आवश्यक असणाऱ्या पाण्याचा अधिकृत पुरवठा व कोटा वाटप.',
          hi: 'औद्योगिक उत्पादन और पीने के लिए आवश्यक दैनिक जल आपूर्ति कोटा की आधिकारिक स्वीकृति।',
        },
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
        brief: {
          mr: 'कारखान्याचे उत्पादन सुरू करण्यापूर्वी प्रदूषण नियंत्रण यंत्रणांची तपासणी करून मिळणारा अंतिम संमती परवाना.',
          hi: 'कारखाने में व्यावसायिक उत्पादन शुरू करने से पहले प्रदूषण नियंत्रण उपकरणों के सत्यापन उपरांत अंतिम संचालन सम्मति।',
        },
      },
      {
        name: 'Factory License (Factories Act 1948)',
        dept: 'Directorate of Industrial Safety and Health (DISH)',
        timeline: '30 Days SLA',
        type: 'Statutory License',
        desc: 'Registration and grant of factory operating license based on worker strength and horsepower.',
        docs: ['Form No. 2 (Application)', 'Notice of Occupation (Form 3)', 'Safety Committee Minutes'],
        brief: {
          mr: 'कारखाना कायदा १९४८ अंतर्गत कामगारांची संख्या व मशीनरीनुसार मिळणारा मुख्य औद्योगिक परवाना.',
          hi: 'कारखाना अधिनियम 1948 के तहत श्रमिकों की संख्या और हॉर्सपावर के आधार पर मिलने वाला मुख्य फैक्ट्री लाइसेंस।',
        },
      },
      {
        name: 'Boiler / Pressure Vessel Registration',
        dept: 'Directorate of Steam Boilers, Maharashtra',
        timeline: '15 Days SLA',
        type: 'Equipment License',
        desc: 'Inspection and hydraulic testing certificate for steam boilers.',
        docs: ['IBR Manufacturer Certificates', 'Welder Qualification Records', 'Steam Piping Isometric'],
        brief: {
          mr: 'स्टीम बॉयलर आणि प्रेशर उपकरणांची तांत्रिक तपासणी व हायड्रॉलिक चाचणी नोंदणी प्रमाणपत्र.',
          hi: 'स्टीम बॉयलर और प्रेशर वेसल्स के तकनीकी निरीक्षण और हाइड्रोलिक परीक्षण का पंजीकरण प्रमाण पत्र।',
        },
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
        brief: {
          mr: 'उत्पादन क्षमता वाढवण्यासाठी किंवा नवीन उत्पादने सुरू करण्यासाठी प्रदूषण संमतीमध्ये सुधारणा.',
          hi: 'उत्पादन क्षमता बढ़ाने या नए उत्पादों के निर्माण के लिए पूर्व प्रदूषण सहमति में संशोधन।',
        },
      },
      {
        name: 'Factory License Amendment',
        dept: 'DISH',
        timeline: '15 Days SLA',
        type: 'License Endorsement',
        desc: 'Endorsement of additional connected horsepower or increased workforce limits.',
        docs: ['Revised Machinery Plan', 'Additional Power Sanction Letter'],
        brief: {
          mr: 'वाढीव वीज भार (HP) किंवा अधिक कामगार सामावून घेण्यासाठी फॅक्टरी लायसन्समध्ये नोंदणीकृत दुरुस्ती.',
          hi: 'अतिरिक्त विद्युत भार (HP) या अधिक कर्मचारियों को शामिल करने हेतु फैक्ट्री लाइसेंस में आधिकारिक संशोधन।',
        },
      },
    ],
  },
];

function getLocalizedApprovalType(type: string, lang: string): string {
  if (lang === 'en') return type;
  const map: Record<string, { mr: string; hi: string }> = {
    'Statutory Mandatory': { mr: 'वैधानिक अनिवार्य', hi: 'वैधानिक अनिवार्य' },
    'Environmental Clearance': { mr: 'पर्यावरण मंजुरी', hi: 'पर्यावरण मंजूरी' },
    'Safety & Layout Approval': { mr: 'सुरक्षा व लेआउट मंजुरी', hi: 'सुरक्षा एवं लेआउट स्वीकृति' },
    'Safety Clearance': { mr: 'सुरक्षा मंजुरी', hi: 'सुरक्षा मंजूरी' },
    'Industrial Land Allotment': { mr: 'औद्योगिक भूखंड वाटप', hi: 'औद्योगिक भूमि आवंटन' },
    'Building Sanction': { mr: 'इमारत बांधकाम मंजुरी', hi: 'भवन निर्माण स्वीकृति' },
    'Utility Clearance': { mr: 'पायाभूत सुविधा मंजुरी', hi: 'उपयोगिता स्वीकृति' },
    'Operating License': { mr: 'संचालन परवाना', hi: 'संचालन लाइसेंस' },
    'Statutory License': { mr: 'वैधानिक परवाना', hi: 'वैधानिक लाइसेंस' },
    'Equipment License': { mr: 'उपकरण परवाना', hi: 'उपकरण लाइसेंस' },
    'Statutory Amendment': { mr: 'वैधानिक दुरुस्ती', hi: 'वैधानिक संशोधन' },
    'License Endorsement': { mr: 'परवाना सुधारणा', hi: 'लाइसेंस पृष्ठांकन' },
  };
  return map[type]?.[lang as 'mr' | 'hi'] || type;
}

function getLocalizedApprovalDept(dept: string, lang: string): string {
  if (lang === 'en') return dept;
  const map: Record<string, { mr: string; hi: string }> = {
    'Directorate of Industries / MAITRI': { mr: 'उद्योग संचालनालय / मैत्री (MAITRI)', hi: 'उद्योग निदेशालय / मैत्री (MAITRI)' },
    'Directorate of Industries / MAITRIC': { mr: 'उद्योग संचालनालय / मैत्री (MAITRI)', hi: 'उद्योग निदेशालय / मैत्री (MAITRI)' },
    'Maharashtra Pollution Control Board': { mr: 'महाराष्ट्र प्रदूषण नियंत्रण मंडळ (MPCB)', hi: 'महाराष्ट्र प्रदूषण नियंत्रण बोर्ड (MPCB)' },
    'MPCB': { mr: 'महाराष्ट्र प्रदूषण नियंत्रण मंडळ (MPCB)', hi: 'महाराष्ट्र प्रदूषण नियंत्रण बोर्ड (MPCB)' },
    'Directorate of Industrial Safety and Health (DISH)': { mr: 'औद्योगिक सुरक्षा व आरोग्य संचालनालय (DISH)', hi: 'औद्योगिक सुरक्षा एवं स्वास्थ्य निदेशालय (DISH)' },
    'DISH': { mr: 'औद्योगिक सुरक्षा व आरोग्य संचालनालय (DISH)', hi: 'औद्योगिक सुरक्षा एवं स्वास्थ्य निदेशालय (DISH)' },
    'Maharashtra Fire Services / Local Planning Authority': { mr: 'महाराष्ट्र अग्निशमन सेवा / स्थानिक नियोजन प्राधिकरण', hi: 'महाराष्ट्र अग्निशमन सेवा / स्थानीय नियोजन प्राधिकरण' },
    'Maharashtra Industrial Development Corporation': { mr: 'महाराष्ट्र औद्योगिक विकास महामंडळ (MIDC)', hi: 'महाराष्ट्र औद्योगिक विकास निगम (MIDC)' },
    'MIDC Engineering Dept. / Municipal Corporation': { mr: 'MIDC अभियांत्रिकी विभाग / महानगरपालिका', hi: 'MIDC इंजीनियरिंग विभाग / नगर निगम' },
    'MSEDCL (Mahavitaran)': { mr: 'महाराष्ट्र राज्य विद्युत वितरण कंपनी (महावितरण)', hi: 'महाराष्ट्र राज्य विद्युत वितरण कंपनी (महावितरण)' },
    'MIDC Water Works / Irrigation Dept.': { mr: 'MIDC पाणी पुरवठा / पाटबंधारे विभाग', hi: 'MIDC जल कार्य / सिंचाई विभाग' },
    'Directorate of Steam Boilers, Maharashtra': { mr: 'बाष्पके संचालनालय, महाराष्ट्र शासन', hi: 'स्टीम बॉयलर निदेशालय, महाराष्ट्र सरकार' },
  };
  return map[dept]?.[lang as 'mr' | 'hi'] || dept;
}

function getLocalizedApprovalDesc(name: string, fallback: string, lang: string): string {
  if (lang === 'en') return fallback;
  const map: Record<string, { mr: string; hi: string }> = {
    'MAITRI Combined Application Clearance': {
      mr: 'महाराष्ट्र उद्योग, व्यापार आणि गुंतवणूक सुलभीकरण कायदा २०२३ अंतर्गत एक खिडकी अर्ज मार्गक्रमण.',
      hi: 'महाराष्ट्र उद्योग, व्यापार और निवेश सुविधा अधिनियम 2023 के तहत एकल खिड़की आवेदन रूटिंग।',
    },
    'Consent to Establish (CTE) — MPCB': {
      mr: 'प्रदूषण निर्देशांकानुसार (लाल / केशरी / हिरवा / पांढरा) जल व वायू कायद्यांतर्गत पर्यावरण मंजुरी.',
      hi: 'प्रदूषण सूचकांक (लाल / नारंगी / हरा / सफेद) के अनुसार जल एवं वायु अधिनियमों के तहत पर्यावरण मंजूरी।',
    },
    'Factory Building Plan Approval': {
      mr: 'महाराष्ट्र कारखाना नियम १९६३ च्या नियम ३ अंतर्गत आराखडा व संरचनात्मक सुरक्षेची पडताळणी.',
      hi: 'महाराष्ट्र कारखाना नियम 1963 के नियम 3 के तहत लेआउट और संरचनात्मक सुरक्षा की जांच।',
    },
    'Fire Department Provisional NOC': {
      mr: 'इमारतींची उंची, घातक साठे आणि सेटबॅक नियमांचे प्राथमिक अग्निसुरक्षा मूल्यांकन.',
      hi: 'इमारत की ऊंचाई, खतरनाक भंडारण और सेटबैक के लिए प्रारंभिक अग्नि सुरक्षा मूल्यांकन।',
    },
    'MIDC Plot Allotment & Land Possession': {
      mr: 'एमआयडीसी क्षेत्रातील औद्योगिक भूखंडांसाठी लीज डीड नोंदणी आणि प्रत्यक्ष ताबा हस्तांतरण.',
      hi: 'एमआईडीसी क्षेत्रों में औद्योगिक भूखंडों के लिए लीज डीड निष्पादन और वास्तविक कब्जा हस्तांतरण।',
    },
    'Building Permission & Commencement Certificate (CC)': {
      mr: 'इमारत नकाशा, सेटबॅक आणि चटई क्षेत्र निर्देशांक (FSI) मंजुरी व बांधकाम प्रारंभ प्रमाणपत्र.',
      hi: 'भवन ब्लूप्रिंट, सेटबैक और एफएसआई (FSI) अनुपालन की स्वीकृति एवं निर्माण प्रारंभ प्रमाण पत्र।',
    },
    'High Tension / Low Tension Power Sanction': {
      mr: 'विद्युत भार, ट्रान्सफॉर्मर बसवणे आणि सब-स्टेशन जोडणीची अधिकृत मंजुरी.',
      hi: 'विद्युत भार, ट्रांसफार्मर स्थापना और सब-स्टेशन कनेक्टिविटी की स्वीकृति।',
    },
    'Industrial Water Supply Connection': {
      mr: 'दैनिक औद्योगिक व पिण्याच्या पाण्याच्या कोट्याचे अधिकृत वाटप व जोडणी.',
      hi: 'दैनिक औद्योगिक और पीने के पानी के कोटे का आधिकारिक आवंटन और कनेक्शन।',
    },
    'Consent to Operate (CTO) — MPCB': {
      mr: 'प्रदूषण नियंत्रण यंत्रणांच्या तपासणीनंतर व्यावसायिक उत्पादनासाठी अंतिम संचालन संमती.',
      hi: 'प्रदूषण नियंत्रण प्रणालियों के सत्यापन के बाद व्यावसायिक उत्पादन हेतु अंतिम संचालन सहमति।',
    },
    'Factory License (Factories Act 1948)': {
      mr: 'कामगारांची संख्या व अश्वशक्तीच्या (HP) आधारे कारखाना नोंदणी व संचालन परवाना.',
      hi: 'कर्मचारी संख्या और हॉर्सपावर के आधार पर फैक्ट्री पंजीकरण और संचालन लाइसेंस।',
    },
    'Boiler / Pressure Vessel Registration': {
      mr: 'स्टीम बॉयलर्सची तांत्रिक तपासणी आणि हायड्रॉलिक चाचणी प्रमाणपत्र.',
      hi: 'स्टीम बॉयलरों का तकनीकी निरीक्षण और हाइड्रोलिक परीक्षण प्रमाण पत्र।',
    },
    'Consent Amendment / Expansion Consent': {
      mr: 'वाढीव उत्पादन क्षमतेसाठी प्रदूषण उत्सर्जन कोट्याची सुधारित संमती.',
      hi: 'बढ़ी हुई उत्पादन क्षमता के लिए प्रदूषण उत्सर्जन कोटे का संशोधित अनुमोदन।',
    },
    'Factory License Amendment': {
      mr: 'अतिरिक्त वीज भार (HP) किंवा अधिक कामगार संख्या समाविष्ट करण्यासाठी परवान्यात दुरुस्ती.',
      hi: 'अतिरिक्त विद्युत भार (HP) या अधिक कर्मचारियों को शामिल करने हेतु लाइसेंस में संशोधन।',
    },
  };
  return map[name]?.[lang as 'mr' | 'hi'] || fallback;
}

function getLocalizedApprovalDoc(doc: string, lang: string): string {
  if (lang === 'en') return doc;
  const map: Record<string, { mr: string; hi: string }> = {
    'Project Report (DPR)': { mr: 'प्रकल्प अहवाल (DPR)', hi: 'परियोजना रिपोर्ट (DPR)' },
    'Land Document / MIDC Allotment': { mr: 'जमीन कागदपत्र / MIDC वाटप', hi: 'भूमि दस्तावेज / MIDC आवंटन' },
    'PAN / Incorporation Certificate': { mr: 'पॅन / नोंदणी प्रमाणपत्र', hi: 'पैन / निगमन प्रमाण पत्र' },
    'Environmental Management Plan': { mr: 'पर्यावरण व्यवस्थापन योजना (EMP)', hi: 'पर्यावरण प्रबंधन योजना (EMP)' },
    'Manufacturing Flow Chart': { mr: 'उत्पादन प्रक्रिया तक्ता', hi: 'विनिर्माण प्रवाह चार्ट' },
    'Effluent Treatment Plant Design': { mr: 'सांडपाणी प्रक्रिया डिझाईन (ETP)', hi: 'अपशिष्ट उपचार संयंत्र डिजाइन (ETP)' },
    'Structural Drawings': { mr: 'स्ट्रक्चरल नकाशे', hi: 'संरचनात्मक चित्र' },
    'Machinery Layout Plan': { mr: 'मशिनरी मांडणी नकाशा', hi: 'मशीनरी लेआउट योजना' },
    'Ventilation & Fire Egress Plan': { mr: 'हवा खेळती राहणे व अग्निसुरक्षा मार्ग', hi: 'वेंटिलेशन एवं अग्नि निकास योजना' },
    'Site Fire Hydrant Map': { mr: 'साइट फायर हायड्रंट नकाशा', hi: 'साइट फायर हाइड्रेंट मैप' },
    'Architectural Layout': { mr: 'वास्तुशिल्प आराखडा', hi: 'वास्तुशिल्प लेआउट' },
    'Hazardous Materials Storage Plan': { mr: 'घातक साहित्य साठा योजना', hi: 'खतरनाक सामग्री भंडारण योजना' },
    'Letter of Intent (LoI)': { mr: 'इरादा पत्र (LoI)', hi: 'आशय पत्र (LoI)' },
    'Initial Premium Payment Receipt': { mr: 'प्राथमिक प्रीमियम पावती', hi: 'प्रारंभिक प्रीमियम रसीद' },
    'Board Resolution': { mr: 'संचालक मंडळ ठराव', hi: 'बोर्ड संकल्प' },
    'Soil Testing Report': { mr: 'माती परीक्षण अहवाल', hi: 'मृदा परीक्षण रिपोर्ट' },
    'Structural Engineer Undertaking': { mr: 'स्ट्रक्चरल इंजिनिअर हमीपत्र', hi: 'संरचनात्मक इंजीनियर वचनबद्धता' },
    'Approved Master Layout': { mr: 'मंजूर मास्टर लेआउट', hi: 'स्वीकृत मास्टर लेआउट' },
    'Connected Load Calculation': { mr: 'जोडलेला वीज भार गणना', hi: 'कनेक्टेड लोड गणना' },
    'Contract Demand Application': { mr: 'करार मागणी अर्ज', hi: 'अनुबंध मांग आवेदन' },
    'Wiring Test Report': { mr: 'वायरिंग चाचणी अहवाल', hi: 'वायरिंग परीक्षण रिपोर्ट' },
    'Water Balance Chart': { mr: 'पाणी वापर संतुलन तक्ता', hi: 'जल संतुलन चार्ट' },
    'Pipeline Route Map': { mr: 'पाइपलाइन मार्ग नकाशा', hi: 'पाइपलाइन मार्ग मानचित्र' },
    'Plumbing Schematic': { mr: 'प्लंबिंग रेखाचित्र', hi: 'प्लंबिंग योजना' },
    'Capital Investment Certificate (CA)': { mr: 'भांडवली गुंतवणूक प्रमाणपत्र (CA)', hi: 'पूंजी निवेश प्रमाण पत्र (CA)' },
    'ETP Commissioning Report': { mr: 'ETP कार्यान्वित अहवाल', hi: 'ETP कमीशनिंग रिपोर्ट' },
    'CTE Compliance Report': { mr: 'CTE अनुपालन अहवाल', hi: 'CTE अनुपालन रिपोर्ट' },
    'Form No. 2 (Application)': { mr: 'फॉर्म क्र. २ (अर्ज)', hi: 'फॉर्म संख्या 2 (आवेदन)' },
    'Notice of Occupation (Form 3)': { mr: 'ताबा सूचना (फॉर्म क्र. ३)', hi: 'अधिभोग सूचना (फॉर्म 3)' },
    'Safety Committee Minutes': { mr: 'सुरक्षा समिती इतिवृत्त', hi: 'सुरक्षा समिति कार्यवृत्त' },
    'IBR Manufacturer Certificates': { mr: 'IBR निर्माता प्रमाणपत्रे', hi: 'IBR निर्माता प्रमाण पत्र' },
    'Welder Qualification Records': { mr: 'वेल्डर पात्रता अभिलेख', hi: 'वेल्डर योग्यता रिकॉर्ड' },
    'Steam Piping Isometric': { mr: 'स्टीम पाइपिंग आयसोमेट्रिक', hi: 'स्टीम पाइपिंग आइसोमेट्रिक' },
    'Expansion DPR': { mr: 'विस्तार प्रकल्प अहवाल (DPR)', hi: 'विस्तार परियोजना रिपोर्ट (DPR)' },
    'Incremental Pollution Load Chart': { mr: 'अतिरिक्त प्रदूषण भार तक्ता', hi: 'वृद्धिशील प्रदूषण भार चार्ट' },
    'Raw Material Balance': { mr: 'कच्चा माल संतुलन तक्ता', hi: 'कच्चा माल संतुलन' },
    'Revised Machinery Plan': { mr: 'सुधारित मशिनरी नकाशा', hi: 'संशोधित मशीनरी योजना' },
    'Additional Power Sanction Letter': { mr: 'अतिरिक्त वीज मंजुरी पत्र', hi: 'अतिरिक्त विद्युत स्वीकृति पत्र' },
  };
  return map[doc]?.[lang as 'mr' | 'hi'] || doc;
}

export default function ApprovalsPage() {
  const { t, lang } = useLanguage();
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
              <Link href="/" className="hover:text-blue-600">{t('nav.dashboard', 'Dashboard')}</Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">{t('nav.approvals', 'Approvals & Compliance')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('appr.title', 'Statutory Approvals & Clearances Catalogue')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('appr.subtitle', 'Comprehensive single-window statutory approval pathways codified under the Maharashtra MAITRI Act 2023.')}
            </p>
          </div>

          <Link
            href="/assess"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0"
          >
            {t('appr.assess_btn', 'Assess My Project Approvals →')}
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
                {stg === 'All' ? (lang === 'mr' ? 'सर्व' : lang === 'hi' ? 'सभी' : 'All') : t('stage.' + stg, stg)}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder={t('appr.search_ph', 'Search clearances, depts (e.g. MPCB, DISH)…')}
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
                      <h2 className="font-extrabold text-slate-900 text-sm">{t('stage.' + group.stage, group.stage)} {t('appr.stage_word', 'Stage')}</h2>
                      <p className="text-[11px] text-slate-500">
                        {group.stage === 'Pre-establishment'
                          ? t('appr.pre_est_desc', group.description)
                          : group.stage === 'Construction'
                          ? t('appr.const_desc', group.description)
                          : group.stage === 'Operational'
                          ? t('appr.op_desc', group.description)
                          : t('appr.exp_desc', group.description)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                    {items.length} {t('res.clearances_tab', 'Clearances')}
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  {items.map((it, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                            <h3 className="font-bold text-slate-900 text-sm">{it.name}</h3>
                          </div>
                          {lang !== 'en' && it.brief && (
                            <div className="mt-1.5 flex items-start gap-1.5 text-xs text-blue-800 bg-blue-50/90 border border-blue-200/70 rounded-lg px-2.5 py-1">
                              <span className="shrink-0 text-sm">💡</span>
                              <span className="font-medium leading-relaxed">{it.brief[lang as 'mr' | 'hi']}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <span>📜 {t('appr.rts_guarantee', 'MAITRI RTS Guarantee')}:</span>
                            <span>{it.timeline.replace('Days SLA', lang === 'mr' ? 'दिवस SLA' : lang === 'hi' ? 'दिन SLA' : 'Days SLA')}</span>
                          </span>
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">
                            {getLocalizedApprovalType(it.type, lang)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 mb-1 font-medium">
                        {t('appr.dept_label', 'Competent Department:')} <span className="text-slate-800 font-semibold">{getLocalizedApprovalDept(it.dept, lang)}</span>
                      </p>

                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                        {getLocalizedApprovalDesc(it.name, it.desc, lang)}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-bold text-slate-500">{t('appr.key_submissions', 'Key Submissions:')}</span>
                        {it.docs.map((d, dIdx) => (
                          <span key={dIdx} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                            {getLocalizedApprovalDoc(d, lang)}
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
