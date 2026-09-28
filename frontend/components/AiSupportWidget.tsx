'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import {
  askSupportBot,
  createSupportTicket,
  getSupportTicketDetail,
  postTicketMessage,
  SupportTicket,
  SupportMessage,
} from '@/lib/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  action_links?: Array<{ label: string; url: string }>;
  suggested_questions?: string[];
  recommended_department?: string;
  prefill_inquiry?: string;
}

// ── Clean Message Formatter (No raw markdown) ────────────────────────────────

function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 font-sans leading-relaxed text-xs">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header ###
        if (trimmed.startsWith('### ')) {
          const headerText = trimmed.replace('### ', '');
          return (
            <h4 key={idx} className="font-extrabold text-xs text-slate-900 mt-2 mb-1 flex items-center gap-1.5">
              <span>{headerText}</span>
            </h4>
          );
        }

        // Header ## or #
        if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          const headerText = trimmed.replace(/^#+\s*/, '');
          return (
            <h3 key={idx} className="font-black text-xs text-slate-950 mt-2.5 mb-1.5">
              {headerText}
            </h3>
          );
        }

        // Bullet point: - or * or •
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          const content = trimmed.replace(/^[-*•]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
              <div className="flex-1">{renderFormattedSpans(content)}</div>
            </div>
          );
        }

        // Numbered list: 1. or 2.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-0.5">
              <span className="font-mono font-bold text-[10px] text-blue-700 bg-blue-100 px-1 rounded shrink-0 mt-0.5">
                {numMatch[1]}
              </span>
              <div className="flex-1">{renderFormattedSpans(numMatch[2])}</div>
            </div>
          );
        }

        // Standard line
        return <p key={idx}>{renderFormattedSpans(trimmed)}</p>;
      })}
    </div>
  );
}

// Helper to format bold, code, and links within line
function renderFormattedSpans(line: string): React.ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-extrabold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-slate-200/80 px-1 py-0.5 rounded font-mono text-[10px] text-blue-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ── 10 Rich Pre-Options for Live Agent ────────────────────────────────────────

const PRE_OPTIONS = [
  {
    id: 'psi_discrepancy',
    badge: '💰 PSI-2019 Subsidy',
    dept: 'PSI-2019 Subsidies',
    subject: 'Incentive Calculation & SGST Subsidy Claim Verification',
    template: 'We need clarification regarding our unit\'s eligibility for 100% Gross SGST reimbursement under PSI-2019 Zone D+ and the 5% term loan interest subsidy. Our planned capital investment is ₹12 Crores.',
  },
  {
    id: 'mpcb_cat',
    badge: '🌿 MPCB Consents',
    dept: 'MPCB Environmental Consents',
    subject: 'MPCB Orange vs Green Category Classification Dispute',
    template: 'We are establishing a secondary food & agro-packaging plant. Requesting official clarification if this activity falls under Green Category (fast-track) or Orange Category requiring prior ETP consent.',
  },
  {
    id: 'msedcl_power',
    badge: '⚡ Power Connection',
    dept: 'MSEDCL Power Connection',
    subject: 'Industrial HT Power Load Sanction & Feasibility Delay',
    template: 'We applied for 200 KW HT power connection at our industrial plot. Seeking status on substation feasibility and ₹1.5/unit industrial tariff subsidy disbursement.',
  },
  {
    id: 'midc_land',
    badge: '🏗️ MIDC Land Allotment',
    dept: 'MIDC Land Allotment',
    subject: 'Industrial Plot Allotment & Infrastructure Scrutiny',
    template: 'Our Earnest Money Deposit (EMD) was submitted online via MAITRI 14 days ago. Inquiring regarding site inspection date and final land allotment order.',
  },
  {
    id: 'fire_noc',
    badge: '🚒 Fire Safety NOC',
    dept: 'Fire Safety NOC',
    subject: 'Provisional Fire NOC Architectural Plan Scrutiny',
    template: 'Need verification from Directorate of Maharashtra Fire Services regarding mandatory setback distance requirements for high-hazard storage sheds.',
  },
  {
    id: 'caf_form',
    badge: '📝 CAF Form Submission',
    dept: 'General Inquiries',
    subject: 'Combined Application Form (CAF) Document Verification',
    template: 'Seeking assistance with submitting CAF Form 10 and linking our Udyam MSME certificate on the MAITRI single window portal.',
  },
  {
    id: 'women_incentive',
    badge: '👩‍💼 Women / SC-ST Subsidy',
    dept: 'PSI-2019 Subsidies',
    subject: 'Special Affirmative Incentive Claim (+20% Capital Subsidy)',
    template: 'Our enterprise is 100% women-owned and led. Inquiring on the procedure to claim the additional 20% capital subsidy and priority MIDC industrial plot allotment.',
  },
  {
    id: 'disht_factory',
    badge: '🏭 Factory License (DISHT)',
    dept: 'General Inquiries',
    subject: 'Factory Inspectorate Building Plan & Machinery Approval',
    template: 'We have submitted factory architectural plans under Rule 3 of Maharashtra Factories Rules 1963. Requesting expedited scrutiny from the Joint Director DISHT.',
  },
  {
    id: 'solar_captive',
    badge: '☀️ Solar Power Wheeling',
    dept: 'MSEDCL Power Connection',
    subject: 'Captive Solar Power Open Access & Net Metering Sanction',
    template: 'We plan to install a 500 KWP rooftop captive solar plant. Inquiring about grid synchronization and electricity duty exemption under the Renewable Policy.',
  },
  {
    id: 'cgwa_water',
    badge: '💧 Ground Water NOC',
    dept: 'General Inquiries',
    subject: 'Ground Water Abstraction Clearance & Rainwater Recharge Plan',
    template: 'Need guidelines from Maharashtra Ground Water Authority on ground water extraction limits and rainwater harvesting compliance for semi-critical blocks.',
  },
];

