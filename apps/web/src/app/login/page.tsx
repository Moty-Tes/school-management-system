'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import { Shield, Lock, School, ArrowRight, Loader2, Users, Sparkles, GraduationCap, Wallet, BookOpen, UserCheck, Check } from 'lucide-react';
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
  const [email, setEmail] = useState('admin@demo-school.local');
  const [password, setPassword] = useState('DemoAdmin123!');
  const [tenantCode, setTenantCode] = useState('demo-school');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Connecting to School Server...');
  const [error, setError] = useState<string | null>(null);
  const [personas, setPersonas] = useState<any[]>(DEFAULT_PERSONAS);
  const [activePersonaRole, setActivePersonaRole] = useState('TENANT_ADMIN');

  useEffect(() => {
    // Attempt to fetch fresh personas from backend, fallback to default personas if sleeping
    api.get<any>('/api/v1/demo/info')
      .then((data: any) => {
        if (data && data.personas && data.personas.length > 0) {
          setPersonas(data.personas);
        }
      })
      .catch(() => {
        // Keep DEFAULT_PERSONAS on cold start
      });
  }, []);

  async function performLogin(loginEmail: string, loginPassword: string) {
    setError(null);
    setLoading(true);
    setLoadingText('Connecting to School Server...');

    const wakeTimer = setTimeout(() => {
      setLoadingText('Waking up server on Render (~30s)... Almost ready!');
    }, 4000);

    try {
      await login({ email: loginEmail, password: loginPassword, tenantCode });
      clearTimeout(wakeTimer);
      router.push('/dashboard');
    } catch (err) {
      clearTimeout(wakeTimer);
      if (err instanceof ApiError && (err.status === 502 || err.status === 503 || err.status === 504)) {
        setError('Server is finishing waking up on Render. Please click Sign In once more to enter!');
      } else {
        setError(err instanceof ApiError ? err.message : 'Invalid credentials or server unavailable.');
      }
    } finally {
      clearTimeout(wakeTimer);
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await performLogin(email, password);
  }

  function handleQuickSelect(persona: any) {
    setEmail(persona.email);
    setPassword(persona.password);
    setActivePersonaRole(persona.role);
    setError(null);
  }

  return (
    <FigmaGeometricBackground showBadges={true}>
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6 my-auto">
          
          {/* Header */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-2xl bg-[#E86524]/30 blur-xl animate-pulse" />
              <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1B4F8C] border border-[#E86524]/60 text-white shadow-xl">
                <School className="w-7 h-7 text-[#E86524]" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mulish">
              School Management Portal
            </h1>
            <p className="text-xs text-slate-300/80 mt-1.5 flex items-center justify-center gap-1.5">
              <span>Enterprise Edition</span>
              <span className="w-1 h-1 rounded-full bg-[#E86524]" />
            </p>
          </div>

          {/* Login Form */}
          <div className="relative bg-[#0B1E38]/85 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(7,19,34,0.9)] backdrop-blur-xl">
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-medium leading-relaxed flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Demo Persona Pill Ribbon */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#E86524]" />
                  <span>Demo Persona Quick-Fill</span>
                </span>
                <span className="text-[11px] text-slate-400">1-click select</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {personas.map((persona) => {
                  const isSelected = email === persona.email;
                  const Icon = ROLE_ICONS[persona.role] || Shield;
                  return (
                    <button
                      key={persona.role}
                      type="button"
                      onClick={() => handleQuickSelect(persona)}
                      disabled={loading}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-[#E86524] text-white shadow-md shadow-[#E86524]/40 border border-[#E86524]'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{persona.title || persona.roleName || persona.role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  School Tenant Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tenantCode}
                    onChange={(e) => setTenantCode(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#071324]/80 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-[#E86524] focus:ring-2 focus:ring-[#E86524]/30 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071324]/80 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-[#E86524] focus:ring-2 focus:ring-[#E86524]/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071324]/80 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-[#E86524] focus:ring-2 focus:ring-[#E86524]/30 font-mono transition-all"
                />
              </div>

              {/* Sleek Satin Beveled Sign-In Button */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full mt-3 group overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-[#E86524]/50 disabled:opacity-60 transition-all duration-300 active:scale-[0.99]"
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
          </div>

          {/* Institutional Trust Footer */}
          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400/80">
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#E86524]" />
              <span>TLS 1.3 256-Bit Encrypted</span>
            </div>
            <span>•</span>
            <span>School ERP Multi-Tenant</span>
          </div>

        </div>
      </div>
    </FigmaGeometricBackground>
  );
}
