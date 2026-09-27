'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface IncentiveCalculatorProps {
  initialInvestmentCr?: number;
  initialInvestmentInr?: number;
  initialDistrict?: string;
  initialSector?: string;
  initialIsMsme?: boolean;
  initialPowerKw?: number;
}

const DISTRICT_ZONES: Record<string, { zone: string; label: string; benefitYears: number; ipsPercent: number }> = {
  'Mumbai / Thane': { zone: 'Zone A', label: 'Zone A (Developed)', benefitYears: 7, ipsPercent: 30 },
  'Pune / Pimpri': { zone: 'Zone B', label: 'Zone B (Developing Industrial)', benefitYears: 7, ipsPercent: 40 },
  'Nashik / Chhatrapati Sambhajinagar (Aurangabad)': { zone: 'Zone C', label: 'Zone C (Developing)', benefitYears: 9, ipsPercent: 60 },
  'Nagpur / Solapur / Amravati': { zone: 'Zone D', label: 'Zone D (Underdeveloped)', benefitYears: 10, ipsPercent: 80 },
  'Nanded / Chandrapur / Gadchiroli': { zone: 'Zone D+', label: 'Zone D+ (Naxal/Backward)', benefitYears: 10, ipsPercent: 100 },
};

const SECTOR_TOPUPS: Record<string, { label: string; ipsBonus: number; capitalGrantPercent: number; powerSubsidyRate: number }> = {
  'Manufacturing (General)': { label: 'General Manufacturing (PSI-2019 Base)', ipsBonus: 0, capitalGrantPercent: 0, powerSubsidyRate: 1.0 },
  'Textile & Garments': { label: 'Textiles & Garments (Textile Policy 2023)', ipsBonus: 15, capitalGrantPercent: 25, powerSubsidyRate: 2.0 },
  'EV & Battery Manufacturing': { label: 'EV & Battery Units (EV Policy 2021)', ipsBonus: 20, capitalGrantPercent: 15, powerSubsidyRate: 1.5 },
  'IT / ITES & Data Centers': { label: 'IT / Data Centers (IT Policy 2023)', ipsBonus: 10, capitalGrantPercent: 10, powerSubsidyRate: 1.0 },
};

const PRESETS = [
  { label: '₹50K (Micro)', inr: 50_000, unit: 'K' as const },
  { label: '₹25L (MSME)', inr: 2_500_000, unit: 'Lakh' as const },
  { label: '₹5 Cr (Small)', inr: 50_000_000, unit: 'Cr' as const },
  { label: '₹25 Cr (Medium)', inr: 250_000_000, unit: 'Cr' as const },
  { label: '₹100 Cr (Large)', inr: 1_000_000_000, unit: 'Cr' as const },
  { label: '₹500 Cr (Mega)', inr: 5_000_000_000, unit: 'Cr' as const },
  { label: '₹1,000 Cr (Ultra)', inr: 10_000_000_000, unit: 'Cr' as const },
];

function getPresetLabel(item: { label: string; inr: number }, lang: string): string {
  if (lang === 'mr') {
    if (item.inr === 50_000) return '₹५० हजार (मायक्रो)';
    if (item.inr === 2_500_000) return '₹२५ लाख (MSME)';
    if (item.inr === 50_000_000) return '₹५ कोटी (लघु)';
    if (item.inr === 250_000_000) return '₹२५ कोटी (मध्यम)';
    if (item.inr === 1_000_000_000) return '₹१०० कोटी (मोठा)';
    if (item.inr === 5_000_000_000) return '₹५०० कोटी (मेगा)';
    if (item.inr === 10_000_000_000) return '₹१,००० कोटी (अल्ट्रा)';
  }
  if (lang === 'hi') {
    if (item.inr === 50_000) return '₹50 हज़ार (माइक्रो)';
    if (item.inr === 2_500_000) return '₹25 लाख (MSME)';
    if (item.inr === 50_000_000) return '₹5 करोड़ (लघु)';
    if (item.inr === 250_000_000) return '₹25 करोड़ (मध्यम)';
    if (item.inr === 1_000_000_000) return '₹100 करोड़ (बड़ा)';
    if (item.inr === 5_000_000_000) return '₹500 करोड़ (मेगा)';
    if (item.inr === 10_000_000_000) return '₹1,000 करोड़ (अल्ट्रा)';
  }
  return item.label;
}