// Categorized Pre-Questions for AI Chatbot
const QUICK_PROMPTS_CATEGORIES = [
  {
    category: 'Core Portal',
    items: [
      '🎯 How does Project Assessment work?',
      '📊 Where do I see assessment results?',
      '📝 Where do I auto-fill CAF forms?',
      '🔍 How to track application SLA status?',
    ],
  },
  {
    category: 'Subsidies & PSI-2019',
    items: [
      '💰 What subsidies under PSI-2019?',
      '⚡ Industrial power tariff concessions',
      '👩‍💼 Women & SC/ST entrepreneur incentives',
      '🗺️ Which Talukas belong to Zone D+?',
    ],
  },
  {
    category: 'Clearances & Policies',
    items: [
      '🌿 How to get MPCB Consent (CTE/CTO)?',
      '🚒 Fire Safety NOC requirements',
      '🏢 MIDC industrial land allotment',
      '🚗 Electric Vehicle (EV) Policy 2025',
      '🧵 Textile Policy 2023-2028 capital subsidy',
    ],
  },
];

export default function AiSupportWidget() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'live' | 'helpline'>('ai');

  // AI Tab State
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Live Agent Tab State
  const [applicantName, setApplicantName] = useState('');
  const [entityName, setEntityName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Pune');
  const [selectedDept, setSelectedDept] = useState('PSI-2019 Subsidies');
  const [currentStage, setCurrentStage] = useState('Pre-Establishment');
  const [liveSubject, setLiveSubject] = useState('');
  const [liveQuestion, setLiveQuestion] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [liveReplyInput, setLiveReplyInput] = useState('');
  const [isSendingLiveMsg, setIsSendingLiveMsg] = useState(false);

  // Live Attachment state (citizen side)
  const [citizenAttachment, setCitizenAttachment] = useState<{
    name: string;
    type: string;
    data: string;
    size: number;
  } | null>(null);
  const citizenFileInputRef = useRef<HTMLInputElement>(null);
  const liveChatEndRef = useRef<HTMLDivElement>(null);

  // Pre-fill user profile info from localStorage
  useEffect(() => {
    try {
      const userRaw = localStorage.getItem('smsws_user');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u.name) setApplicantName(u.name);
        if (u.entity_name) setEntityName(u.entity_name);
        if (u.district) setDistrict(u.district);
        if (u.stage) setCurrentStage(u.stage);
      }
      const assessRaw = localStorage.getItem('smsws_assessment');
      if (assessRaw) {
        const a = JSON.parse(assessRaw);
        if (a.profile?.stage) setCurrentStage(a.profile.stage);
        if (a.profile?.district) setDistrict(a.profile.district);
      }
      const savedTicketId = localStorage.getItem('smsws_active_ticket_id');
      if (savedTicketId) {
        setActiveTicketId(savedTicketId);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Initialize bot welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text:
          "### 🏛️ Welcome to Maharashtra UIAS Assistant\n\n" +
          "Namaskar! 🙏 I am your **Maharashtra Single Window Digital Assistant**.\n\n" +
          "I can assist you with:\n" +
          "- **Project Assessment (`/assess`)** — Evaluate statutory clearances & subsidy eligibility in 3 simple steps.\n" +
          "- **Incentives & Schemes (`/incentives`)** — Calculate Gross SGST reimbursement (30% to 100%), 5% interest subsidy, and electricity duty exemption under PSI-2019.\n" +
          "- **Forms Repository (`/forms`)** — Search and auto-fill 186+ codified government application forms.\n" +
          "- **Clearances & Compliance (`/approvals`)** — Guidelines for MPCB (CTE/CTO), Fire NOC, MIDC, and DISHT licenses.\n" +
          "- **Live Officer Desk** — Connect live with a Single Window Officer from the Directorate of Industries.\n\n" +
          "What question can I answer for your enterprise today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggested_questions: [
          'How do I assess my project?',
          'What subsidies under PSI-2019?',
          'How to get MPCB Consent?',
          'Industrial power tariff concessions',
        ],
      },
    ]);
  }, [t]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen && activeTab === 'ai') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab, isTyping]);

  useEffect(() => {
    if (isOpen && activeTab === 'live') {
      liveChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.messages, isOpen, activeTab]);

  // Periodic polling for active live ticket updates (every 3 seconds)
  useEffect(() => {
    if (!activeTicketId) return;

    const fetchTicket = async () => {
      try {
        const data = await getSupportTicketDetail(activeTicketId);
        setActiveTicket(data);
      } catch (e) {
        console.error('Failed to poll ticket:', e);
      }
    };

    fetchTicket();
    const interval = setInterval(fetchTicket, 3000);
    return () => clearInterval(interval);
  }, [activeTicketId]);

  // Handle citizen file attachment
  const handleCitizenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCitizenAttachment({
        name: file.name,
        type: file.type || 'application/octet-stream',
        data: reader.result as string,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Copy bot answer
  const handleCopyAnswer = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Transfer AI question to Live Officer Desk
  const handleTransferToLiveOfficer = (botMsg: ChatMessage) => {
    setActiveTab('live');
    const targetDept = botMsg.recommended_department || 'General Inquiries';
    if (activeTicket && activeTicket.department !== targetDept) {
      setActiveTicketId(null);
      setActiveTicket(null);
      localStorage.removeItem('smsws_active_ticket_id');
    }
    setSelectedDept(targetDept);
    setLiveSubject(botMsg.prefill_inquiry ? `Clarification on ${botMsg.prefill_inquiry.slice(0, 40)}...` : 'Assistance with Portal Inquiry');
    setLiveQuestion(botMsg.prefill_inquiry || 'I need official guidance from a Single Window Officer on this matter.');
  };

  // Send AI Chat Query
  const handleBotQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const resp = await askSupportBot(queryText.trim(), pathname);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: resp.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action_links: resp.action_links,
          suggested_questions: resp.suggested_questions,
          recommended_department: resp.recommended_department,
          prefill_inquiry: resp.prefill_inquiry || queryText.trim(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text:
            "### 🏛️ Maharashtra Single Window System\n\n" +
            "You can use the **Project Assessment** page (`/assess`) to evaluate all your approvals and incentives, or use the **Live Agent** tab above to connect with a Single Window Officer.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action_links: [
            { label: 'Start Project Assessment', url: '/assess' },
            { label: 'View Incentives', url: '/incentives' },
          ],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Select pre-set option for Live Agent
  const handleSelectPreOption = (opt: (typeof PRE_OPTIONS)[0]) => {
    if (activeTicket && activeTicket.department !== opt.dept) {
      setActiveTicketId(null);
      setActiveTicket(null);
      localStorage.removeItem('smsws_active_ticket_id');
    }
    setSelectedDept(opt.dept);
    setLiveSubject(opt.subject);
    setLiveQuestion(opt.template);
  };

  // Submit Live Agent ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !entityName.trim() || !liveQuestion.trim()) {
      alert('Please provide your name, enterprise name, and question description.');
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const res = await createSupportTicket({
        applicant_name: applicantName.trim(),
        entity_name: entityName.trim(),
        phone: phone.trim() || undefined,
        district,
        department: selectedDept,
        current_stage: currentStage,
        subject: liveSubject.trim() || `${selectedDept} Inquiry`,
        initial_message: liveQuestion.trim(),
        attachment_name: citizenAttachment?.name,
        attachment_type: citizenAttachment?.type,
        attachment_data: citizenAttachment?.data,
        attachment_size: citizenAttachment?.size,
      });

      setActiveTicketId(res.ticket_id);
      localStorage.setItem('smsws_active_ticket_id', res.ticket_id);
      setCitizenAttachment(null);
      const detail = await getSupportTicketDetail(res.ticket_id);
      setActiveTicket(detail);
    } catch (err: any) {
      alert(err.message || 'Failed to submit inquiry to Officer Desk');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Citizen sending follow-up message in live ticket
  const handleSendLiveMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!liveReplyInput.trim() && !citizenAttachment) || !activeTicketId) return;

    setIsSendingLiveMsg(true);
    try {
      await postTicketMessage(activeTicketId, {
        sender: 'user',
        sender_name: applicantName || 'Citizen Applicant',
        sender_title: 'Applicant',
        text: liveReplyInput.trim() || (citizenAttachment ? `Uploaded document: ${citizenAttachment.name}` : ''),
        attachment_name: citizenAttachment?.name,
        attachment_type: citizenAttachment?.type,
        attachment_data: citizenAttachment?.data,
        attachment_size: citizenAttachment?.size,
      });
      setLiveReplyInput('');
      setCitizenAttachment(null);
      if (citizenFileInputRef.current) citizenFileInputRef.current.value = '';
      const updated = await getSupportTicketDetail(activeTicketId);
      setActiveTicket(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setIsSendingLiveMsg(false);
    }
  };

  const handleCloseActiveTicket = (skipConfirm: boolean = false) => {
    if (skipConfirm || confirm('Do you want to close this session and start a new inquiry or connect with another department?')) {
      setActiveTicketId(null);
      setActiveTicket(null);
      localStorage.removeItem('smsws_active_ticket_id');
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: '### 🏛️ Chat History Cleared\n\nNamaskar! How can I assist you today? Select any prompt below or type your question.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggested_questions: ['How do I assess my project?', 'What subsidies under PSI-2019?'],
      },
    ]);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white font-bold text-xs rounded-full shadow-2xl hover:scale-105 hover:shadow-blue-500/25 transition-all cursor-pointer border border-blue-400/40 group"
        >
          <div className="relative flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-extrabold tracking-tight">AI Policy Bot & Support</span>
            <span className="text-[9px] text-blue-200 font-medium">Govt Helpline & Live Officer</span>
          </div>
        </button>
      )}

      {/* Floating Support Modal Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[480px] h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 p-1 border border-slate-700 flex items-center justify-center shrink-0">
                <img src="/maharashtra-emblem.png" alt="State Emblem" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-white">Maharashtra UIAS Support Hub</h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Government Single Window Assistance
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {activeTab === 'ai' && (
                <button
                  onClick={handleClearChat}
                  title="Clear chat history"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-[10px]"
                >
                  🔄
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Support Hub"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 shrink-0">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'ai' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>AI Policy Bot</span>
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'live' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="flex items-center gap-1">
                Live Officer
                {activeTicketId && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('helpline')}
              className={`flex-1 py-2.5 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'helpline' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span>Helplines</span>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: AI ASSISTANT CHAT
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'ai' && (
            <div className="flex-1 flex flex-col bg-slate-50 min-h-0">
              {/* Categorized Quick Prompts Bar */}
              <div className="p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1 shrink-0">
                {QUICK_PROMPTS_CATEGORIES.flatMap((c) => c.items).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleBotQuery(q)}
                    className="text-[10px] font-semibold bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2.5 py-1 rounded-full border border-slate-300 shadow-2xs transition-colors shrink-0 cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs min-h-0">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[90%] rounded-2xl px-3.5 py-3 shadow-xs ${
                        m.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      {/* Message Content rendered cleanly */}
                      <FormattedText text={m.text} />

                      {/* Action Links (e.g. Go to Project Assessment) */}
                      {m.action_links && m.action_links.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {m.action_links.map((link, lIdx) => (
                            <Link
                              key={lIdx}
                              href={link.url}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-200 transition-colors"
                            >
                              <span>{link.label}</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Functional Bar: Copy Answer & Transfer to Live Officer */}
                      {m.sender === 'bot' && m.id !== 'welcome' && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <button
                            onClick={() => handleTransferToLiveOfficer(m)}
                            className="text-amber-700 hover:text-amber-800 font-extrabold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition-colors cursor-pointer"
                          >
                            <span>👨‍💼 Ask a Live Officer About This →</span>
                          </button>

                          <button
                            onClick={() => handleCopyAnswer(m.id, m.text)}
                            className="text-slate-400 hover:text-slate-700 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === m.id ? (
                              <span className="text-emerald-600 font-bold">✓ Copied</span>
                            ) : (
                              <span>📋 Copy</span>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Follow-up Question Suggestions */}
                      {m.suggested_questions && m.suggested_questions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                            Suggested Follow-Ups:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {m.suggested_questions.map((sq, sqIdx) => (
                              <button
                                key={sqIdx}
                                onClick={() => handleBotQuery(sq)}
                                className="text-[10px] text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 px-2 py-0.5 rounded border border-slate-200 transition-colors text-left cursor-pointer"
                              >
                                • {sq}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <span
                        className={`text-[9px] block mt-1.5 ${
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
                    <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-400 text-xs italic flex items-center gap-1.5 shadow-2xs">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-200" />
                      <span className="ml-1 text-[10px] text-slate-500 font-semibold">Consulting Maharashtra Gazettes...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Bot Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleBotQuery(input);
                }}
                className="p-2.5 bg-white border-t border-slate-200 flex gap-2 shrink-0"
              >
                <input
                  type="text"
                  placeholder="Ask any question about Maharashtra policy, forms, or clearances..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0 cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: LIVE AGENT CONNECT & MEDIA/DOCUMENTS HANDLING
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'live' && (
            <div className="flex-1 flex flex-col bg-slate-50 min-h-0">
              {/* If User has an Active Live Ticket -> Show Live Thread */}
              {activeTicketId && activeTicket ? (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Active Ticket Banner */}
                  <div className="p-3 bg-gradient-to-r from-blue-900 to-indigo-950 text-white shrink-0 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-300">{activeTicket.ticket_id}</span>
                        {activeTicket.current_stage && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-800/80 text-blue-200 border border-blue-600">
                            {activeTicket.current_stage}
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                            activeTicket.status === 'RESOLVED'
                              ? 'bg-emerald-500 text-white'
                              : activeTicket.status === 'IN_PROGRESS'
                              ? 'bg-blue-500 text-white'
                              : 'bg-amber-400 text-slate-900 animate-pulse'
                          }`}
                        >
                          {activeTicket.status === 'RESOLVED' ? 'Resolved' : activeTicket.status === 'IN_PROGRESS' ? 'Officer Connected' : 'Queued for Officer'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-blue-200 block truncate max-w-[160px] font-medium">
                          Dept: {activeTicket.department}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCloseActiveTicket(true)}
                          className="text-[9px] bg-blue-800 hover:bg-blue-700 text-amber-300 hover:text-white font-bold px-2 py-0.5 rounded border border-blue-600 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Switch to another department desk"
                        >
                          🔄 Switch Desk
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCloseActiveTicket(false)}
                        className="text-[10px] text-blue-200 hover:text-white underline px-1 cursor-pointer"
                        title="Close active ticket session"
                      >
                        New Ticket
                      </button>
                    </div>
                  </div>

                  {/* Message Thread */}
                  <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs min-h-0 bg-slate-100">
                    {activeTicket.messages?.map((msg, idx) => {
                      const isOfficer = msg.sender === 'officer';
                      const isSystem = msg.sender === 'system';

                      if (isSystem) {
                        return (
                          <div key={idx} className="flex justify-center my-1.5">
                            <div className="bg-white/90 border border-slate-300 rounded-full px-3 py-1 text-[10px] text-slate-600 text-center shadow-2xs max-w-[90%]">
                              {msg.text}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={idx} className={`flex ${isOfficer ? 'justify-start' : 'justify-end'}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl p-3 shadow-xs ${
                              isOfficer
                                ? 'bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-bl-none border border-emerald-700'
                                : 'bg-blue-600 text-white rounded-br-none'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 border-b border-white/15 pb-1">
                              <span className={`text-[10px] font-black ${isOfficer ? 'text-emerald-300' : 'text-blue-100'}`}>
                                {isOfficer ? `🏛️ ${msg.sender_name}` : msg.sender_name}
                              </span>
                              <span className="text-[9px] text-white/70 font-medium truncate">
                                ({msg.sender_title})
                              </span>
                            </div>

                            <p className="leading-relaxed whitespace-pre-wrap text-xs">{msg.text}</p>

                            {/* Media / Document Attachment Card */}
                            {msg.attachment_name && (
                              <div className="mt-2 p-2 bg-black/20 border border-white/20 rounded-xl flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 text-white">
                                    {msg.attachment_type?.startsWith('image/') ? '🖼️' : '📄'}
                                  </div>
                                  <div className="overflow-hidden">
                                    <span className="text-[10px] font-bold text-white block truncate">{msg.attachment_name}</span>
                                    <span className="text-[8px] text-white/70">{formatFileSize(msg.attachment_size)}</span>
                                  </div>
                                </div>

                                {msg.attachment_data && (
                                  <a
                                    href={msg.attachment_data}
                                    download={msg.attachment_name}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-0.5 bg-white text-slate-900 text-[9px] font-bold rounded hover:bg-slate-100 transition-colors shrink-0"
                                  >
                                    View
                                  </a>
                                )}
                              </div>
                            )}

                            <span className="text-[8px] text-white/60 block mt-1 text-right">{msg.created_at}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={liveChatEndRef} />
                  </div>

                  {/* Citizen Live Reply Input with File Attachment */}
                  <form onSubmit={handleSendLiveMessage} className="p-2.5 bg-white border-t border-slate-200 flex flex-col gap-1.5 shrink-0">
                    {/* Attachment preview chip if selected */}
                    {citizenAttachment && (
                      <div className="flex items-center justify-between px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-blue-700 font-bold text-[11px]">📎 {citizenAttachment.name}</span>
                          <span className="text-[9px] text-slate-500">({formatFileSize(citizenAttachment.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCitizenAttachment(null)}
                          className="text-slate-400 hover:text-slate-700 px-1 cursor-pointer text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2 items-center">
                      <input
                        type="file"
                        ref={citizenFileInputRef}
                        onChange={handleCitizenFileChange}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      />
                      <button
                        type="button"
                        onClick={() => citizenFileInputRef.current?.click()}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0 cursor-pointer"
                        title="Attach Media / Document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </button>

                      <input
                        type="text"
                        placeholder="Type follow-up to the Government Officer..."
                        value={liveReplyInput}
                        onChange={(e) => setLiveReplyInput(e.target.value)}
                        className="flex-1 text-xs px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-800"
                      />
                      <button
                        type="submit"
                        disabled={(!liveReplyInput.trim() && !citizenAttachment) || isSendingLiveMsg}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shadow-xs shrink-0 cursor-pointer"
                      >
                        {isSendingLiveMsg ? 'Sending...' : 'Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* No Active Ticket -> Show Pre-options & Inquiry Submission Form */
                <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                  {/* Official Citizen Guidance Banner */}
                  <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-3.5 border border-blue-700/60 shadow-xs">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-300 block">
                      MAITRI Directorate of Industries
                    </span>
                    <h4 className="font-extrabold text-xs text-white">Live Government Officer Assistance</h4>
                    <p className="text-[10px] text-blue-200 mt-0.5">
                      Connect directly with an assigned departmental officer. Your submitted forms and enterprise stage will be reviewed by the desk.
                    </p>
                  </div>

                  {/* Pre-options / Pre-set Templates */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                      <span>⚡ Select Quick Topic / Pre-Option:</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PRE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectPreOption(opt)}
                          className="p-2 text-left bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded-xl transition-all shadow-2xs group cursor-pointer"
                        >
                          <span className="font-extrabold text-[10px] text-slate-900 block group-hover:text-blue-700">
                            {opt.badge}
                          </span>
                          <span className="text-[9px] text-slate-500 line-clamp-1">{opt.subject}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inquiry Details Form */}
                  <form onSubmit={handleCreateTicket} className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={applicantName}
                          onChange={(e) => setApplicantName(e.target.value)}
                          placeholder="e.g. Ramesh Patil"
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Enterprise Name *</label>
                        <input
                          type="text"
                          required
                          value={entityName}
                          onChange={(e) => setEntityName(e.target.value)}
                          placeholder="e.g. Patil Industries"
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">District / Taluka</label>
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                        >
                          <option value="Pune">Pune</option>
                          <option value="Nagpur">Nagpur</option>
                          <option value="Aurangabad">Chhatrapati Sambhajinagar</option>
                          <option value="Nashik">Nashik</option>
                          <option value="Thane">Thane</option>
                          <option value="Solapur">Solapur</option>
                          <option value="Kolhapur">Kolhapur</option>
                          <option value="Amravati">Amravati</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Current Stage</label>
                        <select
                          value={currentStage}
                          onChange={(e) => setCurrentStage(e.target.value)}
                          className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none font-medium"
                        >
                          <option value="Pre-Establishment">Pre-Establishment</option>
                          <option value="Pre-Operation">Pre-Operation</option>
                          <option value="Commercial Production">Commercial Production</option>
                          <option value="Expansion">Expansion</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Department</label>
                        <select
                          value={selectedDept}
                          onChange={(e) => setSelectedDept(e.target.value)}
                          className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                        >
                          <option value="PSI-2019 Subsidies">PSI-2019 Subsidies</option>
                          <option value="MPCB Environmental Consents">MPCB Consents</option>
                          <option value="MIDC Land Allotment">MIDC Land & Plots</option>
                          <option value="MSEDCL Power Connection">MSEDCL Power</option>
                          <option value="Fire Safety NOC">Fire Safety NOC</option>
                          <option value="General Inquiries">General / Single Window</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Inquiry Subject</label>
                      <input
                        type="text"
                        value={liveSubject}
                        onChange={(e) => setLiveSubject(e.target.value)}
                        placeholder="Brief summary of inquiry..."
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[10px] font-bold text-slate-600">Question / Problem Description *</label>
                        <input
                          type="file"
                          ref={citizenFileInputRef}
                          onChange={handleCitizenFileChange}
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        />
                        <button
                          type="button"
                          onClick={() => citizenFileInputRef.current?.click()}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>📎 Attach Document / DPR</span>
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        required
                        value={liveQuestion}
                        onChange={(e) => setLiveQuestion(e.target.value)}
                        placeholder="Provide details regarding your project, plot, or subsidy claim..."
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none resize-none"
                      />
                    </div>

                    {citizenAttachment && (
                      <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-blue-700 font-bold text-[11px]">📎 {citizenAttachment.name}</span>
                          <span className="text-[9px] text-slate-500">({formatFileSize(citizenAttachment.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCitizenAttachment(null)}
                          className="text-slate-400 hover:text-slate-700 px-2 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingTicket}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmittingTicket ? (
                        <span>Connecting with Government Officer...</span>
                      ) : (
                        <span>Submit Inquiry to Live Officer Desk →</span>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: HELPLINES & CONTACT NUMBERS
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'helpline' && (
            <div className="flex-1 p-4 bg-slate-50 overflow-y-auto space-y-3 text-xs">
              <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl p-4 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                  State Industrial Toll-Free Helpline
                </span>
                <span className="text-xl font-black block font-mono">1800-233-0000</span>
                <span className="text-[10px] text-blue-200 block">
                  Operating Hours: Monday – Saturday (9:30 AM to 6:00 PM)
                </span>
              </div>

              <div className="space-y-2">
                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="font-extrabold text-slate-900 block">MAITRI Investor Cell</span>
                    <span className="text-[10px] text-slate-500">Direct Support for Mega & Large Projects</span>
                  </div>
                  <a href="tel:02222026827" className="text-blue-700 font-mono font-bold hover:underline">
                    022-22026827
                  </a>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="font-extrabold text-slate-900 block">MPCB Environment Desk</span>
                    <span className="text-[10px] text-slate-500">Pollution Consents & Classification Aid</span>
                  </div>
                  <a href="tel:02224010437" className="text-blue-700 font-mono font-bold hover:underline">
                    022-24010437
                  </a>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="font-extrabold text-slate-900 block">MIDC Head Office</span>
                    <span className="text-[10px] text-slate-500">Industrial Plots & Allotment Inquiries</span>
                  </div>
                  <a href="tel:02226870052" className="text-blue-700 font-mono font-bold hover:underline">
                    022-26870052
                  </a>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="font-extrabold text-slate-900 block">Directorate of Maharashtra Fire Services</span>
                    <span className="text-[10px] text-slate-500">Fire Safety NOC & Scrutiny Aid</span>
                  </div>
                  <a href="tel:02226677555" className="text-blue-700 font-mono font-bold hover:underline">
                    022-26677555
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
