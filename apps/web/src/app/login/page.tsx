'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import {
  Shield, ArrowRight, Loader2, Users, Sparkles, GraduationCap,
  Wallet, BookOpen, UserCheck, Eye, EyeOff, Lock, Mail, Building,
  AlertCircle, HelpCircle
} from 'lucide-react';
import { FigmaGeometricBackground } from '@/components/FigmaGeometricBackground';

const ROLE_ICONS: Record<string, any> = {
  TENANT_ADMIN: Shield,
  TEACHER: GraduationCap,
  ACCOUNTANT: Wallet,
  STUDENT: BookOpen,
  PARENT: Users,
  REGISTRAR: UserCheck,
};

const DEFAULT_PERSONAS = [
  { role: 'TENANT_ADMIN', roleName: 'School Administrator', email: 'admin@demo-school.local', password: 'DemoAdmin123!', firstName: 'Alemayehu', title: 'Principal' },
  { role: 'TEACHER', roleName: 'Senior Teacher', email: 'teacher@demo-school.local', password: 'Teacher123!', firstName: 'Abebe', title: 'Teacher' },
  { role: 'ACCOUNTANT', roleName: 'Bursar & Accountant', email: 'accountant@demo-school.local', password: 'Accountant123!', firstName: 'Sara', title: 'Bursar' },
  { role: 'STUDENT', roleName: 'Student', email: 'student@demo-school.local', password: 'Student123!', firstName: 'Almaz', title: 'Student' },
  { role: 'PARENT', roleName: 'Parent / Guardian', email: 'parent@demo-school.local', password: 'Parent123!', firstName: 'Mulugeta', title: 'Parent' },
  { role: 'REGISTRAR', roleName: 'Admissions Registrar', email: 'registrar@demo-school.local', password: 'Registrar123!', firstName: 'Dawit', title: 'Registrar' },
];

