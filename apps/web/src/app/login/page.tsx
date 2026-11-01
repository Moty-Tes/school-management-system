'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import { Shield, ArrowRight, Loader2, Users, Sparkles, GraduationCap, Wallet, BookOpen, UserCheck } from 'lucide-react';
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
  const [loadingText, setLoadingText] = useState('Connecting to Server...');
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
    setLoadingText('Connecting to Server...');

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
    setError(null);
  }

  return (
    <FigmaGeometricBackground>
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6 my-auto">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mulish">
              Sign In
            </h1>
            <p className="text-xs text-slate-400 mt-1.5">
              Enter your credentials to access your dashboard
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@school.com"
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
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071324]/80 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-[#E86524] focus:ring-2 focus:ring-[#E86524]/30 font-mono transition-all"
                />
              </div>

              {/* School Tenant Code - subtle collapsible option */}
              <div className="pt-0.5">
                <details className="group">
                  <summary className="text-[11px] text-slate-400 hover:text-slate-300 cursor-pointer flex items-center justify-between select-none py-1">
                    <span>School Tenant: <span className="font-mono text-slate-200">{tenantCode || 'demo-school'}</span></span>
                    <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={tenantCode}
                      onChange={(e) => setTenantCode(e.target.value)}
                      required
                      placeholder="e.g. demo-school"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#071324]/80 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-[#E86524] font-mono"
                    />
                  </div>
                </details>
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
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Quick Demo Accounts Helper */}
            {personas && personas.length > 0 && (
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="flex items-center justify-between text-xs mb-2.5">
                  <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#E86524]" />
                    <span>Demo Accounts (1-click fill)</span>
                  </span>
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
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-[#E86524] text-white shadow-md shadow-[#E86524]/40 border border-[#E86524]'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-white/20'
                        }`}
                      >
                        <Icon className="w-3 h-3 shrink-0" />
                        <span>{persona.title || persona.roleName || persona.role}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </FigmaGeometricBackground>
  );
}
