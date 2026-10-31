'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import { Shield, Lock, School, ArrowRight, Loader2, Users } from 'lucide-react';

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
    try {
      await login({ email: loginEmail, password: loginPassword, tenantCode });
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 502) {
        setError('Server is waking up on Render. Please click Sign In again in a few seconds.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Invalid credentials or server unavailable.');
      }
    } finally {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-slate-100 selection:bg-slate-700">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 mb-3 shadow-lg">
            <School className="w-6 h-6 text-slate-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">School Management Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Sign in with your institutional credentials or demo accounts</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                School Tenant Code
              </label>
              <input
                type="text"
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                  <span>Connecting to School Server...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* One-Click Role Switcher */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            <Users className="w-4 h-4" />
            <span>Instant Demo Role Switcher</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {personas.map((persona) => (
              <button
                key={persona.role}
                type="button"
                onClick={() => handleQuickLogin(persona)}
                disabled={loading}
                className="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-700/60 border border-slate-700/70 text-left transition-colors group disabled:opacity-50"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                  {persona.roleName || persona.role}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {persona.firstName}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