function sliderToInr(val: number): number {
  if (val <= 0) return 0;
  if (val <= 100) {
    return Math.round(val * 10_000);
  }
  if (val <= 300) {
    return Math.round(10_00_000 + (val - 100) * 45_000);
  }
  if (val <= 600) {
    const steps = Math.round(((val - 300) / 300) * 98);
    return Math.round(1_00_00_000 + steps * 50_00_000);
  }
  if (val <= 800) {
    return Math.round(50_00_00_000 + (val - 600) * 1_00_00_000);
  }
  const steps = Math.round(((val - 800) / 200) * 150);
  return Math.round(250_00_00_000 + steps * 5_00_00_000);
}

function inrToSlider(inr: number): number {
  if (inr <= 0) return 0;
  if (inr <= 10_00_000) {
    return Math.min(100, Math.round(inr / 10_000));
  }
  if (inr <= 1_00_00_000) {
    return Math.min(300, Math.round(100 + ((inr - 10_00_000) / 90_00_000) * 200));
  }
  if (inr <= 50_00_00_000) {
    return Math.min(600, Math.round(300 + ((inr - 1_00_00_000) / 49_00_00_000) * 300));
  }
  if (inr <= 250_00_00_000) {
    return Math.min(800, Math.round(600 + ((inr - 50_00_00_000) / 200_00_00_000) * 200));
  }
  return Math.min(1000, Math.round(800 + ((inr - 250_00_00_000) / 750_00_00_000) * 200));
}

