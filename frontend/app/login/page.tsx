'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { loginUser, registerUser, DISTRICTS } from '@/lib/api';

const ENTITY_TYPES = ['Company', 'LLP', 'Proprietorship'];
const SECTORS = [
  'Textile', 'EV / Automotive', 'Electronics', 'Chemical', 'Engineering',
  'Food Processing', 'IT / ITES', 'Logistics', 'Aerospace', 'Startup', 'Other'
];
const STAGES = ['Pre-establishment', 'Construction', 'Operational', 'Expansion'];
const LOCATION_TYPES = ['MIDC', 'Private industrial area', 'Other'];

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();

  // Tabs
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Shared state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register state
  const [regStep, setRegStep] = useState(1);
  const [regForm, setRegForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    entity_name: '',
    entity_type: '',
    sector: '',
    stage: '',
    district: '',
    location_type: '',
    investment_inr: '',
    employment_expected: '',
  });

  useEffect(() => {
    if (localStorage.getItem('smsws_user')) {
      router.replace('/');
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(loginUsername, loginPassword);
      localStorage.setItem('smsws_user', JSON.stringify({
        user_id: res.user_id,
        username: res.username,
        name: res.entity_name,
        role: 'User'
      }));
      if (res.profile) {
        localStorage.setItem('smsws_profile', JSON.stringify(res.profile));
      }
      if (res.assessment) {
        localStorage.setItem('smsws_assessment', JSON.stringify(res.assessment));
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  }

  function handleRegChange(field: string, value: string) {
    setRegForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    
    if (regStep === 1) {
      if (regForm.username.length < 3 || regForm.username.length > 50) {
        setError('Username must be 3-50 characters');
        return;
      }
      if (regForm.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (regForm.password !== regForm.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setRegStep(2);
      return;
    }
    
    if (regStep === 2) {
      if (!regForm.entity_name || !regForm.entity_type || !regForm.sector || !regForm.stage) {
        setError('Please fill all required company details');
        return;
      }
      setRegStep(3);
      return;
    }
    
    if (regStep === 3) {
      setError('');
      setLoading(true);
      try {
        const payload = {
          username: regForm.username,
          password: regForm.password,
          entity_type: regForm.entity_type,
          entity_name: regForm.entity_name,
          sector: regForm.sector,
          stage: regForm.stage,
          district: regForm.district || undefined,
          location_type: regForm.location_type || undefined,
          investment_inr: regForm.investment_inr ? Number(regForm.investment_inr) : undefined,
          employment_expected: regForm.employment_expected ? Number(regForm.employment_expected) : undefined,
        };
        const res = await registerUser(payload);
        
        localStorage.setItem('smsws_user', JSON.stringify({
          user_id: res.user_id,
          username: res.username,
          name: res.entity_name,
          role: 'User'
        }));
        if (res.assessment) {
          localStorage.setItem('smsws_assessment', JSON.stringify(res.assessment));
        }
        router.push('/');
      } catch (err: any) {
        setError(err.message || 'Registration failed');
        setLoading(false);
      }
    }
  }

  function quickFill() {
    setLoginUsername('sih130');
    setLoginPassword('uias130@');
    setError('');
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Portal Header */}
        <div className="text-center mb-6">
          <div className="w-28 h-28 rounded-3xl bg-slate-900/95 flex items-center justify-center mx-auto mb-4 shadow-xl border border-slate-700/80 p-3 ring-4 ring-slate-800/20">
            <img
              src="/maharashtra-emblem.png"
              alt="Government of Maharashtra Official Emblem"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
          <p className="text-slate-700 text-base tracking-wider uppercase font-extrabold">{t('gov.name', 'Government of Maharashtra')}</p>
          <h1 className="text-slate-900 font-black text-2xl tracking-tight mt-1">{t('portal.name', 'Unified Industrial Approval System')}</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">{t('portal.subtitle', 'Single Window Clearance & Regulatory Portal')}</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'login' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700'}`}
            >
              {t('login.signin', 'Sign In')}
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); setRegStep(1); }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'register' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700'}`}
            >
              Register
            </button>
          </div>

          <div className="p-7">
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <p className="text-slate-500 text-xs mb-5">{t('login.sub', 'Enter authorized single-window credentials')}</p>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('login.username', 'Username')}
                  </label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => { setLoginUsername(e.target.value); setError(''); }}
                    placeholder="username"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/40 bg-slate-50/50 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t('login.password', 'Password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPass ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => { setLoginPassword(e.target.value); setError(''); }}
                      placeholder="password"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/40 bg-slate-50/50 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass(!showLoginPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px] font-medium"
                      tabIndex={-1}
                    >
                      {showLoginPass ? t('login.hide', 'Hide') : t('login.show', 'Show')}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !loginUsername || !loginPassword}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-xs"
                >
                  {loading ? t('login.authenticating', 'Authenticating…') : t('login.access', 'Access Portal →')}
                </button>

                {/* Quick Credential Helper Button */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Authorized: <code className="text-slate-700 font-mono">username</code></span>
                  <button
                    type="button"
                    onClick={quickFill}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium underline underline-offset-2"
                  >
                    {t('login.autofill', 'Auto-fill Credentials')}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-700">Step {regStep} of 3</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(s => (
                      <div key={s} className={`h-1.5 w-6 rounded-full ${regStep >= s ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>

                {regStep === 1 && (
                  <>
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Account Details</h3>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Username *</label>
                      <input
                        type="text"
                        value={regForm.username}
                        onChange={(e) => handleRegChange('username', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Password *</label>
                      <input
                        type="password"
                        value={regForm.password}
                        onChange={(e) => handleRegChange('password', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        value={regForm.confirmPassword}
                        onChange={(e) => handleRegChange('confirmPassword', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600/40"
                      />
                    </div>
                  </>
                )}

                {regStep === 2 && (
                  <>
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Company Details</h3>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Entity / Project Name *</label>
                      <input
                        type="text"
                        value={regForm.entity_name}
                        onChange={(e) => handleRegChange('entity_name', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Entity Type *</label>
                      <select
                        value={regForm.entity_type}
                        onChange={(e) => handleRegChange('entity_type', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600/40 bg-white"
                      >
                        <option value="">Select...</option>
                        {ENTITY_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Sector *</label>
                      <select
                        value={regForm.sector}
                        onChange={(e) => handleRegChange('sector', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600/40 bg-white"
                      >
                        <option value="">Select...</option>
                        {SECTORS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Stage *</label>
                      <select
                        value={regForm.stage}
                        onChange={(e) => handleRegChange('stage', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600/40 bg-white"
                      >
                        <option value="">Select...</option>
                        {STAGES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {regStep === 3 && (
                  <>
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Location & Investment</h3>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">District (Optional)</label>
                      <select
                        value={regForm.district}
                        onChange={(e) => handleRegChange('district', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600/40 bg-white"
                      >
                        <option value="">Select...</option>
                        {DISTRICTS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Location Type (Optional)</label>
                      <select
                        value={regForm.location_type}
                        onChange={(e) => handleRegChange('location_type', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600/40 bg-white"
                      >
                        <option value="">Select...</option>
                        {LOCATION_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Investment (INR, Optional)</label>
                      <input
                        type="number"
                        min="0"
                        value={regForm.investment_inr}
                        onChange={(e) => handleRegChange('investment_inr', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Expected Employment (Optional)</label>
                      <input
                        type="number"
                        min="0"
                        value={regForm.employment_expected}
                        onChange={(e) => handleRegChange('employment_expected', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-600/40"
                      />
                    </div>
                  </>
                )}

                {error && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {regStep > 1 && (
                    <button
                      type="button"
                      onClick={() => { setRegStep(regStep - 1); setError(''); }}
                      className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs transition-colors hover:bg-slate-50 bg-white"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-xs"
                  >
                    {loading ? 'Processing...' : regStep === 3 ? 'Complete Registration' : 'Next →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-slate-400 text-[11px] mt-5">
          Government of Maharashtra · Directorate of Industries
        </p>
      </div>
    </div>
  );
}
