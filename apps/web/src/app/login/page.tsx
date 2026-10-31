'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import { motion } from 'framer-motion';
import { Sparkles, Shield, Lock, Mail, Building2, ArrowRight, UserCheck, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@demo-school.local');
  const [password, setPassword] = useState('DemoAdmin123!');
  const [tenantCode, setTenantCode] = useState('demo-school');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State to hold the personas fetched from the backend
  const [personas, setPersonas] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/v1/demo/info')
      .then((data: any) => {
        if (data && data.personas) {
          setPersonas(data.personas);
        }
      })
      .catch(() => {});
  }, []);

  async function performLogin(loginEmail: string, loginPassword: string) {
    setError(null);
    setLoading(true);
    try {
      await login({ email: loginEmail, password: loginPassword, tenantCode });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
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
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-slate-950 text-slate-100">
      {/* Floating Aurora Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-indigo-600/30 via-purple-600/25 to-transparent blur-[130px] animate-aurora" />
        <div className="absolute top-1/4 -right-40 w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-pink-600/20 via-purple-600/25 to-transparent blur-[140px] animate-aurora" style={{ animationDelay: '-6s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-cyan-600/20 via-blue-600/15 to-transparent blur-[150px] animate-aurora" style={{ animationDelay: '-12s' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 text-white text-3xl font-black mb-4 shadow-xl shadow-indigo-500/30 border border-white/25 transform hover:scale-105 transition-transform duration-300">
            S
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            School Enterprise Suite
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">
            Next-Generation Academic Administration & Governance
          </p>
        </div>

        {/* Main Login Card */}
        <div className="glass-card-dark rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl backdrop-blur-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" /> School Tenant Code
              </label>
              <input 
                type="text" 
                value={tenantCode} 
                onChange={(e) => setTenantCode(e.target.value)} 
                required 
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-500 focus:bg-white/15 focus:border-indigo-400 focus:outline-none transition-all text-sm font-semibold"
                placeholder="e.g. demo-school"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email Address
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-500 focus:bg-white/15 focus:border-indigo-400 focus:outline-none transition-all text-sm font-semibold"
                placeholder="name@school.edu"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> Security Password
              </label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-500 focus:bg-white/15 focus:border-indigo-400 focus:outline-none transition-all text-sm font-semibold"
                placeholder="••••••••••••"
              />
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-300 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full mt-2 py-3.5 rounded-xl glass-button-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/40 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Dynamic Demo Quick Persona Login Bar */}
        {personas.length > 0 && (
          <div className="glass-card-dark rounded-3xl p-6 border border-white/10 shadow-xl backdrop-blur-2xl">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 text-center mb-4 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>One-Click Role Demonstration</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {personas.map((persona) => (
                <button
                  key={persona.role}
                  onClick={() => handleQuickLogin(persona)}
                  disabled={loading}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-indigo-400/50 text-left transition-all duration-200 group disabled:opacity-50"
                >
                  <span className="block text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                    {persona.roleName}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium truncate mt-0.5">
                    {persona.firstName} {persona.lastName || ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-xs text-slate-500 font-medium">
          Protected by Enterprise Zero-Trust Tenant Isolation
        </div>
      </div>
    </div>
  );
}