function formatRupees(amountInr: number, lang: string = 'en'): string {
  if (amountInr <= 0) return '₹0';
  if (amountInr >= 1e7) {
    const cr = amountInr / 1e7;
    const unit = lang === 'mr' ? 'कोटी' : lang === 'hi' ? 'करोड़' : 'Cr';
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} ${unit}`;
  }
  if (amountInr >= 1e5) {
    const lakh = amountInr / 1e5;
    const unit = lang === 'mr' || lang === 'hi' ? 'लाख' : 'Lakh';
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} ${unit}`;
  }
  if (amountInr >= 1e3) {
    const k = amountInr / 1e3;
    const unit = lang === 'mr' ? 'हजार' : lang === 'hi' ? 'हज़ार' : 'K';
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)} ${unit}`;
  }
  return `₹${Math.round(amountInr).toLocaleString('en-IN')}`;
}

function getLocalizedDistrictZoneOption(d: string, lang: string): string {
  if (lang === 'en') return `${d} — ${DISTRICT_ZONES[d]?.zone || ''}`;
  const map: Record<string, { mr: string; hi: string }> = {
    'Mumbai / Thane': {
      mr: 'मुंबई / ठाणे — झोन A',
      hi: 'मुंबई / ठाणे — ज़ोन A',
    },
    'Pune / Pimpri': {
      mr: 'पुणे / पिंपरी — झोन B',
      hi: 'पुणे / पिंपरी — ज़ोन B',
    },
    'Nashik / Chhatrapati Sambhajinagar (Aurangabad)': {
      mr: 'नाशिक / छत्रपती संभाजीनगर (औरंगाबाद) — झोन C',
      hi: 'नासिक / छत्रपति संभाजीनगर (औरंगाबाद) — ज़ोन C',
    },
    'Nagpur / Solapur / Amravati': {
      mr: 'नागपूर / सोलापूर / अमरावती — झोन D',
      hi: 'नागपुर / सोलापुर / अमरावती — ज़ोन D',
    },
    'Nanded / Chandrapur / Gadchiroli': {
      mr: 'नांदेड / चंद्रपूर / गडचिरोली — झोन D+',
      hi: 'नांदेड़ / चंद्रपुर / गढ़चिरौली — ज़ोन D+',
    },
  };
  return map[d]?.[lang as 'mr' | 'hi'] || `${d} — ${DISTRICT_ZONES[d]?.zone || ''}`;
}

function getLocalizedZoneLabel(label: string, lang: string): string {
  if (lang === 'en') return label;
  const map: Record<string, { mr: string; hi: string }> = {
    'Zone A (Developed)': { mr: 'झोन A (विकसित)', hi: 'ज़ोन A (विकसित)' },
    'Zone B (Developing Industrial)': { mr: 'झोन B (विकसनशील औद्योगिक)', hi: 'ज़ोन B (विकासशील औद्योगिक)' },
    'Zone C (Developing)': { mr: 'झोन C (विकसनशील)', hi: 'ज़ोन C (विकासशील)' },
    'Zone D (Underdeveloped)': { mr: 'झोन D (अविकसित/मागास)', hi: 'ज़ोन D (अविकसित/पिछड़ा)' },
    'Zone D+ (Naxal/Backward)': { mr: 'झोन D+ (अतिमागास/आदिवासी)', hi: 'ज़ोन D+ (अतिपिछड़ा/जनजातीय)' },
  };
  return map[label]?.[lang as 'mr' | 'hi'] || label;
}

function getLocalizedCalculatorSector(s: string, lang: string): string {
  if (lang === 'en') return s;
  const map: Record<string, { mr: string; hi: string }> = {
    'Manufacturing (General)': {
      mr: 'उत्पादन / विनिर्माण (सर्वसाधारण)',
      hi: 'विनिर्माण / उत्पादन (सामान्य)',
    },
    'Textile & Garments': {
      mr: 'वस्त्रोद्योग आणि तयार कपडे (Textiles & Garments)',
      hi: 'कपड़ा एवं परिधान (Textiles & Garments)',
    },
    'EV & Battery Manufacturing': {
      mr: 'ईव्ही आणि बॅटरी उत्पादन (EV & Battery)',
      hi: 'ईवी और बैटरी विनिर्माण (EV & Battery)',
    },
    'IT / ITES & Data Centers': {
      mr: 'माहिती तंत्रज्ञान आणि डेटा सेंटर्स (IT & Data Centers)',
      hi: 'आईटी / आईटीईएस एवं डेटा सेंटर (IT & Data Centers)',
    },
  };
  return map[s]?.[lang as 'mr' | 'hi'] || s;
}

export default function IncentiveCalculator({
  initialInvestmentCr,
  initialInvestmentInr,
  initialDistrict = 'Nagpur / Solapur / Amravati',
  initialSector = 'Textile & Garments',
  initialIsMsme = true,
  initialPowerKw = 500,
}: IncentiveCalculatorProps) {
  const { t, lang } = useLanguage();
  const initialInr = initialInvestmentInr ?? (initialInvestmentCr ? initialInvestmentCr * 1e7 : 250_000_000);
  const [investmentInr, setInvestmentInr] = useState<number>(initialInr);
  const [inputUnit, setInputUnit] = useState<'Cr' | 'Lakh' | 'K' | 'INR'>('Cr');
  const [directInputValue, setDirectInputValue] = useState<string>((initialInr / 1e7).toFixed(2));
  const [district, setDistrict] = useState<string>(initialDistrict);
  const [sector, setSector] = useState<string>(initialSector);
  const [isMsme, setIsMsme] = useState<boolean>(initialIsMsme);
  const [powerKw, setPowerKw] = useState<number>(initialPowerKw);

  const zoneInfo = DISTRICT_ZONES[district] || DISTRICT_ZONES['Nagpur / Solapur / Amravati'];
  const sectorInfo = SECTOR_TOPUPS[sector] || SECTOR_TOPUPS['Manufacturing (General)'];

  function syncDirectInputFromInr(inr: number, unit: 'Cr' | 'Lakh' | 'K' | 'INR') {
    if (unit === 'Cr') {
      const cr = inr / 1e7;
      setDirectInputValue(cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2));
    } else if (unit === 'Lakh') {
      const lakh = inr / 1e5;
      setDirectInputValue(lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2));
    } else if (unit === 'K') {
      const k = inr / 1e3;
      setDirectInputValue(k % 1 === 0 ? k.toFixed(0) : k.toFixed(1));
    } else {
      setDirectInputValue(Math.round(inr).toString());
    }
  }

  function handleDirectInputChange(rawVal: string) {
    setDirectInputValue(rawVal);
    const parsed = parseFloat(rawVal);
    if (isNaN(parsed) || parsed < 0) {
      setInvestmentInr(0);
      return;
    }
    let calculatedInr = 0;
    if (inputUnit === 'Cr') calculatedInr = parsed * 1e7;
    else if (inputUnit === 'Lakh') calculatedInr = parsed * 1e5;
    else if (inputUnit === 'K') calculatedInr = parsed * 1e3;
    else calculatedInr = parsed;

    setInvestmentInr(Math.round(calculatedInr));
  }

  function handleUnitChange(newUnit: 'Cr' | 'Lakh' | 'K' | 'INR') {
    setInputUnit(newUnit);
    syncDirectInputFromInr(investmentInr, newUnit);
  }

  function handleSliderChange(val: number) {
    const inr = sliderToInr(val);
    setInvestmentInr(inr);
    syncDirectInputFromInr(inr, inputUnit);
  }

  function handlePresetClick(presetInr: number, presetUnit: 'Cr' | 'Lakh' | 'K') {
    setInvestmentInr(presetInr);
    setInputUnit(presetUnit);
    syncDirectInputFromInr(presetInr, presetUnit);
  }

  const calculations = useMemo(() => {
    // SGST Benchmark is dynamically auto-calculated based on policy benchmark (~15% turnover baseline)
    const annualSgstInr = investmentInr > 0 ? Math.round(investmentInr * 0.15) : 0;

    // 1. IPS Ceiling calculation
    const baseIpsPercent = zoneInfo.ipsPercent;
    const effectiveIpsPercent = Math.min(100, baseIpsPercent + sectorInfo.ipsBonus);
    const totalIpsCeilingInr = investmentInr * (effectiveIpsPercent / 100);

    // 2. SGST Annual Reimbursement
    const maxAnnualIpsClaim = zoneInfo.benefitYears > 0 ? totalIpsCeilingInr / zoneInfo.benefitYears : 0;
    const actualAnnualSgstReimbursement = Math.min(annualSgstInr, maxAnnualIpsClaim);
    const totalSgstReimbursementInr = actualAnnualSgstReimbursement * zoneInfo.benefitYears;

    // 3. Capital Subsidy (Direct Grant)
    const capitalGrantInr = investmentInr * (sectorInfo.capitalGrantPercent / 100);

    // 4. Interest Subvention (MSME: 5% p.a. capped at ₹25L/yr for 5 yrs)
    const annualInterestSubsidyInr = isMsme ? Math.min(investmentInr * 0.05, 2500000) : 0;
    const totalInterestSubsidyInr = annualInterestSubsidyInr * 5;

    // 5. Electricity Duty Exemption
    const annualUnits = powerKw * 2400;
    const annualPowerSubsidyInr = annualUnits * sectorInfo.powerSubsidyRate;
    const totalPowerSubsidyInr = annualPowerSubsidyInr * zoneInfo.benefitYears;

    // 6. Stamp Duty Waiver (1% of project land + construction investment capped at ₹50 Lakh)
    const stampDutySavingsInr = Math.min(investmentInr * 0.01, 5000000);

    const totalCumulativeBenefitInr =
      totalSgstReimbursementInr + capitalGrantInr + totalInterestSubsidyInr + totalPowerSubsidyInr + stampDutySavingsInr;

    // Amortization Schedule (Years 1 to benefitYears)
    const schedule = [];
    let remainingIpsCeiling = totalIpsCeilingInr;

    for (let yr = 1; yr <= zoneInfo.benefitYears; yr++) {
      const ipsClaimed = Math.min(remainingIpsCeiling, actualAnnualSgstReimbursement);
      remainingIpsCeiling -= ipsClaimed;

      const capitalClaimed = yr === 1 ? capitalGrantInr : 0;
      const interestClaimed = yr <= 5 ? annualInterestSubsidyInr : 0;
      const powerClaimed = annualPowerSubsidyInr;
      const stampClaimed = yr === 1 ? stampDutySavingsInr : 0;

      const totalYearlyIncentive = ipsClaimed + capitalClaimed + interestClaimed + powerClaimed + stampClaimed;

      schedule.push({
        year: yr,
        ipsClaimed,
        capitalClaimed,
        interestClaimed,
        powerClaimed,
        stampClaimed,
        totalYearlyIncentive,
      });
    }

    return {
      annualSgstInr,
      effectiveIpsPercent,
      totalIpsCeilingInr,
      totalSgstReimbursementInr,
      capitalGrantInr,
      totalInterestSubsidyInr,
      totalPowerSubsidyInr,
      stampDutySavingsInr,
      totalCumulativeBenefitInr,
      benefitYears: zoneInfo.benefitYears,
      schedule,
    };
  }, [investmentInr, district, sector, isMsme, powerKw, zoneInfo, sectorInfo]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
              {t('calc.sim_title', 'Financial Incentive Simulator')}
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight">
            {t('calc.title', 'Interactive Maharashtra Subsidy & Amortization Calculator')}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {t('calc.desc', 'Calculates 10-year financial returns across PSI-2019, Textile Policy 2023, EV Policy 2021 & IT Policy 2023.')}
          </p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-5 py-3 text-right">
          <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
            {t('calc.est_total', 'Total Estimated Benefit (10-Yr Cumulative)')}
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {formatRupees(calculations.totalCumulativeBenefitInr, lang)}
          </div>
          <div className="text-[10px] text-slate-400">
            {investmentInr > 0 ? `~${((calculations.totalCumulativeBenefitInr / investmentInr) * 100).toFixed(1)}% ` : ''}
            {t('calc.of_capital', 'of Capital Investment')}
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 border-b border-slate-200 pb-2 flex items-center justify-between">
            <span>{t('calc.params', 'Project Parameters')}</span>
            <span className="text-[10px] font-mono text-slate-400 font-semibold">GIGW Compliant</span>
          </h3>

          {/* Capital Investment (with Dual Slider & Direct Numeric Input) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700">{t('calc.cap_inv', 'Capital Investment')}</label>
              <span className="font-mono font-extrabold text-blue-700 text-sm">
                {formatRupees(investmentInr, lang)}
              </span>
            </div>

            {/* Direct Numeric Input with Unit Selector */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={directInputValue}
                  onChange={(e) => handleDirectInputChange(e.target.value)}
                  placeholder={lang === 'mr' ? 'थेट रक्कम' : lang === 'hi' ? 'सटीक राशि' : 'Direct value'}
                  className={`w-full pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold border rounded-lg text-slate-900 focus:outline-none focus:ring-2 shadow-2xs ${
                    investmentInr > 10_000_000_000 ? 'border-amber-400 bg-amber-50/50 focus:ring-amber-500' : 'bg-white border-slate-300 focus:ring-blue-500'
                  }`}
                  aria-label="Direct Capital Investment Numeric Input"
                />
              </div>
              <select
                value={inputUnit}
                onChange={(e) => handleUnitChange(e.target.value as 'Cr' | 'Lakh' | 'K' | 'INR')}
                className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs shrink-0"
              >
                <option value="Cr">{lang === 'mr' ? 'कोटी (Cr)' : lang === 'hi' ? 'करोड़ (Cr)' : 'Crore (Cr)'}</option>
                <option value="Lakh">{lang === 'mr' ? 'लाख (Lakh)' : lang === 'hi' ? 'लाख (Lakh)' : 'Lakh (L)'}</option>
                <option value="K">{lang === 'mr' ? 'हजार (K)' : lang === 'hi' ? 'हज़ार (K)' : 'Thousand (K)'}</option>
                <option value="INR">{lang === 'mr' ? 'रुपये (INR)' : lang === 'hi' ? 'रुपये (INR)' : 'Rupees (₹)'}</option>
              </select>
            </div>

            {/* High Capital Investment Warning Notice */}
            {investmentInr > 10_000_000_000 && (
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-medium animate-in fade-in duration-200">
                <svg className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="space-y-0.5">
                  <p className="font-bold text-[11px] uppercase tracking-wider text-amber-950">
                    {lang === 'mr' ? '⚠️ उच्च भांडवली गुंतवणूक इशारा' : lang === 'hi' ? '⚠️ उच्च पूंजी निवेश चेतावनी' : '⚠️ High Capital Investment Warning'}
                  </p>
                  <p className="text-[11px] leading-relaxed text-amber-900">
                    {lang === 'mr'
                      ? `तुम्ही ${formatRupees(investmentInr, lang)} प्रविष्ट केले आहे. कृपया तुमची प्रविष्ट केलेली रक्कम आणि एकक (${inputUnit}) बरोबर असल्याचे तपासा.`
                      : lang === 'hi'
                      ? `आपने ${formatRupees(investmentInr, lang)} दर्ज किया है। कृपया जांच लें कि आपकी प्रविष्ट संख्या और इकाई (${inputUnit}) सही हैं।`
                      : `You have entered ${formatRupees(investmentInr, lang)}. Please double-check your entered value and unit selection (${inputUnit}).`}
                  </p>
                  <p className="text-[10px] text-amber-800 italic">
                    {t('calc.hpcc_note', 'Note: Ultra-Mega projects above ₹1,000 Cr receive customized High-Power Cabinet Committee (HPCC) approvals.')}
                  </p>
                </div>
              </div>
            )}

            {/* Continuous Slider spanning ₹0 to ₹1,000 Cr */}
            <input
              type="range"
              min={0}
              max={1000}
              step={1}
              value={inrToSlider(investmentInr)}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
              aria-label="Capital Investment Slider"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>₹0</span>
              <span>₹10 L</span>
              <span>₹1 Cr</span>
              <span>₹50 Cr</span>
              <span>₹250 Cr</span>
              <span>₹1,000 Cr</span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESETS.map((p) => {
                const isSelected = investmentInr === p.inr;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePresetClick(p.inr, p.unit)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {getPresetLabel(p, lang)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* District & Zone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('calc.dist_zone', 'District / Zone Sourcing')}</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(DISTRICT_ZONES).map((d) => (
                <option key={d} value={d}>
                  {getLocalizedDistrictZoneOption(d, lang)}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1 font-medium">
              {t('calc.slab', 'Slab:')} <strong className="text-slate-700">{getLocalizedZoneLabel(zoneInfo.label, lang)}</strong> ({zoneInfo.benefitYears} {t('calc.years_period', 'years period')})
            </p>
          </div>

          {/* Industrial Sector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('calc.sector', 'Industrial Sector')}</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(SECTOR_TOPUPS).map((s) => (
                <option key={s} value={s}>
                  {getLocalizedCalculatorSector(s, lang)}
                </option>
              ))}
            </select>
          </div>

          {/* Estimated Annual SGST Benchmark (Auto-calculated by Policy Engine - No manual slider) */}
          <div className="bg-indigo-50/70 border border-indigo-200/90 rounded-xl p-3">
            <div className="flex justify-between items-center text-xs mb-1">
              <label className="font-bold text-slate-800">{t('calc.est_sgst', 'Est. Annual SGST Benchmark')}</label>
              <span className="font-mono font-extrabold text-indigo-700 text-sm">
                {formatRupees(calculations.annualSgstInr, lang)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                <svg className="w-3 h-3 text-indigo-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{t('calc.auto_computed', 'Auto-calculated by Policy Engine (~15% Turnover Baseline)')}</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-medium leading-relaxed">
              {lang === 'mr'
                ? 'PSI-2019 अंतर्गत प्रत्यक्ष उत्पादित मालावरील भरलेल्या स्थूल SGST च्या आधारे परतावा दिला जातो.'
                : lang === 'hi'
                ? 'PSI-2019 के तहत उत्पादित माल पर चुकाए गए सकल SGST के आधार पर प्रतिपूर्ति दी जाती है।'
                : 'Under PSI-2019, gross SGST reimbursement is dynamically indexed against annual industrial production and turnover.'}
            </p>
          </div>

          {/* Connected Electrical Load (with Direct Numeric Input & Slider) */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <label className="font-bold text-slate-700">{t('calc.power', 'Connected Power Load')}</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={50000}
                  value={powerKw}
                  onChange={(e) => setPowerKw(Math.max(0, Number(e.target.value)))}
                  className="w-20 text-right px-2 py-0.5 font-mono font-extrabold text-amber-700 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  aria-label="Direct Connected Power Load Input"
                />
                <span className="font-bold text-xs text-slate-500">kW</span>
              </div>
            </div>
            <input
              type="range"
              min={50}
              max={5000}
              step={50}
              value={Math.min(5000, powerKw)}
              onChange={(e) => setPowerKw(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* MSME Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">{t('calc.msme_status', 'MSME Enterprise Status')}</span>
              <span className="text-[10px] text-slate-500">{t('calc.msme_sub', 'Qualifies for 5% Interest Subvention')}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsMsme(!isMsme)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isMsme ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isMsme ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Breakdown & Amortization Output Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Key Summary KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                {t('calc.ips_sgst', 'IPS / SGST Reimbursement')}
              </span>
              <span className="text-lg font-black text-emerald-900 mt-1 block">
                {formatRupees(calculations.totalSgstReimbursementInr, lang)}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {calculations.effectiveIpsPercent}% ECI Cap over {calculations.benefitYears} yrs
              </span>
            </div>

            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                {t('calc.cap_grant', 'Direct Capital Grant')}
              </span>
              <span className="text-lg font-black text-blue-900 mt-1 block">
                {formatRupees(calculations.capitalGrantInr, lang)}
              </span>
              <span className="text-[10px] text-blue-600 font-semibold">
                {sectorInfo.capitalGrantPercent}% Plant & Machinery Grant
              </span>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                {t('calc.power_aid', 'Power Tariff & Duty Aid')}
              </span>
              <span className="text-lg font-black text-amber-900 mt-1 block">
                {formatRupees(calculations.totalPowerSubsidyInr, lang)}
              </span>
              <span className="text-[10px] text-amber-600 font-semibold">
                ₹{sectorInfo.powerSubsidyRate}/unit subsidy for {calculations.benefitYears} yrs
              </span>
            </div>

            <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                {t('calc.int_sub', 'Interest Subvention')}
              </span>
              <span className="text-lg font-black text-purple-900 mt-1 block">
                {formatRupees(calculations.totalInterestSubsidyInr, lang)}
              </span>
              <span className="text-[10px] text-purple-600 font-semibold">
                {isMsme ? '5% p.a. for 5 Years' : 'N/A (Large Unit)'}
              </span>
            </div>
          </div>

          {/* Stamp Duty Card Banner with Mature Vector Icon */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <span className="font-bold block">{t('calc.stamp_title', '100% Stamp Duty Exemption Included')}</span>
                <span className="text-[11px] text-slate-300">
                  {t('calc.stamp_desc', 'Waiver on land lease deeds, mortgage execution & bank financing.')}
                </span>
              </div>
            </div>
            <div className="text-right font-extrabold text-emerald-400 text-sm shrink-0">
              +{formatRupees(calculations.stampDutySavingsInr, lang)} {t('calc.savings', 'Savings')}
            </div>
          </div>

          {/* Amortization Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {t('calc.schedule_title', 'Year-by-Year Incentive Amortization Schedule')}
              </h4>
              <span className="text-[11px] font-semibold text-slate-500">
                {calculations.benefitYears} {t('calc.projection_window', 'Year Projection Window')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2.5">{t('calc.th_year', 'Year')}</th>
                    <th className="px-3.5 py-2.5">{t('calc.th_ips', 'IPS SGST Subsidy')}</th>
                    <th className="px-3.5 py-2.5">{t('calc.th_capital', 'Capital Grant')}</th>
                    <th className="px-3.5 py-2.5">{t('calc.th_interest', 'Interest Subvention')}</th>
                    <th className="px-3.5 py-2.5">{t('calc.th_power', 'Power Duty Subsidy')}</th>
                    <th className="px-3.5 py-2.5 text-right">{t('calc.th_total', 'Total Cash Flow')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {calculations.schedule.map((row) => (
                    <tr key={row.year} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-2 font-bold text-slate-900">{t('calc.th_year', 'Year')} {row.year}</td>
                      <td className="px-3.5 py-2 text-emerald-700 font-mono">
                        {row.ipsClaimed > 0 ? formatRupees(row.ipsClaimed, lang) : '—'}
                      </td>
                      <td className="px-3.5 py-2 text-blue-700 font-mono">
                        {row.capitalClaimed > 0 ? formatRupees(row.capitalClaimed, lang) : '—'}
                      </td>
                      <td className="px-3.5 py-2 text-purple-700 font-mono">
                        {row.interestClaimed > 0 ? formatRupees(row.interestClaimed, lang) : '—'}
                      </td>
                      <td className="px-3.5 py-2 text-amber-700 font-mono">
                        {row.powerClaimed > 0 ? formatRupees(row.powerClaimed, lang) : '—'}
                      </td>
                      <td className="px-3.5 py-2 text-right font-bold text-slate-900 font-mono bg-emerald-50/40">
                        {formatRupees(row.totalYearlyIncentive, lang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
