'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: string;
}

export default function AiSupportWidget() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'live' | 'helpline'>('ai');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: '1',
        sender: 'bot',
        text: t('bot.welcome', 'Namaskar! 🙏 I am your Maharashtra UIAS Assistant. Ask me about PSI-2019, MPCB consents, Fire NOC, or MAITRI single-window clearances.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [t]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const query = input.trim().toLowerCase();
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let replyText =
        'I am grounded in official Maharashtra Government Gazettes. For detailed policy evaluation, please visit the Project Assessment page or check the Codified Rules explorer.';

      if (query.includes('psi') || query.includes('subsidy') || query.includes('ips') || query.includes('sgst')) {
        replyText =
          'Under PSI-2019, Industrial Promotion Subsidy (IPS) equals 30% to 100% of Gross SGST paid for up to 10 years in Zones C, D, and D+. You can use our interactive Amortization Calculator under the Incentives tab!';
      } else if (query.includes('mpcb') || query.includes('pollution') || query.includes('consent') || query.includes('cte') || query.includes('cto')) {
        replyText =
          'MPCB Consents (Consent to Establish/Operate) are mandatory based on Red, Orange, Green, and White pollution categories. Combined Application Forms (CAF) can be submitted via MAITRI.';
      } else if (query.includes('helpline') || query.includes('contact') || query.includes('call') || query.includes('phone')) {
        replyText =
          'You can call the official Industry Helpline at 1800-233-0000 (Toll-Free, 9 AM - 6 PM Mon-Sat) or connect with a Live Support Executive via the Live Agent tab above.';
      } else if (query.includes('textile') || query.includes('garments')) {
        replyText =
          'The Integrated & Sustainable Textile Policy 2023-2028 grants 25% to 45% capital subsidies for plant & machinery plus ₹2/unit power tariff subsidies for LT/HT looms.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white font-bold text-xs rounded-full shadow-2xl hover:scale-105 transition-all cursor-pointer border border-blue-400/30 group"
        >
          <div className="relative flex items-center justify-center">
            <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-extrabold tracking-tight">{t('bot.trigger_title', 'AI Policy Bot & Support')}</span>
            <span className="text-[9px] text-blue-200 font-medium">{t('bot.trigger_sub', 'Govt Helpline & Live Agent')}</span>
          </div>
        </button>
      )}

      {/* Floating Drawer Modal */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 p-1 border border-slate-700 flex items-center justify-center shrink-0">
                <img src="/maharashtra-emblem.png" alt="State Emblem" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-white">{t('bot.hub_title', 'Maharashtra UIAS Support Hub')}</h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {t('bot.live_assist', 'Live Official Assistance')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close Support Hub"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab Navigation Bar */}
          <div className="flex bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === 'ai' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{t('bot.tab_ai', 'AI Assistant')}</span>
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === 'live' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{t('bot.tab_live', 'Live Agent')}</span>
            </button>
            <button
              onClick={() => setActiveTab('helpline')}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === 'helpline' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{t('bot.tab_helpline', 'Helplines')}</span>
            </button>
          </div>

          {/* TAB 1: AI ASSISTANT CHAT */}
          {activeTab === 'ai' && (
            <div className="flex-1 flex flex-col bg-slate-50 min-h-0">
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs ${
                        m.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      <p className="leading-relaxed">{m.text}</p>
                      <span
                        className={`text-[9px] block mt-1 ${
                          m.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                        }`}
                      >
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-400 text-xs italic flex items-center gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce delay-100">●</span>
                      <span className="animate-bounce delay-200">●</span>
                      <span className="ml-1 text-[10px] text-slate-500 font-medium">{t('bot.searching', 'Searching Policy Gazette...')}</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Form Input */}
              <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  placeholder={t('bot.placeholder', 'Ask about PSI-2019, MPCB, Fire NOC...')}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                >
                  {t('bot.send', 'Send')}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: LIVE AGENT CONNECT */}
          {activeTab === 'live' && (
            <div className="flex-1 p-5 bg-slate-50 overflow-y-auto space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">{t('bot.officer_title', 'MAITRI Single Window Officer')}</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {t('bot.officer_desc', 'Connect live with a dedicated Industries Inspector from the Directorate of Industries, Govt. of Maharashtra.')}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">{t('bot.desk_status', 'Desk Status:')}</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                    {t('bot.officers_online', '● 14 Officers Available Online')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">{t('bot.queue_wait', 'Average Queue Wait:')}</span>
                  <span className="text-slate-800 font-bold">{t('bot.queue_mins', '~ 2 Mins')}</span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('bot.select_dept', 'Select Inquiry Department')}</label>
                  <select className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none">
                    <option>{t('bot.opt_psi', 'Industries & Subsidies Desk (PSI-2019)')}</option>
                    <option>{t('bot.opt_mpcb', 'MPCB Environmental Consents Desk')}</option>
                    <option>{t('bot.opt_midc', 'MIDC Land Allocation Desk')}</option>
                    <option>{t('bot.opt_msedcl', 'MSEDCL Industrial Power Connection')}</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => alert('Requesting live agent session... Connected to Officer Desk #4.')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <span>{t('bot.connect_btn', 'Connect to Live Officer Now →')}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: HELPLINES & CONTACT NUMBERS */}
          {activeTab === 'helpline' && (
            <div className="flex-1 p-5 bg-slate-50 overflow-y-auto space-y-3 text-xs">
              <div className="bg-blue-900 text-white rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                  {t('bot.helpline_title', 'State Industrial Toll-Free Helpline')}
                </span>
                <span className="text-xl font-black block font-mono">1800-233-0000</span>
                <span className="text-[10px] text-blue-200 block">{t('bot.operating_hours', 'Operating Hours: Monday – Saturday (9:30 AM to 6:00 PM)')}</span>
              </div>

              <div className="space-y-2">
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block">{t('bot.hl_maitri', 'MAITRI Investor Cell')}</span>
                    <span className="text-[10px] text-slate-500">{t('bot.hl_maitri_sub', 'Direct Support for Mega Projects')}</span>
                  </div>
                  <a href="tel:02222026827" className="text-blue-700 font-mono font-bold hover:underline">
                    022-22026827
                  </a>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block">{t('bot.hl_mpcb', 'MPCB Environment Desk')}</span>
                    <span className="text-[10px] text-slate-500">{t('bot.hl_mpcb_sub', 'Pollution Consent Technical Aid')}</span>
                  </div>
                  <a href="tel:02224010437" className="text-blue-700 font-mono font-bold hover:underline">
                    022-24010437
                  </a>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block">{t('bot.hl_midc', 'MIDC Head Office')}</span>
                    <span className="text-[10px] text-slate-500">{t('bot.hl_midc_sub', 'Industrial Plots & Allotment')}</span>
                  </div>
                  <a href="tel:02226870052" className="text-blue-700 font-mono font-bold hover:underline">
                    022-26870052
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
