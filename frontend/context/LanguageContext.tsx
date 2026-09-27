'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'mr' | 'hi';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const TRANSLATIONS: Record<string, Record<Language, string>> = {
  // Navigation
  'nav.dashboard': { en: 'Dashboard', mr: 'डॅशबोर्ड', hi: 'डैशबोर्ड' },
  'nav.assess': { en: 'Project Assessment', mr: 'प्रकल्प मूल्यमापन', hi: 'परियोजना मूल्यांकन' },
  'nav.results': { en: 'Assessment Results', mr: 'मूल्यमापन निकाल', hi: 'मूल्यांकन परिणाम' },
  'nav.approvals': { en: 'Approvals & Compliance', mr: 'मंजुऱ्या आणि अनुपालन', hi: 'स्वीकृतियां और अनुपालन' },
  'nav.incentives': { en: 'Incentives & Schemes', mr: 'प्रोत्साहने आणि योजना', hi: 'प्रोत्साहन और योजनाएं' },
  'nav.documents': { en: 'Documents', mr: 'कागदपत्रे', hi: 'दस्तावेज़' },
  'nav.forms': { en: 'Forms Repository', mr: 'अर्ज व फॉर्म भांडार', hi: 'फॉर्म भंडार' },
  'nav.applications': { en: 'Applications', mr: 'माझे अर्ज', hi: 'आवेदन पत्र' },
  'nav.knowledge': { en: 'Govt. Knowledge', mr: 'शासकीय ज्ञानकोश', hi: 'सरकारी ज्ञानकोश' },
  'nav.signout': { en: 'Sign out', mr: 'बाहेर पडा (Sign out)', hi: 'साइन आउट (Sign out)' },

  // Header & Branding
  'gov.name': { en: 'Government of Maharashtra', mr: 'महाराष्ट्र शासन', hi: 'महाराष्ट्र सरकार' },
  'portal.name': { en: 'Unified Industrial Approval System', mr: 'एकात्मिक औद्योगिक मंजुरी प्रणाली', hi: 'एकीकृत औद्योगिक स्वीकृति प्रणाली' },
  'portal.subtitle': {
    en: 'Government of Maharashtra Official Industrial Single Window Portal',
    mr: 'महाराष्ट्र शासन — उद्योग संचालनालय अधिकृत एक खिडकी पोर्टल',
    hi: 'महाराष्ट्र सरकार — उद्योग निदेशालय आधिकारिक एकल खिड़की पोर्टल',
  },
  'maitri.gateway': { en: 'MAITRI Gateway Active', mr: 'मैत्री गेटवे सक्रिय', hi: 'मैत्री गेटवे सक्रिय' },
  'maitri.single_window': { en: 'MAITRI Single Window', mr: 'मैत्री एक खिडकी', hi: 'मैत्री एकल खिड़की' },
  'try.demo': { en: 'Try Demo Project', mr: 'डेमो प्रकल्प पहा', hi: 'डेमो प्रोजेक्ट देखें' },
  'active.report': { en: 'Active Report', mr: 'सक्रिय अहवाल', hi: 'सक्रिय रिपोर्ट' },
  'badge.core': { en: 'Core', mr: 'Core', hi: 'Core' },
  'nav.navigation': { en: 'Navigation', mr: 'नेव्हिगेशन', hi: 'नेविगेशन' },

  // Dashboard Home
  'dash.hero_badge': { en: 'Maharashtra Single Window Portal', mr: 'महाराष्ट्र एक खिडकी पोर्टल', hi: 'महाराष्ट्र एकल खिड़की पोर्टल' },
  'dash.hero_title': { en: 'Industrial Clearance Engine', mr: 'औद्योगिक मंजुरी इंजिन', hi: 'औद्योगिक स्वीकृति इंजन' },
  'dash.hero_sub': { en: 'Instant statutory approvals identification, department routing, and state subsidy calculations.', mr: 'त्वरित वैधानिक मंजुरी ओळख, विभाग मार्गदर्शन आणि राज्य अनुदान गणना.', hi: 'त्वरित वैधानिक स्वीकृति पहचान, विभाग प्रेषण और राज्य सब्सिडी गणना।' },
  'dash.new_project': { en: '+ New Project', mr: '+ नवीन प्रकल्प', hi: '+ नया प्रोजेक्ट' },
  'dash.try_demo': { en: 'Try Demo →', mr: 'डेमो पहा →', hi: 'डेमो देखें →' },
  'dash.quick_demo': { en: 'Quick Demo Profiles', mr: 'जलद डेमो प्रोफाइल', hi: 'त्वरित डेमो प्रोफ़ाइल' },
  'dash.quick_demo_sub': { en: 'Test clearances with pre-configured project templates.', mr: 'पूर्व-संयोजीत प्रकल्प टेम्पलेट्ससह मंजुऱ्या तपासा.', hi: 'पूर्व-कॉन्फ़िगर किए गए प्रोजेक्ट टेम्पलेट्स के साथ स्वीकृतियां जांचें।' },
  'dash.highway_title': { en: 'The Maharashtra Industrial Clearance Highway', mr: 'महाराष्ट्र औद्योगिक मंजुरी हायवे', hi: 'महाराष्ट्र औद्योगिक स्वीकृति हाईवे' },
  'dash.highway_sub': { en: 'End-to-end statutory clearance sequencing under MAITRI Single Window Act', mr: 'मैत्री एक खिडकी कायद्यांतर्गत संपूर्ण वैधानिक मंजुरी क्रमवारी', hi: 'मैत्री एकल खिड़की अधिनियम के तहत संपूर्ण वैधानिक स्वीकृति अनुक्रमण' },
  'dash.launch_studio': { en: 'Launch Studio', mr: 'स्टुडिओ सुरू करा', hi: 'स्टूडियो प्रारंभ करें' },
  'dash.active_profile': { en: 'Active Project Profile', mr: 'सक्रिय प्रकल्प प्रोफाइल', hi: 'सक्रिय परियोजना प्रोफ़ाइल' },
  'dash.view_report': { en: 'View Assessment Report →', mr: 'मूल्यांकन अहवाल पहा →', hi: 'मूल्यांकन रिपोर्ट देखें →' },
  'dash.no_assessment': { en: 'No Assessment Profile Evaluated Yet', mr: 'अद्याप कोणत्याही प्रकल्पाचे मूल्यमापन झालेले नाही', hi: 'अभी तक किसी भी परियोजना का मूल्यांकन नहीं हुआ है' },
  'dash.no_assess_sub': { en: 'Enter your enterprise project details or load a verified demonstration profile to evaluate statutory clearances.', mr: 'वैधानिक मंजुऱ्या तपासण्यासाठी तुमच्या उद्योगाचे तपशील प्रविष्ट करा किंवा डेमो प्रोफाइल लोड करा.', hi: 'वैधानिक स्वीकृतियों की जांच के लिए अपने उद्यम का विवरण दर्ज करें या डेमो प्रोफ़ाइल लोड करें।' },
  'dash.phase1_title': { en: 'Planning & Site', mr: 'नियोजन व जागा', hi: 'योजना और स्थल' },
  'dash.phase1_desc': { en: 'MPCB CTE consent for red/orange industry classification.', mr: 'लाल/केशरी उद्योग वर्गीकरणासाठी MPCB CTE संमती.', hi: 'लाल/नारंगी उद्योग वर्गीकरण के लिए MPCB CTE सहमति।' },
  'dash.phase2_title': { en: 'Land & Civil', mr: 'जमीन व बांधकाम', hi: 'भूमि और निर्माण' },
  'dash.phase2_desc': { en: 'MIDC land lease, water quota & building sanctions.', mr: 'MIDC जमीन लीज, पाणी कोटा व इमारत मंजुरी.', hi: 'MIDC भूमि पट्टा, जल कोटा और भवन स्वीकृति।' },
  'dash.phase3_title': { en: 'Safety & Power', mr: 'सुरक्षा व वीज', hi: 'सुरक्षा और बिजली' },
  'dash.phase3_desc': { en: 'DISH factory safety, CEIG power & Fire NOC.', mr: 'DISH कारखाना सुरक्षा, CEIG वीज व फायर NOC.', hi: 'DISH कारखाना सुरक्षा, CEIG बिजली और फायर NOC।' },
  'dash.phase4_title': { en: 'Operation & Subsidies', mr: 'कार्यरत व सवलती', hi: 'संचालन और सब्सिडी' },
  'dash.phase4_desc': { en: 'Consent to Operate (CTO) + PSI-2019 subsidies.', mr: 'उत्पादन संमती (CTO) + PSI-2019 सवलती.', hi: 'उत्पादन सहमति (CTO) + PSI-2019 सब्सिडी।' },
  'dash.req_approvals': { en: 'Required Approvals', mr: 'आवश्यक मंजुऱ्या', hi: 'आवश्यक स्वीकृतियां' },
  'dash.clearances_unit': { en: 'clearances', mr: 'मंजुऱ्या', hi: 'स्वीकृतियां' },
  'dash.state_incentives': { en: 'State Incentives', mr: 'राज्य सवलती व योजना', hi: 'राज्य प्रोत्साहन व योजनाएं' },
  'dash.schemes_unit': { en: 'schemes', mr: 'योजना', hi: 'योजनाएं' },
  'dash.req_documents': { en: 'Required Documents', mr: 'आवश्यक कागदपत्रे', hi: 'आवश्यक दस्तावेज़' },
  'dash.files_unit': { en: 'files', mr: 'कागदपत्रे', hi: 'फ़ाइलें' },
  'dash.gov_sources': { en: 'Government Sources', mr: 'शासकीय स्त्रोत संदर्भ', hi: 'सरकारी स्रोत संदर्भ' },
  'dash.citations_unit': { en: 'citations', mr: 'संदर्भ', hi: 'संदर्भ' },
  'dash.try_demo_assess': { en: 'Try Demo Assessment', mr: 'डेमो मूल्यमापन पहा', hi: 'डेमो मूल्यांकन देखें' },
  'dash.start_new_profile': { en: 'Start New Project Profile', mr: 'नवीन प्रकल्प प्रोफाइल सुरू करा', hi: 'नया प्रोजेक्ट प्रोफ़ाइल प्रारंभ करें' },
  'dash.kb_title': { en: 'Maharashtra Policy & Regulatory Knowledge Base', mr: 'महाराष्ट्र धोरण व नियामक ज्ञानकोश', hi: 'महाराष्ट्र नीति और नियामक ज्ञानकोश' },
  'dash.view_repo': { en: 'View Repository', mr: 'भांडार पहा', hi: 'भंडार देखें' },
  'dash.gov_docs': { en: 'Government Docs', mr: 'शासकीय कागदपत्रे', hi: 'सरकारी दस्तावेज़' },
  'dash.official_grs': { en: 'Official GRs, Acts & Rules', mr: 'अधिकृत शासन निर्णय, कायदे व नियम', hi: 'आधिकारिक जीआर, अधिनियम और नियम' },
  'dash.evidence_chunks': { en: 'Evidence Chunks', mr: 'पुरावा संदर्भ', hi: 'प्रमाण खंड' },
  'dash.direct_citations': { en: 'Direct page citations', mr: 'थेट पृष्ठ संदर्भ', hi: 'प्रत्यक्ष पृष्ठ संदर्भ' },
  'dash.mod_approvals': { en: 'Approvals & Statutory Clearances', mr: 'मंजुऱ्या आणि वैधानिक परवानग्या', hi: 'स्वीकृतियां और वैधानिक मंजूरी' },
  'dash.mod_approvals_sub': { en: 'MAITRI Single Window, MPCB Environmental Consent, DISH Factory Plan, and MIDC land permissions.', mr: 'मैत्री एक खिडकी, MPCB पर्यावरण संमती, DISH कारखाना आराखडा आणि MIDC जमीन परवानगी.', hi: 'मैत्री एकल खिड़की, MPCB पर्यावरण सहमति, DISH कारखाना योजना और MIDC भूमि अनुमतियां।' },
  'dash.mod_approvals_cta': { en: 'View Clearance Catalogue', mr: 'मंजुरी यादी पहा', hi: 'स्वीकृति सूची देखें' },
  'dash.mod_incentives': { en: 'Incentives & State Schemes', mr: 'सवलती आणि राज्य योजना', hi: 'प्रोत्साहन और राज्य योजनाएं' },
  'dash.mod_incentives_sub': { en: 'Package Scheme of Incentives (PSI-2019), Textile Policy 2023-28, EV Policy 2021, and ESDM subsidies.', mr: 'प्रोत्साहन योजना (PSI-2019), वस्त्रोद्योग धोरण २०२३-२८, EV धोरण २०२१ आणि ESDM अनुदान.', hi: 'प्रोत्साहन पैकेज योजना (PSI-2019), कपड़ा नीति 2023-28, EV नीति 2021 और ESDM सब्सिडी।' },
  'dash.mod_incentives_cta': { en: 'Explore State Schemes', mr: 'राज्य योजना शोधा', hi: 'राज्य योजनाएं देखें' },
  'dash.mod_forms': { en: 'Government Forms Repository', mr: 'शासकीय फॉर्म भांडार', hi: 'सरकारी फॉर्म भंडार' },
  'dash.mod_forms_sub': { en: 'Browse 186 extracted prescribed statutory forms, undertakings, affidavits, and submission modes.', mr: '१८६ निर्धारित वैधानिक अर्ज, हमीपत्रे, प्रतिज्ञापत्रे आणि सादर करण्याच्या पद्धती पहा.', hi: '186 निर्धारित वैधानिक फॉर्म, वचन पत्र, हलफनामे और जमा करने के तरीके ब्राउज़ करें।' },
  'dash.mod_forms_cta': { en: 'Browse 186 Forms', mr: '१८६ फॉर्म पहा', hi: '186 फॉर्म देखें' },

  // General Actions & Controls
  'text.size': { en: 'Text Size:', mr: 'अक्षर आकार:', hi: 'अक्षर आकार:' },
  'skip.content': { en: 'Skip to main content', mr: 'मुख्य मजकुराकडे जा', hi: 'मुख्य सामग्री पर जाएं' },
  'fast.demo': { en: 'Fast Demonstration', mr: 'जलद प्रात्यक्षिक', hi: 'त्वरित प्रदर्शन' },
  'demo.desc': { en: 'Evaluate clearances & subsidies.', mr: 'मंजुऱ्या आणि सवलतींचे मूल्यांकन करा.', hi: 'स्वीकृतियों और सब्सिडी का मूल्यांकन करें।' },
  'launch.demo': { en: 'Launch Demo', mr: 'डेमो सुरू करा', hi: 'डेमो प्रारंभ करें' },
  'corpus.grounded': { en: 'Corpus Grounded', mr: 'आधारित माहिती', hi: 'प्रमाणित डेटा' },

  // Assessment Studio Form
  'assess.title': { en: 'Industrial Clearance Studio', mr: 'औद्योगिक मंजुरी स्टुडिओ', hi: 'औद्योगिक स्वीकृति स्टूडियो' },
  'assess.subtitle': {
    en: 'Live deterministic regulatory sequencing, department clearance identification, and state incentive mapping.',
    mr: 'थेट नियमबद्ध नियामक क्रमवारी, विभाग मंजुरी ओळख आणि राज्य प्रोत्साहन मॅपिंग.',
    hi: 'लाइव नियामक अनुक्रमण, विभाग स्वीकृति पहचान और राज्य प्रोत्साहन मैपिंग।',
  },
  'assess.section1': { en: '1. Enterprise Details', mr: '१. उद्योग तपशील', hi: '1. उद्यम विवरण' },
  'assess.section2': { en: '2. Target Industrial Sector', mr: '२. लक्ष्यित औद्योगिक क्षेत्र', hi: '2. लक्षित औद्योगिक क्षेत्र' },
  'assess.section3': { en: '3. Project Stage & Location', mr: '३. प्रकल्प टप्पा आणि ठिकाण', hi: '3. परियोजना चरण और स्थान' },
  'assess.section4': { en: '4. Capital Investment & Employment', mr: '४. भांडवली गुंतवणूक आणि रोजगार', hi: '4. पूंजीगत निवेश और रोजगार' },
  'assess.submit': { en: 'Evaluate Project Clearances & Subsidies →', mr: 'प्रकल्प मंजुऱ्या आणि सवलतींचे मूल्यमापन करा →', hi: 'परियोजना स्वीकृतियों और सब्सिडी का मूल्यांकन करें →' },
  'assess.entity_name': { en: 'Enterprise / Unit Name', mr: 'उद्योग / युनिटचे नाव', hi: 'उद्यम / इकाई का नाम' },
  'assess.entity_type': { en: 'Entity Constitution', mr: 'उद्योग प्रकार', hi: 'उद्यम संविधान' },
  'assess.pan': { en: 'Business PAN / Reg No.', mr: 'व्यवसाय पॅन / नोंदणी क्रमांक', hi: 'व्यवसाय पैन / पंजीकरण संख्या' },
  'assess.product_desc': { en: 'Product / Manufacturing Activity Description', mr: 'उत्पादन / उत्पादन क्रियाकलापाचे वर्णन', hi: 'उत्पाद / विनिर्माण गतिविधि का विवरण' },
  'assess.stage': { en: 'Project Lifecycle Stage', mr: 'प्रकल्प जीवनचक्र टप्पा', hi: 'परियोजना जीवनचक्र चरण' },
  'assess.district': { en: 'District (Maharashtra)', mr: 'जिल्हा (महाराष्ट्र)', hi: 'जिला (महाराष्ट्र)' },
  'assess.location': { en: 'Location / Land Type', mr: 'ठिकाण / जमिनीचा प्रकार', hi: 'स्थान / भूमि का प्रकार' },
  'assess.investment': { en: 'Capital Investment (₹ Cr)', mr: 'भांडवली गुंतवणूक (₹ कोटी)', hi: 'पूंजीगत निवेश (₹ करोड़)' },
  'assess.employment': { en: 'Expected Employment (Persons)', mr: 'अपेक्षित रोजगार (व्यक्ती)', hi: 'अनुमानित रोजगार (व्यक्ति)' },
  'assess.power': { en: 'Connected Power Load (kW)', mr: 'जोडलेला वीज भार (kW)', hi: 'संलग्न विद्युत भार (kW)' },

  // Entity Types
  'entity.Company': { en: 'Company (Pvt / Ltd)', mr: 'कंपनी (प्रायव्हेट / लि.)', hi: 'कंपनी (प्राइवेट / लि.)' },
  'entity.LLP': { en: 'LLP Partnership', mr: 'एलएलपी भागीदारी (LLP)', hi: 'एलएलपी साझेदारी (LLP)' },
  'entity.Proprietorship': { en: 'Proprietorship / Firm', mr: 'प्रोप्रायटरशिप / फर्म', hi: 'प्रोप्राइटरशिप / फर्म' },

  // Sectors
  'sector.Textile': { en: 'Textile & Garments', mr: 'वस्त्रोद्योग आणि तयार कपडे', hi: 'कपड़ा और परिधान' },
  'sector.EV / Automotive': { en: 'EV & Automotive', mr: 'इलेक्ट्रिक वाहने आणि ऑटोमोबाईल', hi: 'ईवी और ऑटोमोटिव' },
  'sector.Electronics': { en: 'Electronics & ESDM', mr: 'इलेक्ट्रॉनिक्स आणि ESDM', hi: 'इलेक्ट्रॉनिक्स और ईएसडीएम' },
  'sector.Chemical': { en: 'Chemical & Pharma', mr: 'रसायन आणि औषधनिर्माण', hi: 'रसायन और फार्मा' },
  'sector.Engineering': { en: 'Engineering & Heavy Machinery', mr: 'अभियांत्रिकी आणि अवजड यंत्रसामग्री', hi: 'इंजीनियरिंग और भारी मशीनरी' },
  'sector.Food Processing': { en: 'Food & Agro Processing', mr: 'अन्न व कृषी प्रक्रिया', hi: 'खाद्य एवं कृषि प्रसंस्करण' },
  'sector.IT / ITES': { en: 'IT / ITES & Data Centers', mr: 'माहिती तंत्रज्ञान / आयटीईएस', hi: 'आईटी / आईटीईएस एवं डेटा सेंटर' },
  'sector.Logistics': { en: 'Logistics & Warehousing', mr: 'लॉजिस्टिक्स आणि वखार', hi: 'लॉजिस्टिक्स और वेयरहाउसिंग' },
  'sector.Aerospace': { en: 'Aerospace & Defense', mr: 'एरोस्पेस आणि संरक्षण', hi: 'एयरोस्पेस और रक्षा' },
  'sector.Startup': { en: 'Startup & Innovation', mr: 'स्टार्टअप आणि नवोपक्रम', hi: 'स्टार्टअप और नवाचार' },
  'sector.Other': { en: 'General Manufacturing / Other', mr: 'सामान्य उत्पादन / इतर', hi: 'सामान्य विनिर्माण / अन्य' },

  // Stages
  'stage.Pre-establishment': { en: 'Pre-establishment (Planning & Clearances)', mr: 'पूर्व-स्थापना (नियोजन व मंजुऱ्या)', hi: 'स्थापना-पूर्व (योजना और स्वीकृतियां)' },
  'stage.Construction': { en: 'Construction (Civil & Erection)', mr: 'बांधकाम (नागरी व उभारणी)', hi: 'निर्माण (सिविल एवं निर्माण)' },
  'stage.Operational': { en: 'Operational (Production & Licensing)', mr: 'कार्यरत (उत्पादन व परवाना)', hi: 'संचालित (उत्पादन और लाइसेंसिंग)' },
  'stage.Expansion': { en: 'Expansion (Capacity Top-up)', mr: 'विस्तार (क्षमता वाढ)', hi: 'विस्तार (क्षमता वृद्धि)' },

  // Location Types
  'location.MIDC': { en: 'MIDC Industrial Estate', mr: 'MIDC औद्योगिक वसाहत', hi: 'एमआईडीसी औद्योगिक क्षेत्र' },
  'location.Private industrial area': { en: 'Private Industrial Area', mr: 'खाजगी औद्योगिक क्षेत्र', hi: 'निजी औद्योगिक क्षेत्र' },
  'location.Other': { en: 'Non-MIDC / Standalone Land', mr: 'बिगर-MIDC / स्वतंत्र जमीन', hi: 'गैर-एमआईडीसी / स्वतंत्र भूमि' },

  // Incentive Calculator Section
  'calc.sim_title': { en: 'Financial Incentive Simulator', mr: 'वित्तीय प्रोत्साहन सिम्युलेटर', hi: 'वित्तीय प्रोत्साहन सिम्युलेटर' },
  'calc.title': { en: 'Interactive Maharashtra Subsidy & Amortization Calculator', mr: 'परस्परसंवादी महाराष्ट्र अनुदान आणि अमॉर्टायझेशन कॅल्क्युलेटर', hi: 'इंटरएक्टिव महाराष्ट्र सब्सिडी और अमॉर्टाइजेशन कैलकुलेटर' },
  'calc.desc': {
    en: 'Calculates 10-year financial returns across PSI-2019, Textile Policy 2023, EV Policy 2021 & IT Policy 2023.',
    mr: 'PSI-2019, वस्त्रोद्योग धोरण 2023, EV धोरण 2021 आणि IT धोरण 2023 मधील 10-वर्षांचे आर्थिक परतावे मोजते.',
    hi: 'PSI-2019, कपड़ा नीति 2023, EV नीति 2021 और IT नीति 2023 में 10-वर्षीय वित्तीय रिटर्न की गणना करता है।',
  },
  'calc.est_total': { en: 'Total Estimated Benefit (10-Yr Cumulative)', mr: 'एकूण अंदाजित लाभ (10-वर्षीय एकत्रित)', hi: 'कुल अनुमानित लाभ (10-वर्षीय संचयी)' },
  'calc.params': { en: 'Project Parameters', mr: 'प्रकल्प मापदंड', hi: 'परियोजना पैरामीटर' },
  'calc.cap_inv': { en: 'Capital Investment', mr: 'भांडवली गुंतवणूक', hi: 'पूंजीगत निवेश' },
  'calc.auto_computed': { en: 'Auto-calculated by Policy Engine (15% Turnover Baseline)', mr: 'धोरण इंजिनद्वारे आपोआप गणना (१५% उलाढाल प्रमाण)', hi: 'नीति इंजन द्वारा स्वतः गणना (15% टर्नओवर मानक)' },
  'calc.dist_zone': { en: 'District / Zone Sourcing', mr: 'जिल्हा / क्षेत्र निवड', hi: 'जिला / क्षेत्र चयन' },
  'calc.sector': { en: 'Industrial Sector', mr: 'औद्योगिक क्षेत्र', hi: 'औद्योगिक क्षेत्र' },
  'calc.est_sgst': { en: 'Est. Annual SGST Benchmark', mr: 'अंदाजित वार्षिक SGST प्रमाणक', hi: 'अनुमानित वार्षिक SGST मानक' },
  'calc.power': { en: 'Connected Power Load (kW)', mr: 'जोडलेला वीज भार (kW)', hi: 'संलग्न विद्युत भार (kW)' },
  'calc.msme_status': { en: 'MSME Enterprise Status', mr: 'MSME उद्योग दर्जा', hi: 'MSME उद्यम स्थिति' },
  'calc.msme_sub': { en: 'Qualifies for 5% Interest Subvention', mr: '५% व्याज अनुदानासाठी पात्र', hi: '5% ब्याज अनुदान के लिए पात्र' },
  'calc.ips_sgst': { en: 'IPS / SGST Reimbursement', mr: 'IPS / SGST परतावा', hi: 'IPS / SGST प्रतिपूर्ति' },
  'calc.cap_grant': { en: 'Direct Capital Grant', mr: 'प्रत्यक्ष भांडवली अनुदान', hi: 'प्रत्यक्ष पूंजीगत अनुदान' },
  'calc.power_aid': { en: 'Power Tariff & Duty Aid', mr: 'वीज दर आणि शुल्क सवलत', hi: 'बिजली दर और शुल्क सहायता' },
  'calc.int_sub': { en: 'Interest Subvention', mr: 'व्याज अनुदान', hi: 'ब्याज अनुदान' },
  'calc.stamp_title': { en: '100% Stamp Duty Exemption Included', mr: '१००% मुद्रांक शुल्क माफी समाविष्ट', hi: '100% स्टाम्प शुल्क छूट शामिल' },
  'calc.stamp_desc': { en: 'Waiver on land lease deeds, mortgage execution & bank financing.', mr: 'जमीन लीज डीड, तारण आणि बँक वित्तपुरवठ्यावर पूर्ण माफी.', hi: 'भूमि लीज डीड, बंधक और बैंक वित्तपोषण पर छूट।' },
  'calc.schedule_title': { en: 'Year-by-Year Incentive Amortization Schedule', mr: 'वर्षनिहाय प्रोत्साहन अमॉर्टायझेशन वेळापत्रक', hi: 'वर्ष-दर-वर्ष प्रोत्साहन अमॉर्टाइजेशन अनुसूची' },

  // Approvals & Compliance Page
  'appr.title': { en: 'Statutory Approvals & Clearances Catalogue', mr: 'वैधानिक मंजुऱ्या आणि परवानग्या नोंदवही', hi: 'वैधानिक स्वीकृतियां और मंजूरी कैटलॉग' },
  'appr.subtitle': {
    en: 'Comprehensive single-window statutory approval pathways codified under the Maharashtra MAITRI Act 2023.',
    mr: 'महाराष्ट्र मैत्री कायदा २०२३ अंतर्गत संहिताबद्ध सर्व वैधानिक मंजुरी मार्ग.',
    hi: 'महाराष्ट्र मैत्री अधिनियम २०२३ के तहत संहिताबद्ध सभी वैधानिक मंजूरी मार्ग।',
  },
  'appr.assess_btn': { en: 'Assess My Project Approvals →', mr: 'प्रकल्प मंजुऱ्या तपासा →', hi: 'परियोजना स्वीकृतियां जांचें →' },
  'appr.search_ph': { en: 'Search clearances, depts (e.g. MPCB, DISH)…', mr: 'परवानग्या, विभाग शोधा (उदा. MPCB, DISH)…', hi: 'स्वीकृतियां, विभाग खोजें (जैसे MPCB, DISH)…' },
  'appr.rts_guarantee': { en: 'MAITRI RTS Guarantee', mr: 'मैत्री सेवा हक्क हमी', hi: 'मैत्री सेवा अधिकार गारंटी' },
  'appr.stage_word': { en: 'Stage', mr: 'टप्पा', hi: 'चरण' },
  'appr.dept_label': { en: 'Competent Department:', mr: 'सक्षम विभाग:', hi: 'सक्षम विभाग:' },
  'appr.key_submissions': { en: 'Key Submissions:', mr: 'महत्त्वाची कागदपत्रे:', hi: 'प्रमुख दस्तावेज:' },

  // Incentives Page Section
  'inc.flagship': { en: 'Flagship Industrial Policies', mr: 'प्रमुख औद्योगिक धोरणे', hi: 'प्रमुख औद्योगिक नीतियां' },
  'inc.codified_rules': { en: 'Codified Canonical Policy Rules', mr: 'संहिताबद्ध नियम व निकष', hi: 'संहिताबद्ध आधिकारिक नीति नियम' },
  'inc.assess_btn': { en: 'Assess My Scheme Eligibility →', mr: 'माझ्या योजनेची पात्रता तपासा →', hi: 'मेरी योजना पात्रता जांचें →' },
  'inc.title': { en: 'Maharashtra State Industrial Schemes & Subsidies', mr: 'महाराष्ट्र राज्य औद्योगिक योजना आणि सवलती', hi: 'महाराष्ट्र राज्य औद्योगिक योजनाएं और सब्सिडी' },
  'inc.subtitle': { en: 'Explore 1,279 codified canonical rules for subsidies, capital grants, and tariff exemptions.', mr: 'अनुदान, भांडवली सहाय्य आणि वीज सवलतींसाठी १,२७९ संहिताबद्ध नियम शोधा.', hi: 'सब्सिडी, पूंजीगत अनुदान और शुल्क छूट के लिए 1,279 संहिताबद्ध नियम देखें।' },
  'inc.codified_sub': { en: 'Structured eligibility criteria from official Maharashtra Government Gazettes', mr: 'अधिकृत शासकीय राजपत्रांमधून संकलित केलेले पात्रता निकष', hi: 'आधिकारिक सरकारी राजपत्रों से संकलित पात्रता मानदंड' },
  'inc.loading': { en: 'Loading policy rules from database…', mr: 'डेटाबेसधून धोरण नियम लोड होत आहेत…', hi: 'डेटाबेस से नीति नियम लोड हो रहे हैं…' },
  'inc.no_rules': { en: 'No rules found for this sector filter.', mr: 'या क्षेत्रासाठी कोणतेही नियम सापडले नाहीत.', hi: 'इस क्षेत्र के लिए कोई नियम नहीं मिला।' },
  'inc.eligibility_criteria': { en: 'Eligibility Criteria:', mr: 'पात्रता निकष:', hi: 'पात्रता मानदंड:' },

  // Assess Page Right Column & Live Dossier
  'assess.live_dossier': { en: 'Live Dossier', mr: 'थेट अहवाल (Live Dossier)', hi: 'लाइव डोजियर (Live Dossier)' },
  'assess.realtime_sync': { en: 'REAL-TIME SYNC', mr: 'थेट समक्रमित', hi: 'रियल-टाइम सिंक' },
  'assess.enterprise': { en: 'Enterprise', mr: 'उद्योग / संस्था', hi: 'उद्यम / संस्था' },
  'assess.location_zone': { en: 'Location & Zone', mr: 'ठिकाण आणि क्षेत्र', hi: 'स्थान और क्षेत्र' },
  'assess.statutory_slabs': { en: 'Statutory Slabs', mr: 'वैधानिक वर्गवारी', hi: 'वैधानिक स्लैब' },
  'assess.capital': { en: 'Capital', mr: 'भांडवल', hi: 'पूंजी' },
  'assess.evaluating': { en: 'Evaluating Rules…', mr: 'नियमांचे मूल्यमापन होत आहे…', hi: 'नियमों का मूल्यांकन हो रहा है…' },
  'assess.deterministic_engine': { en: 'Deterministic Rules Engine', mr: 'निश्चित नियम इंजिन', hi: 'निश्चित नियम इंजन' },
  'assess.authoritative_citations': { en: '✓ Authoritative Citations', mr: '✓ अधिकृत संदर्भ', hi: '✓ आधिकारिक संदर्भ' },

  // Results Dossier Page
  'res.clearance_report': { en: 'Industrial Clearance Dossier', mr: 'औद्योगिक मंजुरी अहवाल (Dossier)', hi: 'औद्योगिक स्वीकृति डोजियर' },
  'res.export_pdf': { en: 'Export PDF Dossier', mr: 'PDF अहवाल डाउनलोड करा', hi: 'PDF डोजियर डाउनलोड करें' },
  'res.edit_profile': { en: '← Edit Profile', mr: '← प्रोफाइल संपादित करा', hi: '← प्रोफाइल संपादित करें' },
  'res.gazette_ver': { en: '✓ Official Gazette Verified', mr: '✓ अधिकृत राजपत्र सत्यापित', hi: '✓ आधिकारिक राजपत्र सत्यापित' },
  'res.scan_qr': { en: 'Scan QR for Live Verification', mr: 'थेट पडताळणीसाठी QR कोड स्कॅन करा', hi: 'लाइव सत्यापन के लिए क्यूआर कोड स्कैन करें' },
  'res.eval_profile': { en: 'Evaluated Profile', mr: 'मूल्यांकन केलेली प्रोफाइल', hi: 'मूल्यांकन प्रोफ़ाइल' },
  'res.clearances_tab': { en: 'Clearances', mr: 'मंजुऱ्या', hi: 'स्वीकृतियां' },
  'res.incentives_tab': { en: 'Incentive Schemes', mr: 'प्रोत्साहन योजना', hi: 'प्रोत्साहन योजनाएं' },
  'res.documents_tab': { en: 'Documents', mr: 'कागदपत्रे', hi: 'दस्तावेज़' },
  'res.forms_tab': { en: 'Forms', mr: 'फॉर्म', hi: 'फॉर्म' },
  'res.evidence_tab': { en: 'Policy Citations', mr: 'राजपत्र संदर्भ', hi: 'राजपत्र संदर्भ' },

  // Documents Page
  'docs.title': { en: 'Standard Statutory Documents & Verification Checklist', mr: 'मानक वैधानिक कागदपत्रे आणि पडताळणी सूची', hi: 'मानक वैधानिक दस्तावेज और सत्यापन चेकलिस्ट' },
  'docs.subtitle': { en: 'Verified document requirements across Maharashtra Single Window clearance departments.', mr: 'महाराष्ट्र एक खिडकी मंजुरी विभागांमध्ये पडताळलेल्या कागदपत्रांची आवश्यकता.', hi: 'महाराष्ट्र एकल खिड़की स्वीकृति विभागों में सत्यापित दस्तावेजों की आवश्यकताएं।' },
  'docs.prep_progress': { en: 'Preparation Progress', mr: 'तयारीची प्रगती', hi: 'तैयारी की प्रगति' },
  'docs.ready_count': { en: 'Ready', mr: 'तयार', hi: 'तैयार' },
  'docs.assess_btn': { en: 'Assess For My Project →', mr: 'माझ्या प्रकल्पासाठी तपासा →', hi: 'मेरी परियोजना के लिए जांचें →' },
  'docs.issuing_auth': { en: 'Issuing / Verifying Authority:', mr: 'निर्गमित / पडताळणी प्राधिकरण:', hi: 'जारीकर्ता / सत्यापन प्राधिकारी:' },

  // Forms Page
  'forms.title': { en: 'Maharashtra Single Window Statutory Forms Repository', mr: 'महाराष्ट्र एक खिडकी वैधानिक अर्ज व फॉर्म भांडार', hi: 'महाराष्ट्र एकल खिड़की वैधानिक फॉर्म भंडार' },
  'forms.subtitle': { en: '186 extracted application forms, undertakings, annexures, and proformas from Maharashtra Government Gazettes.', mr: 'महाराष्ट्र शासनाच्या राजपत्रांमधून काढलेले १८६ अर्ज, हमीपत्रे, जोडपत्रे आणि प्रपत्रे.', hi: 'महाराष्ट्र सरकार के राजपत्रों से निकाले गए 186 आवेदन पत्र, वचन पत्र, संलग्नक और प्रपत्र।' },
  'forms.assess_btn': { en: 'Find Forms For My Project →', mr: 'माझ्या प्रकल्पासाठी फॉर्म शोधा →', hi: 'मेरी परियोजना के लिए फॉर्म खोजें →' },
  'forms.search_ph': { en: 'Search by form name, number, gazette…', mr: 'फॉर्मचे नाव, क्रमांक, राजपत्र द्वारे शोधा…', hi: 'फॉर्म का नाम, नंबर, राजपत्र द्वारा खोजें…' },
  'forms.sector_label': { en: 'Sector:', mr: 'क्षेत्र:', hi: 'क्षेत्र:' },
  'forms.extracted_title': { en: 'Extracted Government Form Requirements', mr: 'काढलेले शासकीय फॉर्म आवश्यकता', hi: 'निकाले गए सरकारी फॉर्म की आवश्यकताएं' },
  'forms.total_kb': { en: 'Total in Knowledge Base: 186 Forms', mr: 'ज्ञानकोशात एकूण: १८६ फॉर्म', hi: 'ज्ञानकोश में कुल: 186 फॉर्म' },
  'forms.loading': { en: 'Loading extracted government forms…', mr: 'शासकीय फॉर्म लोड होत आहेत…', hi: 'सरकारी फॉर्म लोड हो रहे हैं…' },
  'forms.no_forms': { en: 'No mapped form found in current knowledge base.', mr: 'सध्याच्या ज्ञानकोशात कोणताही फॉर्म सापडला नाही.', hi: 'वर्तमान ज्ञानकोश में कोई फॉर्म नहीं मिला।' },
  'forms.no_forms_sub': { en: 'Try clearing or adjusting your search filters.', mr: 'कृपया फिल्टर साफ करा किंवा समायोजित करा.', hi: 'कृपया अपने खोज फ़िल्टर साफ़ करें या समायोजित करें।' },
  'forms.statutory_num': { en: 'Statutory Form Number:', mr: 'वैधानिक अर्ज क्रमांक:', hi: 'वैधानिक फॉर्म संख्या:' },
  'forms.trigger_cond': { en: 'Trigger Condition:', mr: 'लागू होण्याची अट:', hi: 'लागू होने की शर्त:' },
  'forms.gazette_passage': { en: 'Gazette Passage:', mr: 'राजपत्र मजकूर:', hi: 'राजपत्र अंश:' },

  // Applications Page
  'appls.title': { en: 'Single Window Clearance Application Tracker', mr: 'एक खिडकी मंजुरी अर्ज ट्रॅकर', hi: 'एकल खिड़की स्वीकृति आवेदन ट्रैकर' },
  'appls.subtitle': { en: 'Live tracking and SLA monitoring for MAITRI statutory filings and departmental clearances.', mr: 'मैत्री वैधानिक अर्ज आणि विभागीय मंजुऱ्यांचे थेट ट्रॅकिंग व SLA देखरेख.', hi: 'मैत्री वैधानिक फाइलिंग और विभागीय स्वीकृतियों की लाइव ट्रैकिंग और SLA निगरानी।' },
  'appls.file_new': { en: '+ File New Application', mr: '+ नवीन अर्ज सादर करा', hi: '+ नया आवेदन दाखिल करें' },
  'appls.submitted': { en: 'Submitted:', mr: 'सादर केले:', hi: 'प्रस्तुत:' },
  'appls.sla_left': { en: 'Days SLA Left', mr: 'दिवस SLA शिल्लक', hi: 'दिन SLA शेष' },
  'appls.milestone_tracker': { en: 'Application Milestone Tracker', mr: 'अर्ज टप्पा ट्रॅकर', hi: 'आवेदन चरण ट्रैकर' },
  'appls.sla_compliance': { en: 'Government SLA Compliance:', mr: 'शासकीय SLA अनुपालन:', hi: 'सरकारी SLA अनुपालन:' },
  'appls.agency': { en: 'Handling Agency:', mr: 'संबंधित यंत्रणा:', hi: 'संबंधित एजेंसी:' },
  'appls.status_date': { en: 'Status Date:', mr: 'स्थिती तारीख:', hi: 'स्थिति तिथि:' },

  // Knowledge Base Page
  'kb.title': { en: 'Maharashtra Industrial Policy & Statutory Corpus', mr: 'महाराष्ट्र औद्योगिक धोरण आणि वैधानिक ज्ञानकोश', hi: 'महाराष्ट्र औद्योगिक नीति और वैधानिक ज्ञानकोश' },
  'kb.subtitle': { en: 'Authoritative knowledge repository comprising 478 official government gazettes, acts, GRs, and rules.', mr: '४७८ अधिकृत शासकीय राजपत्रे, कायदे, शासन निर्णय (GR) आणि नियमांचा अधिकृत संग्रह.', hi: '478 आधिकारिक सरकारी राजपत्रों, अधिनियमों, जीआर और नियमों का आधिकारिक संग्रह।' },
  'kb.assess_btn': { en: 'Run Rules Assessment →', mr: 'नियम मूल्यमापन चालवा →', hi: 'नियम मूल्यांकन चलाएं →' },
  'kb.corpus': { en: 'Document Corpus', mr: 'कागदपत्र संग्रह', hi: 'दस्तावेज़ संग्रह' },
  'kb.rules': { en: 'Canonical Rules', mr: 'अधिकृत नियम', hi: 'आधिकारिक नियम' },
  'kb.forms': { en: 'Extracted Forms', mr: 'एकत्रित केलेले फॉर्म', hi: 'एकत्रित किए गए फॉर्म' },
  'kb.chunks': { en: 'Source Chunks', mr: 'स्रोत भाग (Chunks)', hi: 'स्रोत खंड (Chunks)' },
  'kb.search_ph': { en: 'Search gazette documents by filename, department, or keyword…', mr: 'फाइल नाव, विभाग किंवा शब्दाने राजपत्रे शोधा…', hi: 'फ़ाइल नाम, विभाग या कीवर्ड द्वारा राजपत्र खोजें…' },
  'kb.inventory_title': { en: 'Official Document Inventory', mr: 'अधिकृत कागदपत्रे सूची', hi: 'आधिकारिक दस्तावेज़ इन्वेंट्री' },
  'kb.loading': { en: 'Loading document inventory from database…', mr: 'डेटाबेसधून कागदपत्रे लोड होत आहेत…', hi: 'डेटाबेस से दस्तावेज़ लोड हो रहे हैं…' },
  'kb.source_url': { en: 'Source URL ↗', mr: 'मूळ स्त्रोत लिंक ↗', hi: 'मूल स्रोत लिंक ↗' },

  // Login Page
  'login.signin': { en: 'Sign In', mr: 'लॉगिन करा', hi: 'साइन इन करें' },
  'login.sub': { en: 'Enter authorized single-window credentials', mr: 'अधिकृत एक खिडकी क्रेडेंशियल्स प्रविष्ट करा', hi: 'आधिकारिक एकल-खिड़की क्रेडेंशियल दर्ज करें' },
  'login.username': { en: 'Username', mr: 'वापरकर्ता नाव (Username)', hi: 'उपयोगकर्ता नाम (Username)' },
  'login.password': { en: 'Password', mr: 'पासवर्ड (Password)', hi: 'पासवर्ड (Password)' },
  'login.show': { en: 'Show', mr: 'दाखवा', hi: 'दिखाएं' },
  'login.hide': { en: 'Hide', mr: 'लपवा', hi: 'छिपाएं' },
  'login.access': { en: 'Access Portal →', mr: 'पोर्टलवर जा →', hi: 'पोर्टल खोलें →' },
  'login.authenticating': { en: 'Authenticating…', mr: 'प्रमाणित होत आहे…', hi: 'प्रमाणित हो रहा है…' },
  'login.autofill': { en: 'Auto-fill Credentials', mr: 'आपोआप क्रेडेंशियल्स भरा', hi: 'ऑटो-फिल क्रेडेंशियल' },

  // AI Support & Bot Widget
  'bot.trigger_title': { en: 'AI Policy Bot & Support', mr: 'AI धोरण बोट व सहाय्य', hi: 'AI नीति बॉट और सहायता' },
  'bot.trigger_sub': { en: 'Govt Helpline & Live Agent', mr: 'शासकीय हेल्पलाइन व थेट अधिकारी', hi: 'सरकारी हेल्पलाइन व लाइव एजेंट' },
  'bot.hub_title': { en: 'Maharashtra UIAS Support Hub', mr: 'महाराष्ट्र UIAS मदत केंद्र', hi: 'महाराष्ट्र UIAS सहायता केंद्र' },
  'bot.live_assist': { en: 'Live Official Assistance', mr: 'थेट अधिकृत सहाय्य', hi: 'लाइव आधिकारिक सहायता' },
  'bot.tab_ai': { en: 'AI Assistant', mr: 'AI सहाय्यक', hi: 'AI सहायक' },
  'bot.tab_live': { en: 'Live Agent', mr: 'थेट अधिकारी', hi: 'लाइव एजेंट' },
  'bot.tab_helpline': { en: 'Helplines', mr: 'हेल्पलाइन', hi: 'हेल्पलाइन' },
  'bot.welcome': { en: 'Namaskar. I am your Maharashtra UIAS Assistant. Ask me about PSI-2019, MPCB consents, Fire NOC, or MAITRI single-window clearances.', mr: 'नमस्कार. मी आपला महाराष्ट्र UIAS सहाय्यक आहे. मला PSI-2019, MPCB परवानग्या, फायर NOC किंवा मैत्री मंजुऱ्यांबद्दल विचारा.', hi: 'नमस्कार. मैं आपका महाराष्ट्र UIAS सहायक हूं। मुझसे PSI-2019, MPCB सहमति, फायर NOC या मैत्री स्वीकृतियों के बारे में पूछें।' },
  'bot.searching': { en: 'Searching Policy Gazette...', mr: 'धोरण राजपत्र शोधत आहे...', hi: 'नीति राजपत्र खोज रहा है...' },
  'bot.placeholder': { en: 'Ask about PSI-2019, MPCB, Fire NOC...', mr: 'PSI-2019, MPCB, फायर NOC बद्दल विचारा...', hi: 'PSI-2019, MPCB, फायर NOC के बारे में पूछें...' },
  'bot.send': { en: 'Send', mr: 'पाठवा', hi: 'भेजें' },
  'bot.officer_title': { en: 'MAITRI Single Window Officer', mr: 'मैत्री एक खिडकी अधिकारी', hi: 'मैत्री एकल खिड़की अधिकारी' },
  'bot.officer_desc': { en: 'Connect live with a dedicated Industries Inspector from the Directorate of Industries, Govt. of Maharashtra.', mr: 'उद्योग संचालनालय, महाराष्ट्र शासनाच्या समर्पित उद्योग निरीक्षकाशी थेट संपर्क साधा.', hi: 'उद्योग निदेशालय, महाराष्ट्र सरकार के समर्पित उद्योग निरीक्षक के साथ लाइव जुड़ें।' },
  'bot.officers_online': { en: '● 14 Officers Available Online', mr: '● १४ अधिकारी ऑनलाइन उपलब्ध', hi: '● 14 अधिकारी ऑनलाइन उपलब्ध' },
  'bot.queue_wait': { en: 'Average Queue Wait:', mr: 'सरासरी प्रतीक्षा वेळ:', hi: 'औसत प्रतीक्षा समय:' },
  'bot.select_dept': { en: 'Select Inquiry Department', mr: 'चौकशी विभाग निवडा', hi: 'पूछताछ विभाग चुनें' },
  'bot.connect_btn': { en: 'Connect to Live Officer Now →', mr: 'आत्ताच थेट अधिकाऱ्याशी जोडा →', hi: 'अभी लाइव अधिकारी से जुड़ें →' },
  'bot.helpline_title': { en: 'State Industrial Toll-Free Helpline', mr: 'राज्य औद्योगिक टोल-फ्री हेल्पलाइन', hi: 'राज्य औद्योगिक टोल-फ्री हेल्पलाइन' },
  'bot.operating_hours': { en: 'Operating Hours: Monday – Saturday (9:30 AM to 6:00 PM)', mr: 'कामकाजाची वेळ: सोमवार – शनिवार (सकाळी ९:३० ते सायंकाळी ६:००)', hi: 'कार्य समय: सोमवार - शनिवार (सुबह 9:30 से शाम 6:00 बजे तक)' },

  // Source Modal
  'modal.source_title': { en: 'View Official Government Source', mr: 'अधिकृत शासकीय स्त्रोत पहा', hi: 'आधिकारिक सरकारी स्रोत देखें' },
  'modal.extracted_text': { en: 'Extracted Text', mr: 'एकत्रित केलेला मजकूर', hi: 'निकाला गया पाठ' },
  'modal.provenance': { en: 'Authoritative Provenance', mr: 'अधिकृत विश्वसनीयता', hi: 'आधिकारिक विश्वसनीयता' },
  'modal.provenance_desc': { en: 'This text was deterministically extracted from the official government document database.', mr: 'हा मजकूर अधिकृत शासकीय कागदपत्र डेटाबेसमधून अचूकपणे गोळा केला गेला आहे.', hi: 'यह पाठ आधिकारिक सरकारी दस्तावेज़ डेटाबेस से सटीक रूप से निकाला गया है।' },

  // Results & Evaluation additional keys
  'results.persons': { en: 'persons', mr: 'व्यक्ती', hi: 'व्यक्ति' },
  'res.identified': { en: 'identified', mr: 'ओळखले गेले', hi: 'पहचाने गए' },
  'res.eval_notices': { en: 'Evaluation Notices', mr: 'मूल्यांकन सूचना', hi: 'मूल्यांकन सूचनाएं' },
  'res.statutory_approvals_title': { en: 'Statutory Approvals & Clearances', mr: 'वैधानिक मंजुऱ्या आणि परवानग्या', hi: 'वैधानिक स्वीकृतियां और मंजूरी' },
  'res.required': { en: 'Required', mr: 'आवश्यक', hi: 'आवश्यक' },
  'res.no_approvals': { en: 'No specific approvals triggered', mr: 'कोणतीही विशिष्ट मंजुरी लागू नाही', hi: 'कोई विशिष्ट स्वीकृति लागू नहीं हुई' },
  'res.no_approvals_sub': { en: 'Your profile may qualify for simplified clearance.', mr: 'तुमची प्रोफाइल सुलभ मंजुरीसाठी पात्र असू शकते.', hi: 'आपकी प्रोफ़ाइल सरलीकृत स्वीकृति के लिए पात्र हो सकती है।' },
  'res.policy_source': { en: 'Policy Source:', mr: 'धोरण स्रोत:', hi: 'नीति स्रोत:' },
  'res.incentives_title': { en: 'State Incentives & Policy Schemes', mr: 'राज्य प्रोत्साहन व योजना', hi: 'राज्य प्रोत्साहन और नीति योजनाएं' },
  'res.pathways': { en: 'Pathways', mr: 'मार्ग', hi: 'मार्ग' },
  'res.governing_policies': { en: 'Governing Policy Frameworks', mr: 'प्रशासकीय धोरण आराखडे', hi: 'प्रशासकीय नीति रूपरेखा' },
  'res.subsidies_benefits': { en: 'Subsidies & Benefits', mr: 'अनुदान व लाभ', hi: 'सब्सिडी और लाभ' },
  'res.no_incentives': { en: 'No incentive schemes identified', mr: 'कोणतीही प्रोत्साहन योजना ओळखली गेली नाही', hi: 'कोई प्रोत्साहन योजना नहीं पहचानी गई' },
  'res.no_incentives_sub': { en: 'Refine your sector/location/investment profile to unlock incentives.', mr: 'प्रोत्साहन मिळवण्यासाठी आपले क्षेत्र/स्थान/गुंतवणूक प्रोफाइल सुधारा.', hi: 'प्रोत्साहन अनलॉक करने के लिए अपने क्षेत्र/स्थान/निवेश प्रोफ़ाइल को परिष्कृत करें।' },
  'res.mandatory_docs': { en: 'Mandatory Document Checklist', mr: 'अनिवार्य कागदपत्रे पडताळणी यादी', hi: 'अनिवार्य दस्तावेज़ चेकलिस्ट' },
  'res.no_docs': { en: 'No additional documents identified.', mr: 'कोणतीही अतिरिक्त कागदपत्रे ओळखली गेली नाहीत.', hi: 'कोई अतिरिक्त दस्तावेज़ नहीं पहचाने गए।' },
  'res.statutory_filing': { en: 'Required for statutory filing', mr: 'वैधानिक अर्ज भरण्यासाठी आवश्यक', hi: 'वैधानिक फाइलिंग के लिए आवश्यक' },
  'res.prescribed_forms': { en: 'Prescribed Government Forms', mr: 'विहित शासकीय फॉर्म', hi: 'निर्धारित सरकारी फॉर्म' },
  'res.mapped': { en: 'Mapped', mr: 'जोडलेले', hi: 'मैप किए गए' },
  'res.querying_forms': { en: 'Querying form requirements…', mr: 'फॉर्म आवश्यकता तपासत आहे…', hi: 'फॉर्म आवश्यकताओं की पूछताछ की जा रही है…' },
  'res.no_forms': { en: 'No mapped forms in knowledge base', mr: 'ज्ञानकोशात कोणतेही मॅप केलेले फॉर्म नाहीत', hi: 'ज्ञानकोश में कोई मैप किया गया फॉर्म नहीं है' },
  'res.forms_routing': { en: 'Forms will be designated upon departmental routing.', mr: 'विभागीय प्रक्रियेनंतर फॉर्म निश्चित केले जातील.', hi: 'विभागीय रूटिंग के बाद फॉर्म निर्दिष्ट किए जाएंगे।' },
  'res.condition': { en: 'Condition:', mr: 'अट:', hi: 'शर्त:' },
  'res.view_all_forms': { en: 'View all', mr: 'सर्व पहा', hi: 'सभी देखें' },
  'res.forms_in_repo': { en: 'forms in Forms Repository →', mr: 'फॉर्म फॉर्म भांडारात →', hi: 'फॉर्म, फॉर्म भंडार में →' },
  'res.grounded_evidence': { en: 'Grounded Policy Evidence', mr: 'आधारित धोरण पुरावा', hi: 'आधारित नीति साक्ष्य' },
  'res.citations': { en: 'Citations', mr: 'संदर्भ', hi: 'संदर्भ' },
  'res.view_evidence': { en: 'View →', mr: 'पहा →', hi: 'देखें →' },
  'res.statutory_advisory': { en: 'Statutory Advisory Note', mr: 'वैधानिक सल्लागार सूचना', hi: 'वैधानिक सलाह नोट' },

  // Additional Document categories
  'docs.cat_corp': { en: 'Corporate & Identity Documents', mr: 'कंपनी आणि ओळख कागदपत्रे', hi: 'कंपनी और पहचान दस्तावेज' },
  'docs.cat_land': { en: 'Land & Location Clearances', mr: 'जमीन व जागा परवानग्या', hi: 'भूमि और स्थान स्वीकृतियां' },
  'docs.cat_tech': { en: 'Technical & Engineering Reports', mr: 'तांत्रिक व अभियांत्रिकी अहवाल', hi: 'तकनीकी और इंजीनियरिंग रिपोर्ट' },
  'docs.cat_env': { en: 'Environmental & Safety Undertakings', mr: 'पर्यावरण व सुरक्षा हमीपत्रे', hi: 'पर्यावरण और सुरक्षा वचन पत्र' },

  // Additional Forms keys
  'forms.mode': { en: 'Mode:', mr: 'पद्धत:', hi: 'माध्यम:' },
  'forms.confidence': { en: 'Extraction Confidence:', mr: 'निष्कर्षण विश्वासार्हता:', hi: 'निष्कर्षण सटीकता:' },

  // Additional Applications keys
  'appls.on_track': { en: 'ON TRACK', mr: 'वेळेवर (ऑन ट्रॅक)', hi: 'समय पर (ऑन ट्रैक)' },

  // Additional Knowledge Base keys
  'kb.extracted_normalized': { en: '100% Extracted & Normalized', mr: '१००% संकलित व प्रमाणित', hi: '100% संकलित और मानकीकृत' },
  'kb.deterministic_eval': { en: 'Deterministic evaluation', mr: 'निश्चित नियम मूल्यांकन', hi: 'निश्चित मूल्यांकन' },
  'kb.prescribed_statutory': { en: 'Prescribed statutory forms', mr: 'विहित वैधानिक अर्ज', hi: 'निर्धारित वैधानिक फॉर्म' },
  'kb.verbatim_refs': { en: 'Verbatim page references', mr: 'पृष्ठ संदर्भ', hi: 'पृष्ठ संदर्भ' },
  'kb.all_extracted': { en: 'Status: ALL EXTRACTED', mr: 'स्थिती: सर्व संकलित', hi: 'स्थिति: सभी संकलित' },
  'kb.no_matching': { en: 'No matching documents found.', mr: 'कोणतीही जुळणारी कागदपत्रे आढळली नाहीत.', hi: 'कोई मिलान दस्तावेज़ नहीं मिला।' },
  'kb.doc_id': { en: 'Doc ID:', mr: 'दस्तऐवज आयडी:', hi: 'दस्तावेज़ आईडी:' },
  'kb.pages': { en: 'Pages:', mr: 'पृष्ठे:', hi: 'पृष्ठ:' },
  'kb.lang': { en: 'Lang:', mr: 'भाषा:', hi: 'भाषा:' },

  // Additional Calculator keys
  'calc.years_period': { en: 'years period', mr: 'वर्षे कालावधी', hi: 'वर्ष अवधि' },
  'calc.slab': { en: 'Slab:', mr: 'वर्गवारी:', hi: 'स्लैब:' },
  'calc.sgst_limit_note': { en: 'IPS reimbursement cannot exceed gross annual SGST paid to State.', mr: 'IPS परतावा राज्याला दिलेल्या एकूण वार्षिक SGST पेक्षा जास्त असू शकत नाही.', hi: 'IPS प्रतिपूर्ति राज्य को भुगतान किए गए कुल वार्षिक SGST से अधिक नहीं हो सकती।' },
  'calc.projection_window': { en: 'Year Projection Window', mr: 'वर्ष अंदाज कालावधी', hi: 'वर्ष अनुमान अवधि' },
  'calc.th_year': { en: 'Year', mr: 'वर्ष', hi: 'वर्ष' },
  'calc.th_ips': { en: 'IPS SGST Subsidy', mr: 'IPS SGST अनुदान', hi: 'IPS SGST सब्सिडी' },
  'calc.th_capital': { en: 'Capital Grant', mr: 'भांडवली अनुदान', hi: 'पूंजीगत अनुदान' },
  'calc.th_interest': { en: 'Interest Subvention', mr: 'व्याज अनुदान', hi: 'ब्याज अनुदान' },
  'calc.th_power': { en: 'Power Duty Subsidy', mr: 'वीज शुल्क सवलत', hi: 'बिजली शुल्क सब्सिडी' },
  'calc.th_total': { en: 'Total Cash Flow', mr: 'एकूण रोख प्रवाह', hi: 'कुल नकद प्रवाह' },
  'calc.savings': { en: 'Savings', mr: 'बचत', hi: 'बचत' },
  'calc.of_capital': { en: 'of Capital Investment', mr: 'भांडवली गुंतवणुकीच्या', hi: 'पूंजीगत निवेश का' },

  // Results Empty State
  'res.no_assessment_title': { en: 'No Assessment Report Found', mr: 'कोणताही मूल्यांकन अहवाल आढळला नाही', hi: 'कोई मूल्यांकन रिपोर्ट नहीं मिली' },
  'res.no_assessment_sub': { en: 'Submit an industrial project profile or launch a demo to view your clearance dossier.', mr: 'आपला मंजुरी अहवाल पाहण्यासाठी प्रकल्प माहिती सादर करा किंवा डेमो सुरू करा.', hi: 'अपना स्वीकृति डोजियर देखने के लिए एक औद्योगिक परियोजना प्रोफ़ाइल सबमिट करें या डेमो लॉन्च करें।' },
  'res.try_textile_demo': { en: 'Try Textile Demo', mr: 'टेक्सटाईल डेमो पहा', hi: 'टेक्सटाइल डेमो देखें' },
  'res.new_assessment_btn': { en: 'New Assessment', mr: 'नवीन मूल्यमापन', hi: 'नया मूल्यांकन' },

  // Approvals Stage Descriptions
  'appr.pre_est_desc': {
    en: 'Statutory approvals, NOCs, and environmental clearances required before ground-breaking.',
    mr: 'बांधकाम सुरू करण्यापूर्वी आवश्यक वैधानिक मंजुऱ्या, ना-हरकत प्रमाणपत्रे (NOC) आणि पर्यावरण परवानग्या.',
    hi: 'भूमि पूजन/निर्माण शुरू करने से पहले आवश्यक वैधानिक स्वीकृतियां, एनओसी और पर्यावरण मंजूरी।'
  },
  'appr.const_desc': {
    en: 'Permissions for site development, structural erection, and utility connections.',
    mr: 'जागा विकास, इमारत बांधकाम आणि वीज/पाणी जोडणीसाठी आवश्यक परवानग्या.',
    hi: 'साइट विकास, संरचनात्मक निर्माण और बिजली/पानी कनेक्शन के लिए अनुमतियां।'
  },
  'appr.op_desc': {
    en: 'Statutory licenses and operating consents required before commercial production.',
    mr: 'व्यावसायिक उत्पादन सुरू करण्यापूर्वी आवश्यक वैधानिक परवाने आणि संचालन संमती.',
    hi: 'व्यावसायिक उत्पादन शुरू करने से पहले आवश्यक वैधानिक लाइसेंस और संचालन सहमति।'
  },
  'appr.exp_desc': {
    en: 'Approvals for capacity enhancement, additional land, or revised environmental clearance.',
    mr: 'उत्पादन क्षमता वाढ, अतिरिक्त जागा किंवा सुधारित पर्यावरण मंजुरीसाठी आवश्यक परवानग्या.',
    hi: 'क्षमता वृद्धि, अतिरिक्त भूमि या संशोधित पर्यावरण मंजूरी के लिए आवश्यक स्वीकृतियां।'
  },

  // Incentive Tiers
  'tier.ultra': { en: 'Ultra-Mega Project', mr: 'अल्ट्रा-मेगा प्रकल्प', hi: 'अल्ट्रा-मेगा प्रोजेक्ट' },
  'tier.ultra_badge': { en: 'Cabinet Sub-Committee Slabs', mr: 'मंत्रिमंडळ उपसमिती स्लॅब', hi: 'कैबिनेट उप-समिति स्लैब' },
  'tier.ultra_hl': {
    en: 'Customized subsidy package + 100% stamp duty exemption + 9-year SGST refund',
    mr: 'सानुकूलित अनुदान पॅकेज + १००% मुद्रांक शुल्क माफी + ९ वर्षे SGST परतावा',
    hi: 'अनुकूलित सब्सिडी पैकेज + 100% स्टाम्प शुल्क छूट + 9-वर्षीय SGST रिफंड'
  },
  'tier.micro': { en: 'Micro Enterprise (MSME)', mr: 'सूक्ष्म उद्योग (MSME)', hi: 'सूक्ष्म उद्यम (MSME)' },
  'tier.micro_badge': { en: 'MSME Micro Slabs', mr: 'MSME सूक्ष्म स्लॅब', hi: 'MSME सूक्ष्म स्लैब' },
  'tier.micro_hl': {
    en: 'District Industries Centre (DIC) seed capital assistance + fast-track single window clearance',
    mr: 'जिल्हा उद्योग केंद्र (DIC) बीज भांडवल सहाय्य + जलदगती एक खिडकी मंजुरी',
    hi: 'जिला उद्योग केंद्र (DIC) बीज पूंजी सहायता + त्वरित एकल खिड़की स्वीकृति'
  },
  'tier.small': { en: 'Small Enterprise (MSME)', mr: 'लघु उद्योग (MSME)', hi: 'लघु उद्यम (MSME)' },
  'tier.small_badge': { en: 'MSME Small Slabs', mr: 'MSME लघु स्लॅब', hi: 'MSME लघु स्लैब' },
  'tier.small_hl': {
    en: 'Interest subsidy on machinery loans + power tariff concession for 5 years',
    mr: 'यंत्रसामग्री कर्जावर व्याज अनुदान + ५ वर्षांसाठी वीज दर सवलत',
    hi: 'मशीनरी ऋण पर ब्याज सब्सिडी + 5 वर्षों के लिए बिजली शुल्क रियायत'
  },
  'tier.medium': { en: 'Medium Enterprise (MSME)', mr: 'मध्यम उद्योग (MSME)', hi: 'मध्यम उद्यम (MSME)' },
  'tier.medium_badge': { en: 'MSME Medium Slabs', mr: 'MSME मध्यम स्लॅब', hi: 'MSME मध्यम स्लैब' },
  'tier.medium_hl': {
    en: 'Capital investment subsidy + 5% interest subsidy on term loans + stamp duty exemption',
    mr: 'भांडवली गुंतवणूक अनुदान + मुदत कर्जावर ५% व्याज अनुदान + मुद्रांक शुल्क माफी',
    hi: 'पूंजी निवेश सब्सिडी + सावधि ऋण पर 5% ब्याज सब्सिडी + स्टाम्प शुल्क छूट'
  },
  'tier.large': { en: 'Large Industrial Unit', mr: 'मोठा औद्योगिक प्रकल्प', hi: 'बड़ी औद्योगिक इकाई' },
  'tier.large_badge': { en: 'PSI-2019 Slabs', mr: 'PSI-2019 स्लॅब', hi: 'PSI-2019 स्लैब' },
  'tier.large_hl': {
    en: 'Up to 60-80% SGST refund + ₹1.5/unit power tariff subsidy + 7-year electricity duty waiver',
    mr: '६०-८०% पर्यंत SGST परतावा + ₹१.५/युनिट वीज अनुदान + ७ वर्षे वीज शुल्क माफी',
    hi: '60-80% तक SGST रिफंड + ₹1.5/यूनिट बिजली सब्सिडी + 7-वर्षीय विद्युत शुल्क छूट'
  },
  'tier.mega': { en: 'Mega Project', mr: 'मेगा प्रकल्प', hi: 'मेगा प्रोजेक्ट' },
  'tier.mega_badge': { en: 'High-Power Committee', mr: 'उच्चाधिकार समिती', hi: 'उच्चाधिकार समिति' },
  'tier.mega_hl': {
    en: 'Customized PSI-2019 package + priority MIDC land allotment + electricity tariff relief',
    mr: 'सानुकूलित PSI-2019 पॅकेज + प्राधान्याने MIDC जमीन वाटप + विशेष वीज दर सवलत',
    hi: 'अनुकूलित PSI-2019 पैकेज + प्राथमिकता MIDC भूमि आवंटन + विशेष बिजली शुल्क राहत'
  },

  // District Zones
  'zone.select_district': { en: 'Select District', mr: 'जिल्हा निवडा', hi: 'जिला चुनें' },
  'zone.all_slabs': { en: 'Zone A - D+ Slabs', mr: 'झोन A - D+ स्लॅब्स', hi: 'जोन A - D+ स्लैब' },
  'zone.a_b': { en: 'Zone A / B (Developed)', mr: 'झोन A / B (विकसित)', hi: 'जोन A / B (विकसित)' },
  'zone.a_b_sub': { en: '40-50% SGST Refund · Standard Tariffs', mr: '४०-५०% SGST परतावा · मानक दर', hi: '40-50% SGST रिफंड · मानक शुल्क' },
  'zone.c_d': { en: 'Zone C / D (Developing)', mr: 'झोन C / D (विकासशील)', hi: 'जोन C / D (विकासशील)' },
  'zone.c_d_sub': { en: '60-80% SGST Refund · ₹1.5/unit Power Subsidy', mr: '६०-८०% SGST परतावा · ₹१.५/युनिट वीज अनुदान', hi: '60-80% SGST रिफंड · ₹1.5/यूनिट बिजली सब्सिडी' },
  'zone.d_plus': { en: 'Zone D+ / Tribal (Priority)', mr: 'झोन D+ / आदिवासी (प्राधान्य)', hi: 'जोन D+ / आदिवासी (प्राथमिकता)' },
  'zone.d_plus_sub': { en: 'Up to 100% SGST Refund · ₹2.0/unit Power Subsidy · 10-yr Duty Waiver', mr: '१००% पर्यंत SGST परतावा · ₹२.०/युनिट वीज अनुदान · १० वर्षे शुल्क माफी', hi: '100% तक SGST रिफंड · ₹2.0/यूनिट बिजली सब्सिडी · 10-वर्षीय शुल्क छूट' },
  'zone.d_backward': { en: 'Zone D (Backward District)', mr: 'झोन D (मागास जिल्हा)', hi: 'जोन D (पिछड़ा जिला)' },
  'zone.d_backward_sub': { en: '80% SGST Refund · ₹1.5/unit Power Subsidy · 7-yr Duty Waiver', mr: '८०% SGST परतावा · ₹१.५/युनिट वीज अनुदान · ७ वर्षे शुल्क माफी', hi: '80% SGST रिफंड · ₹1.5/यूनिट बिजली सब्सिडी · 7-वर्षीय शुल्क छूट' },

  // Investment Range Subtitles
  'rng.rupees': { en: 'Micro Scale', mr: 'अतिसूक्ष्म स्तर', hi: 'अति-सूक्ष्म पैमाना' },
  'rng.thousands': { en: 'Small Scale', mr: 'लघु स्तर', hi: 'लघु पैमाना' },
  'rng.lakhs': { en: 'Lakhs Scale', mr: 'लाख स्तर', hi: 'लाख पैमाना' },
  'rng.multi_lakhs': { en: 'Tens of Lakhs', mr: 'दहा लाख स्तर', hi: 'दस लाख पैमाना' },
  'rng.crores': { en: 'Single Crores', mr: 'कोटी स्तर', hi: 'एकल करोड़' },
  'rng.multi_crores': { en: 'Tens of Crores', mr: 'दहा कोटी स्तर', hi: 'दस करोड़ पैमाना' },
  'rng.hundred_crores': { en: 'Hundreds of Crores', mr: 'शेकडो कोटी स्तर', hi: 'सैकड़ों करोड़ पैमाना' },
  'rng.ultra_crores': { en: 'Ultra-Mega Scale', mr: 'अल्ट्रा-मेगा स्तर', hi: 'अल्ट्रा-मेगा पैमाना' },

  // Employment Range Subtitles
  'emp.micro': { en: 'Micro Team', mr: 'लहान कार्यसंघ', hi: 'सूक्ष्म टीम' },
  'emp.small': { en: 'Small Unit', mr: 'लघु घटक', hi: 'लघु इकाई' },
  'emp.medium': { en: 'Medium Industry', mr: 'मध्यम उद्योग', hi: 'मध्यम उद्योग' },
  'emp.large': { en: 'Large Enterprise', mr: 'मोठा उद्योग', hi: 'बड़ा उद्यम' },
  'emp.mega': { en: 'Mega Employer', mr: 'मेगा नियोक्ता', hi: 'मेगा नियोक्ता' },

  // Step 4 & 5 Assessment Additional Keys
  'assess.interactive_slabs': { en: 'Interactive Slabs', mr: 'परस्परसंवादी स्लॅब्स', hi: 'इंटरएक्टिव स्लैब' },
  'assess.live_incentive_tier': { en: 'Live Incentive Tier', mr: 'थेट प्रोत्साहन स्तर', hi: 'लाइव प्रोत्साहन स्तर' },
  'assess.configured_scale': { en: 'Configured Scale', mr: 'कॉन्फिगर केलेले प्रमाण', hi: 'कॉन्फ़िगर किया गया पैमाना' },
  'assess.person': { en: 'Person', mr: 'व्यक्ती', hi: 'व्यक्ति' },
  'assess.persons': { en: 'Persons', mr: 'व्यक्ती', hi: 'व्यक्ति' },
  'assess.workers': { en: 'Full-Time Workers', mr: 'पूर्णवेळ कामगार', hi: 'पूर्णकालिक श्रमिक' },
  'assess.prop_cap_inv': { en: 'Proposed Capital Investment Range', mr: 'प्रस्तावित भांडवली गुंतवणूक श्रेणी', hi: 'प्रस्तावित पूंजी निवेश सीमा' },
  'assess.select_inv_scale_desc': { en: 'Select an investment range scale first, then enter your exact capital figure.', mr: 'प्रथम गुंतवणूक श्रेणी निवडा, नंतर तुमची अचूक रक्कम भरा.', hi: 'पहले निवेश सीमा चुनें, फिर अपनी सटीक पूंजी दर्ज करें।' },
  'assess.enter_exact_inv': { en: 'Enter Exact Capital Investment Amount (in Rupees)', mr: 'अचूक भांडवली गुंतवणूक रक्कम भरा (रुपयांमध्ये)', hi: 'सटीक पूंजी निवेश राशि दर्ज करें (रुपये में)' },
  'assess.selected_bounds': { en: 'Selected range category bounds:', mr: 'निवडलेल्या श्रेणी मर्यादा:', hi: 'चयनित श्रेणी की सीमाएं:' },
  'assess.rupees_inr': { en: 'Rupees (₹)', mr: 'रुपये (₹)', hi: 'रुपये (₹)' },
  'assess.scale_reading': { en: 'Formatted Scale Reading:', mr: 'स्वरूपित वाचन:', hi: 'स्वरूपित पैमाना पठन:' },
  'assess.exact': { en: 'Exact:', mr: 'अचूक:', hi: 'सटीक:' },
  'assess.exp_employment_scale': { en: 'Expected Direct Employment Scale', mr: 'अपेक्षित थेट रोजगार श्रेणी', hi: 'अनुमानित प्रत्यक्ष रोजगार पैमाना' },
  'assess.select_emp_bracket_desc': { en: 'Select an employment scale bracket first, then enter your exact manpower / headcount figure.', mr: 'प्रथम रोजगार श्रेणी निवडा, नंतर तुमची अचूक कामगार संख्या भरा.', hi: 'पहले रोजगार वर्ग चुनें, फिर अपनी सटीक कार्यबल संख्या दर्ज करें।' },
  'assess.enter_exact_workers': { en: 'Enter Exact Number of People / Workers', mr: 'अचूक कामगार / कर्मचारी संख्या भरा', hi: 'सटीक श्रमिक / कर्मचारी संख्या दर्ज करें' },
  'assess.selected_bracket': { en: 'Selected bracket range:', mr: 'निवडलेली श्रेणी मर्यादा:', hi: 'चयनित वर्ग सीमा:' },
  'assess.registered_emp': { en: 'Registered Direct Employment:', mr: 'नोंदणीकृत थेट रोजगार:', hi: 'पंजीकृत प्रत्यक्ष रोजगार:' },
  'assess.site_utilities': { en: 'Site Utilities & Additional Parameters (Optional)', mr: 'जागेच्या सुविधा आणि अतिरिक्त मापदंड (पर्यायी)', hi: 'साइट सुविधाएं और अतिरिक्त पैरामीटर (वैकल्पिक)' },
  'assess.power_req': { en: 'Power Requirement (kW)', mr: 'वीज भार आवश्यकता (kW)', hi: 'विद्युत आवश्यकता (kW)' },
  'assess.taluka_name': { en: 'Taluka Name', mr: 'तालुक्याचे नाव', hi: 'तालुका का नाम' },
  'assess.land_area': { en: 'Land Area (sq. metres)', mr: 'जमीन क्षेत्रफळ (चौ. मीटर)', hi: 'भूमि का क्षेत्रफल (वर्ग मीटर)' },
  'assess.taluka_class': { en: 'Taluka Classification', mr: 'तालुका वर्गीकरण', hi: 'तालुका वर्गीकरण' },
  'assess.select_cat': { en: '-- Select Category --', mr: '-- वर्ग निवडा --', hi: '-- श्रेणी चुनें --' },
  'assess.builtup_area': { en: 'Built-up Area (sq. ft.)', mr: 'बांधकाम क्षेत्र (चौ. फूट)', hi: 'निर्मित क्षेत्र (वर्ग फुट)' },
  'assess.for_it_logistics': { en: 'For IT/Logistics Parks', mr: 'आयटी/लॉजिस्टिक्स पार्कसाठी', hi: 'आईटी/लॉजिस्टिक्स पार्क के लिए' },
  'assess.eou': { en: '100% Export Oriented (EOU)', mr: '१००% निर्यात अभिमुख (EOU)', hi: '100% निर्यात उन्मुख (EOU)' },
  'assess.eou_sub': { en: 'Applies for specific EOU subsidies', mr: 'विशिष्ट EOU अनुदानांसाठी लागू', hi: 'विशिष्ट ईओयू सब्सिडी के लिए लागू' },
  'assess.women_led': { en: 'Women-led Enterprise', mr: 'महिला संचलित उद्योग', hi: 'महिला नेतृत्व वाला उद्यम' },
  'assess.women_led_sub': { en: 'Triggers women entrepreneur incentives', mr: 'महिला उद्योजक सवलती लागू होतात', hi: 'महिला उद्यमी प्रोत्साहन सक्रिय करता है' },
  'assess.student_led': { en: 'Student-led Startup', mr: 'विद्यार्थी संचलित स्टार्टअप', hi: 'छात्र नेतृत्व वाला स्टार्टअप' },
  'assess.student_led_sub': { en: 'For M-Hub & innovation lab benefits', mr: 'एम-हब आणि इनोव्हेशन लॅब लाभांसाठी', hi: 'एम-हब और इनोवेशन लैब लाभों के लिए' },
  'assess.reset_form': { en: 'Reset Form', mr: 'फॉर्म रीसेट करा', hi: 'फॉर्म रीसेट करें' },
  'assess.generate_report': { en: 'Assess Project & Generate Report →', mr: 'प्रकल्प मूल्यांकन करा आणि अहवाल तयार करा →', hi: 'परियोजना का मूल्यांकन करें और रिपोर्ट बनाएं →' },
  'assess.evaluating_rules': { en: 'Evaluating Statutory Rules…', mr: 'वैधानिक नियमांचे मूल्यांकन करत आहे…', hi: 'वैधानिक नियमों का मूल्यांकन किया जा रहा है…' },

  // Live Dossier Fallbacks
  'assess.untitled_project': { en: 'Untitled Industrial Project', mr: 'शीर्षक नसलेला औद्योगिक प्रकल्प', hi: 'अनाम औद्योगिक परियोजना' },
  'assess.select_sector': { en: 'Select Sector', mr: 'क्षेत्र निवडा', hi: 'क्षेत्र चुनें' },
  'assess.entity_type_placeholder': { en: 'Entity Type', mr: 'उद्योग प्रकार', hi: 'इकाई प्रकार' },
  'assess.stage_placeholder': { en: 'Stage', mr: 'टप्पा', hi: 'चरण' },
  'assess.all_maharashtra': { en: 'All Maharashtra', mr: 'संपूर्ण महाराष्ट्र', hi: 'संपूर्ण महाराष्ट्र' },
  'assess.land_type_placeholder': { en: 'Land Type', mr: 'जमीन प्रकार', hi: 'भूमि प्रकार' },
  'assess.district_label': { en: 'District', mr: 'जिल्हा', hi: 'जिला' },

  // Highway Banner & Demo Buttons
  'demo.textile': { en: 'Demo: Textile', mr: 'डेमो: वस्त्रोद्योग', hi: 'डेमो: कपड़ा' },
  'demo.ev': { en: 'Demo: EV', mr: 'डेमो: ईव्ही', hi: 'डेमो: ईवी' },
  'highway.filter_sub': { en: 'Click any stage to filter statutory sequencing:', mr: 'वैधानिक क्रमवारी तपासण्यासाठी कोणत्याही टप्प्यावर क्लिक करा:', hi: 'वैधानिक अनुक्रमण जांचने के लिए किसी भी चरण पर क्लिक करें:' },
  'highway.flow_badge': { en: 'MAITRI Single Window Flow', mr: 'मैत्री एक खिडकी प्रवाह', hi: 'मैत्री एकल खिड़की प्रवाह' },
  'stage.prefix': { en: 'STAGE', mr: 'टप्पा', hi: 'चरण' },
  'highway.phase1_sub': { en: 'MPCB Consent to Establish', mr: 'MPCB स्थापना संमती (CTE)', hi: 'MPCB स्थापना सम्मति (CTE)' },
  'highway.phase1_days': { en: '30-45 Days', mr: '३०-४५ दिवस', hi: '30-45 दिन' },
  'highway.phase2_sub': { en: 'MIDC Plot & Building Plan', mr: 'MIDC भूखंड व इमारत नकाशा', hi: 'MIDC भूखंड एवं भवन योजना' },
  'highway.phase2_days': { en: '15-30 Days', mr: '१५-३० दिवस', hi: '15-30 दिन' },
  'highway.phase3_sub': { en: 'DISH Safety & Factory Act', mr: 'DISH सुरक्षा व कारखाना कायदा', hi: 'DISH सुरक्षा एवं कारखाना अधिनियम' },
  'highway.phase3_days': { en: '15 Days', mr: '१५ दिवस', hi: '15 दिन' },
  'highway.phase4_sub': { en: 'PSI-2019 / Sector Policies', mr: 'PSI-2019 / क्षेत्र धोरणे', hi: 'PSI-2019 / क्षेत्रीय नीतियां' },
  'highway.phase4_days': { en: 'Fiscal Year', mr: 'आर्थिक वर्ष', hi: 'वित्तीय वर्ष' },
  'demo.loaded_title': { en: 'DEMO INDUSTRIAL PROJECT DATA LOADED', mr: 'डेमो औद्योगिक प्रकल्प माहिती लोड झाली', hi: 'डेमो औद्योगिक परियोजना डेटा लोड हो गया' },
  'demo.loaded_desc': { en: 'Pre-filled with verified enterprise profile parameters. Click Assess Project to generate statutory report.', mr: 'सत्यापित उद्योग प्रोफाइल पॅरामीटर्ससह भरले आहे. वैधानिक अहवाल तयार करण्यासाठी प्रकल्प मूल्यांकन करा वर क्लिक करा.', hi: 'सत्यापित उद्यम प्रोफ़ाइल मापदंडों के साथ भरा गया। वैधानिक रिपोर्ट बनाने के लिए परियोजना का मूल्यांकन करें पर क्लिक करें।' },
  'demo.clear': { en: 'Clear', mr: 'साफ करा', hi: 'साफ़ करें' },

  // Incentives Page
  'inc.target_sector': { en: 'Target Sector:', mr: 'लक्ष्यित क्षेत्र:', hi: 'लक्षित क्षेत्र:' },
  'inc.geo_scope': { en: 'Geographic Scope:', mr: 'भौगोलिक कार्यक्षेत्र:', hi: 'भौगोलिक कार्यक्षेत्र:' },
  'inc.test_demo': { en: 'Test in Demo →', mr: 'डेमो मध्ये तपासा →', hi: 'डेमो में जांचें →' },
  'inc.confidence': { en: 'Confidence', mr: 'विश्वासार्हता', hi: 'सटीकता' },
  'inc.sources': { en: 'Sources', mr: 'संदर्भ', hi: 'संदर्भ' },
  'inc.references': { en: 'references', mr: 'संदर्भ', hi: 'संदर्भ' },
  'inc.mapped_forms': { en: 'Mapped Forms', mr: 'जोडलेले फॉर्म', hi: 'मैप किए गए फॉर्म' },
  'inc.no_mapped_forms': { en: 'No mapped form in current KB', mr: 'सध्याच्या ज्ञानकोशात कोणताही फॉर्म नाही', hi: 'वर्तमान ज्ञानकोश में कोई मैप किया गया फॉर्म नहीं' },

  // Documents Requirement Badges
  'docs.mandatory': { en: 'Mandatory', mr: 'अनिवार्य', hi: 'अनिवार्य' },
  'docs.mand_companies': { en: 'Mandatory for Companies', mr: 'कंपन्यांसाठी अनिवार्य', hi: 'कंपनियों के लिए अनिवार्य' },
  'docs.mand_llp': { en: 'Mandatory for LLPs/Partnerships', mr: 'LLP/भागीदारीसाठी अनिवार्य', hi: 'LLP/साझेदारी के लिए अनिवार्य' },
  'docs.mand_midc': { en: 'Mandatory for MIDC Plots', mr: 'MIDC भूखंडांसाठी अनिवार्य', hi: 'MIDC भूखंडों के लिए अनिवार्य' },
  'docs.mand_private': { en: 'Mandatory for Private Land', mr: 'खाजगी जमिनीसाठी अनिवार्य', hi: 'निजी भूमि के लिए अनिवार्य' },
  'docs.mand_factories': { en: 'Mandatory for Factories', mr: 'कारखान्यांसाठी अनिवार्य', hi: 'कारखानों के लिए अनिवार्य' },
  'docs.mand_psi': { en: 'Mandatory for PSI-2019', mr: 'PSI-2019 साठी अनिवार्य', hi: 'PSI-2019 के लिए अनिवार्य' },
  'docs.mand_power': { en: 'Mandatory for Power Sanction', mr: 'वीज मंजुरीसाठी अनिवार्य', hi: 'बिजली स्वीकृति के लिए अनिवार्य' },
  'docs.mand_cte': { en: 'Mandatory for MPCB CTE', mr: 'MPCB CTE साठी अनिवार्य', hi: 'MPCB CTE के लिए अनिवार्य' },
  'docs.mand_red_orange': { en: 'Mandatory for Red/Orange Units', mr: 'लाल/केशरी युनिट्ससाठी अनिवार्य', hi: 'लाल/नारंगी इकाइयों के लिए अनिवार्य' },
  'docs.req_chemical': { en: 'Required for Chemical/Engineering Units', mr: 'केमिकल/इंजिनिअरिंगसाठी आवश्यक', hi: 'रासायनिक/इंजीनियरिंग के लिए आवश्यक' },
  'docs.req_hazard': { en: 'Required for Hazard Units', mr: 'धोकादायक उद्योगांसाठी आवश्यक', hi: 'जोखिम इकाइयों के लिए आवश्यक' },
  'docs.req_boundary': { en: 'Required for Boundary Approval', mr: 'हद्द मंजुरीसाठी आवश्यक', hi: 'सीमा स्वीकृति के लिए आवश्यक' },

  // Application Tracker Badges & Statuses
  'status.UNDER SCRUTINY': { en: 'UNDER SCRUTINY', mr: 'छाननी सुरू आहे', hi: 'जांच जारी है' },
  'status.APPROVED IN PRINCIPLE': { en: 'APPROVED IN PRINCIPLE', mr: 'तत्वतः मंजूर', hi: 'सैद्धांतिक रूप से स्वीकृत' },
  'status.COMPLETED': { en: 'COMPLETED', mr: 'पूर्ण', hi: 'पूर्ण' },
  'status.IN PROGRESS': { en: 'IN PROGRESS', mr: 'प्रगतीपथावर', hi: 'प्रगति पर' },
  'status.IN_PROGRESS': { en: 'IN PROGRESS', mr: 'प्रगतीपथावर', hi: 'प्रगति पर' },
  'status.PENDING': { en: 'PENDING', mr: 'प्रलंबित', hi: 'लंबित' },

  // Section 3 Assess Keys
  'assess.clearance_seq': { en: 'Clearance Sequencing', mr: 'मंजुरी अनुक्रम', hi: 'स्वीकृति अनुक्रमण' },
  'assess.select_district': { en: '-- Select District --', mr: '-- जिल्हा निवडा --', hi: '-- जिला चुनें --' },
  'assess.psi_zone_hint': { en: 'Determines PSI-2019 Incentive Zone (Zone A, B, C, D, D+).', mr: 'PSI-2019 प्रोत्साहन क्षेत्र निश्चित करते (Zone A, B, C, D, D+).', hi: 'PSI-2019 प्रोत्साहन क्षेत्र निर्धारित करता है (Zone A, B, C, D, D+)।' },
  'assess.product_desc_hint': { en: 'Queried against official government policy gazettes for exact evidence extraction.', mr: 'अचूक पुराव्यासाठी अधिकृत शासकीय राजपत्रांमधून पडताळणी केली जाते.', hi: 'सटीक साक्ष्य निष्कर्षण के लिए आधिकारिक सरकारी नीति राजपत्रों से जांच की जाती है।' },

  // Stage Descriptions
  'stage_desc.Pre-establishment': { en: 'Planning / site evaluation / seeking initial statutory approvals', mr: 'नियोजन / जागा मूल्यांकन / प्राथमिक वैधानिक मंजुऱ्या घेणे', hi: 'योजना / साइट मूल्यांकन / प्रारंभिक वैधानिक स्वीकृतियां प्राप्त करना' },
  'stage_desc.Construction': { en: 'Site acquired, civil works / infrastructure construction in progress', mr: 'जागा संपादित, बांधकाम / पायाभूत सुविधांचे काम सुरू', hi: 'साइट अधिग्रहित, सिविल कार्य / बुनियादी ढांचा निर्माण प्रगति पर' },
  'stage_desc.Operational': { en: 'Production commenced / factory operating', mr: 'उत्पादन सुरू झाले / कारखाना कार्यरत आहे', hi: 'उत्पादन शुरू / कारखाना चालू है' },
  'stage_desc.Expansion': { en: 'Existing operational enterprise expanding fixed capacity or line', mr: 'विद्यमान कार्यरत उद्योगाची उत्पादन क्षमता किंवा युनिट विस्तार', hi: 'मौजूदा परिचालन उद्यम की क्षमता या उत्पादन लाइन का विस्तार' },

  // Policy Sectors & Categories from DB
  'sector.Used Oil Management': { en: 'Used Oil Management', mr: 'वापरलेले तेल व्यवस्थापन', hi: 'प्रयुक्त तेल प्रबंधन' },
  'sector.General Industry': { en: 'General Industry', mr: 'सर्वसाधारण उद्योग', hi: 'सामान्य उद्योग' },
  'sector.Waste Management': { en: 'Waste Management', mr: 'कचरा व्यवस्थापन', hi: 'अपशिष्ट प्रबंधन' },
  'sector.Renewable Energy': { en: 'Renewable Energy', mr: 'अक्षय ऊर्जा', hi: 'नवीकरणीय ऊर्जा' },

  // Incentive Types
  'inc_type.Capital Subsidy': { en: 'Capital Subsidy', mr: 'भांडवली अनुदान', hi: 'पूंजीगत सब्सिडी' },
  'inc_type.Interest Subsidy': { en: 'Interest Subsidy', mr: 'व्याज अनुदान', hi: 'ब्याज सब्सिडी' },
  'inc_type.Electricity Duty Exemption': { en: 'Electricity Duty Exemption', mr: 'वीज शुल्क माफी', hi: 'विद्युत शुल्क छूट' },
  'inc_type.Power Tariff Subsidy': { en: 'Power Tariff Subsidy', mr: 'वीज दर सवलत', hi: 'बिजली दर रियायत' },
  'inc_type.Stamp Duty Exemption': { en: 'Stamp Duty Exemption', mr: 'मुद्रांक शुल्क माफी', hi: 'स्टाम्प शुल्क छूट' },
  'inc_type.SGST Refund': { en: 'SGST Refund', mr: 'SGST परतावा', hi: 'SGST प्रतिपूर्ति' },

  // Bot Widget Live Agent & Helpline Keys
  'bot.desk_status': { en: 'Desk Status:', mr: 'डेस्क स्थिती:', hi: 'डेस्क स्थिति:' },
  'bot.queue_mins': { en: '~ 2 Mins', mr: '~ २ मिनिटे', hi: '~ 2 मिनट' },
  'bot.opt_psi': { en: 'Industries & Subsidies Desk (PSI-2019)', mr: 'उद्योग व अनुदान कक्ष (PSI-2019)', hi: 'उद्योग एवं सब्सिडी डेस्क (PSI-2019)' },
  'bot.opt_mpcb': { en: 'MPCB Environmental Consents Desk', mr: 'MPCB पर्यावरण संमती कक्ष', hi: 'MPCB पर्यावरण सहमति डेस्क' },
  'bot.opt_midc': { en: 'MIDC Land Allocation Desk', mr: 'MIDC भूखंड वाटप कक्ष', hi: 'MIDC भूमि आवंटन डेस्क' },
  'bot.opt_msedcl': { en: 'MSEDCL Industrial Power Connection', mr: 'महावितरण औद्योगिक वीज पुरवठा कक्ष', hi: 'महावितरण औद्योगिक बिजली कनेक्शन डेस्क' },
  'bot.hl_maitri': { en: 'MAITRI Investor Cell', mr: 'मैत्री गुंतवणूकदार कक्ष', hi: 'मैत्री निवेशक प्रकोष्ठ' },
  'bot.hl_maitri_sub': { en: 'Direct Support for Mega Projects', mr: 'मेगा प्रकल्पांसाठी थेट सहाय्य', hi: 'मेगा परियोजनाओं के लिए प्रत्यक्ष सहायता' },
  'bot.hl_mpcb': { en: 'MPCB Environment Desk', mr: 'MPCB पर्यावरण कक्ष', hi: 'MPCB पर्यावरण डेस्क' },
  'bot.hl_mpcb_sub': { en: 'Pollution Consent Technical Aid', mr: 'प्रदूषण संमती तांत्रिक सहाय्य', hi: 'प्रदूषण सहमति तकनीकी सहायता' },
  'bot.hl_midc': { en: 'MIDC Head Office', mr: 'MIDC मुख्यालय', hi: 'MIDC मुख्यालय' },
  'bot.hl_midc_sub': { en: 'Industrial Plots & Allotment', mr: 'औद्योगिक भूखंड व वाटप', hi: 'औद्योगिक भूखंड एवं आवंटन' },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (k, d) => d || k,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('smsws_lang') as Language;
    if (saved === 'mr' || saved === 'en' || saved === 'hi') {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('smsws_lang', newLang);
  };

  const t = (key: string, defaultText?: string): string => {
    if (TRANSLATIONS[key] && TRANSLATIONS[key][lang]) {
      return TRANSLATIONS[key][lang];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
