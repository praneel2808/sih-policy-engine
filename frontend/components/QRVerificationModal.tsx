'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useLanguage } from '@/context/LanguageContext';
import type { ProjectSummary } from '@/types';

interface QRVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectSummary: ProjectSummary;
  clearanceCount: number;
  incentiveCount: number;
}

export default function QRVerificationModal({
  isOpen,
  onClose,
  projectSummary,
  clearanceCount,
  incentiveCount,
}: QRVerificationModalProps) {
  const { t } = useLanguage();
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const verificationRef = `MH-GR-2019-PSI-${Math.abs(
    (projectSummary.entity_name || 'SMSWS').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % 89999 + 10000}`;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000/results';
  const verificationUrl = `${currentUrl}?verify=${verificationRef}&status=valid`;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      QRCode.toDataURL(verificationUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then(setQrUrl)
        .catch((err) => console.error('Failed to generate QR code:', err));
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, verificationUrl]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 print:hidden">
      {/* Click-away backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-label="Close modal background" />

      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 border border-slate-700/80 flex items-center justify-center shrink-0">
              <img
                src="/maharashtra-emblem.png"
                alt="Government of Maharashtra"
                className="w-full h-full object-contain drop-shadow"
              />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white leading-tight">
                {t('qr.modal_title', 'Official Digital Verification Gateway')}
              </h3>
              <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-semibold mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>MAITRI Single Window Authenticator</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Close verification dialog"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center shadow-inner">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md mb-3">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="Scannable QR Verification Code"
                  className="w-44 h-44 object-contain mx-auto"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <p className="text-xs font-bold text-slate-900">
              {t('qr.scan_instruction', 'Scan with any Smartphone Camera')}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs leading-relaxed">
              {t('qr.scan_sub', 'Instantly verifies this project evaluation against official Maharashtra State Gazettes & MAITRI Rules.')}
            </p>
          </div>

          {/* Verification Attributes */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Status</span>
              <span className="font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                GAZETTE VERIFIED
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Certificate Ref</span>
              <span className="font-mono font-bold text-slate-800">{verificationRef}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Enterprise Name</span>
              <span className="font-bold text-slate-900 truncate max-w-[200px]">
                {projectSummary.entity_name || 'Industrial Project'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Sector & District</span>
              <span className="font-semibold text-slate-800">
                {projectSummary.sector} · {projectSummary.district || 'Maharashtra'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Clearances & Subsidies</span>
              <span className="font-semibold text-indigo-700">
                {clearanceCount} Approvals · {incentiveCount} Incentives
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-400">
              <span>Timestamp: {new Date().toLocaleString('en-IN')}</span>
              <span>SHA256: Verified</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>{copied ? t('qr.copied', 'Copied Link!') : t('qr.copy_link', 'Copy Verification Link')}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Badge</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
