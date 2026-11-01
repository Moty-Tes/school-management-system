'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import { Shield, Lock, School, ArrowRight, Loader2, Users, Sparkles } from 'lucide-react';
import { FigmaGeometricBackground } from '@/components/FigmaGeometricBackground';

const DEFAULT_PERSONAS = [
  { role: 'TENANT_ADMIN', roleName: 'School Administrator', email: 'admin@demo-school.local', password: 'DemoAdmin123!', firstName: 'Alemayehu', title: 'Principal' },
  { role: 'TEACHER', roleName: 'Senior Teacher', email: 'teacher@demo-school.local', password: 'Teacher123!', firstName: 'Abebe', title: 'Mathematics' },
  { role: 'ACCOUNTANT', roleName: 'Bursar & Accountant', email: 'accountant@demo-school.local', password: 'Accountant123!', firstName: 'Sara', title: 'Finance' },
  { role: 'STUDENT', roleName: 'Student', email: 'student@demo-school.local', password: 'Student123!', firstName: 'Almaz', title: 'Grade 10' },
  { role: 'PARENT', roleName: 'Parent / Guardian', email: 'parent@demo-school.local', password: 'Parent123!', firstName: 'Mulugeta', title: 'Guardian' },
  { role: 'REGISTRAR', roleName: 'Admissions Registrar', email: 'registrar@demo-school.local', password: 'Registrar123!', firstName: 'Dawit', title: 'Admissions' },
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

  function handleQuickLogin(persona: any) {
    setEmail(persona.email);
    setPassword(persona.password);
    performLogin(persona.email, persona.password);
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
              <span className="font-semibold text-white">V 1.0</span>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
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
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
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
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-[#E86524] hover:bg-[#d2541a] active:scale-[0.99] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#E86524]/30 hover:shadow-[#E86524]/50 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                    <span className="truncate">{loadingText}</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to School</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* One-Click Role Switcher */}
          <div className="bg-[#0B1E38]/65 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#E86524]" />
                <span>Instant Demo Role Switcher</span>
              </div>
              <span className="text-[10px] text-[#E86524] bg-[#E86524]/10 px-2 py-0.5 rounded-full border border-[#E86524]/20">
                1-Click
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {personas.map((persona) => (
                <button
                  key={persona.role}
                  type="button"
                  onClick={() => handleQuickLogin(persona)}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-[#071324]/70 hover:bg-[#1B4F8C]/40 border border-white/10 hover:border-[#E86524]/60 text-left transition-all duration-200 group disabled:opacity-50"
                >
                  <div className="text-xs font-bold text-slate-200 group-hover:text-[#E86524] truncate transition-colors">
                    {persona.roleName || persona.role}
                  </div>
                  <div className="text-[10px] text-slate-400 group-hover:text-slate-300 truncate mt-0.5">
                    {persona.firstName}
                  </div>
                </button>
              ))}
            </div>
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