export default function LoginPage() {
  const router = useRouter();

  // Production state starts clean; users enter their actual credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantCode, setTenantCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Signing in...');
  const [error, setError] = useState<string | null>(null);

  // Demo Sandbox Drawer state
  const [showDemoSandbox, setShowDemoSandbox] = useState(false);
  const [personas, setPersonas] = useState<any[]>(DEFAULT_PERSONAS);

  useEffect(() => {
    // Check URL query parameters for preselected tenant code if redirected from school subdomain/link
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const schoolParam = params.get('school') || params.get('tenant');
      if (schoolParam) {
        setTenantCode(schoolParam.trim().toLowerCase());
      }
    }

    // Attempt to load sandbox demo info if available
    api.get<any>('/api/v1/demo/info')
      .then((data: any) => {
        if (data && Array.isArray(data.personas) && data.personas.length > 0) {
          setPersonas(data.personas);
        }
      })
      .catch(() => {
        // Quiet fallback to DEFAULT_PERSONAS
      });
  }, []);

  async function performLogin(loginEmail: string, loginPassword: string, code: string) {
    setError(null);

    const trimmedEmail = loginEmail.trim();
    const trimmedTenant = code.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }
    if (!trimmedTenant) {
      setError('Please enter your School Code (e.g. demo-school).');
      return;
    }

    setLoading(true);
    setLoadingText('Authenticating credentials...');

    const wakeTimer = setTimeout(() => {
      setLoadingText('Connecting to school server... Please hold.');
    }, 3500);

    try {
      await login({ email: trimmedEmail, password: loginPassword, tenantCode: trimmedTenant });
      clearTimeout(wakeTimer);
      router.push('/dashboard');
    } catch (err: any) {
      clearTimeout(wakeTimer);
      if (err instanceof ApiError && (err.status === 502 || err.status === 503 || err.status === 504)) {
        if (err.status === 503) {
          setError('School service is undergoing maintenance or database sync (HTTP 503). Please retry in a few moments.');
        } else {
          setError('Backend gateway is warming up or temporarily unreachable (HTTP 502/504). If the server was idle, please retry in 15–30 seconds.');
        }
      } else if (err instanceof ApiError && err.status === 429) {
        setError('Too many sign-in attempts or high network traffic (HTTP 429). Please wait 10–15 seconds before trying again.');
      } else if (err instanceof ApiError && err.status === 401) {
        setError('Invalid email, password, or school code. Please verify your credentials.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Unable to connect to school server. Please verify your connection.');
      }
    } finally {
      clearTimeout(wakeTimer);
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await performLogin(email, password, tenantCode);
  }

  function handleSelectDemoPersona(persona: any) {
    setEmail(persona.email);
    setPassword(persona.password);
    setTenantCode('demo-school');
    setError(null);
  }

  return (
    <FigmaGeometricBackground>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-[440px] space-y-6">

          {/* Institution Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B4F8C] to-[#0A1E37] border border-white/10 shadow-lg text-white mb-1">
              <GraduationCap className="w-6 h-6 text-[#E86524]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mulish">
              School Management System
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Sign in to access your administrative and academic workspace
            </p>
          </div>

          {/* Main Authentication Card */}
          <div className="relative bg-[#0A1E37]/80 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            {error && (
              <div 
                role="alert" 
                className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-medium leading-relaxed flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* School Code / Tenant */}
              <div>
                <label 
                  htmlFor="tenantCode" 
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  School Identifier / Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    id="tenantCode"
                    name="tenantCode"
                    type="text"
                    value={tenantCode}
                    onChange={(e) => setTenantCode(e.target.value)}
                    required
                    placeholder="e.g. demo-school or your school slug"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#061426]/90 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#E86524] focus:ring-2 focus:ring-[#E86524]/25 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@school.edu"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#061426]/90 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#E86524] focus:ring-2 focus:ring-[#E86524]/25 transition-all"
                  />
                </div>
              </div>

              {/* Password with Show/Hide toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label 
                    htmlFor="password" 
                    className="block text-xs font-semibold text-slate-300"
                  >
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400 hover:text-slate-300 cursor-pointer">
                    Forgot password? Contact admin
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#061426]/90 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#E86524] focus:ring-2 focus:ring-[#E86524]/25 font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Sign-In Action */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full mt-4 group overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-[#E86524]/50 disabled:opacity-60 transition-all duration-300 active:scale-[0.99]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#E86524] via-[#F17336] to-[#E86524] opacity-90 group-hover:opacity-100 transition-opacity rounded-xl" />
                <span className="relative flex items-center justify-center gap-2.5 px-5 py-3 rounded-[11px] bg-gradient-to-b from-[#E86524] to-[#cc4f15] text-white font-semibold text-sm tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_20px_-4px_rgba(232,101,36,0.5)] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_12px_28px_-4px_rgba(232,101,36,0.65)] transition-all duration-200">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                      <span className="truncate">{loadingText}</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to School</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Separated Sandbox / Demo Persona Explorer */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowDemoSandbox(!showDemoSandbox)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors py-1 group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E86524]" />
                  <span>Explore Demo Sandbox (1-Click Fill)</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-200 transition-transform">
                    {showDemoSandbox ? '▲' : '▼'}
                  </span>
                </button>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                  Sandbox
                </span>
              </div>

              {showDemoSandbox && (
                <div className="mt-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2 animate-in fade-in duration-200">
                  <p className="text-[11px] text-slate-300">
                    Select a demo persona to test role-specific workflows in <span className="font-mono text-[#E86524]">demo-school</span>:
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {personas.map((persona) => {
                      const Icon = ROLE_ICONS[persona.role] || Shield;
                      const isSelected = email === persona.email && tenantCode === 'demo-school';
                      return (
                        <button
                          key={persona.role}
                          type="button"
                          onClick={() => handleSelectDemoPersona(persona)}
                          disabled={loading}
                          className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs transition-all ${
                            isSelected
                              ? 'bg-[#E86524] text-white shadow-sm font-semibold'
                              : 'bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/5 hover:border-white/15'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                          <div className="min-w-0">
                            <p className="font-medium text-[11px] truncate">{persona.title || persona.roleName}</p>
                            <p className="text-[9px] text-slate-400 truncate font-mono">{persona.email}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Secure Institutional Guarantee Footer */}
          <div className="text-center text-[11px] text-slate-500">
            <span>Role-Based Multi-Tenant Architecture &bull; Strictly Isolated School Data</span>
          </div>

        </div>
      </div>
    </FigmaGeometricBackground>
  );
}
