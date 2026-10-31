'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@demo-school.local');
  const [password, setPassword] = useState('DemoAdmin123!');
  const [tenantCode, setTenantCode] = useState('demo-school');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State to hold the personas fetched from the backend
  const [personas, setPersonas] = useState<any[]>([]);

  // Fetch the personas when the page loads
  useEffect(() => {
    api.get('/api/v1/demo/info')
      .then((data: any) => {
        if (data && data.personas) {
          setPersonas(data.personas);
        }
      })
      .catch(() => {
        // Ignore error, the user can still type manually
      });
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-lg space-y-6">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-2xl font-bold mb-4">S</div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your school account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">School code</label>
              <input type="text" value={tenantCode} onChange={(e) => setTenantCode(e.target.value)} required className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm" />
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* DYNAMIC DEMO SWITCHER */}
        {personas.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-4">
              Or explore the demo as
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {personas.map((persona) => (
                <button
                  key={persona.role}
                  onClick={() => handleQuickLogin(persona)}
                  disabled={loading}
                  className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 text-left"
                >
                  <span className="block truncate">{persona.roleName}</span>
                  <span className="block text-[10px] text-indigo-500 font-normal truncate">{persona.firstName}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}