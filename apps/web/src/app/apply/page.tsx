'use client';

import { useState, FormEvent } from 'react';
import { getApiBaseUrl } from '@/lib/config';
import { FigmaGeometricBackground } from '@/components/FigmaGeometricBackground';
import Link from 'next/link';

export default function ApplyPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    tenantCode: 'demo-school',
    firstName: '',
    lastName: '',
    gender: 'MALE',
    dateOfBirth: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    previousSchool: '',
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/v1/admissions/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to apply');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <FigmaGeometricBackground showBadges={false}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-[#0B1E38]/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/15 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-2xl font-extrabold text-white font-mulish">Application Submitted!</h2>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Thank you, {formData.guardianName}. Your application for <span className="text-[#E86524] font-semibold">{formData.firstName}</span> has been received. The school administration will contact you shortly.
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-block px-6 py-2.5 rounded-xl bg-[#E86524] hover:bg-[#d2541a] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-[#E86524]/30"
              >
                Back to Portal
              </Link>
            </div>
          </div>
        </div>
      </FigmaGeometricBackground>
    );
  }

  return (
    <FigmaGeometricBackground showBadges={false}>
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-[#0B1E38]/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/15 p-8 sm:p-10 text-white">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E86524]/20 border border-[#E86524]/40 text-[#E86524] text-xs font-bold uppercase tracking-wider mb-3">
              Official Admissions Portal
            </div>
            <h1 className="text-3xl font-extrabold font-mulish tracking-tight text-white">Student Online Application</h1>
            <p className="text-slate-300 text-sm mt-2">Fill out the form below to begin enrollment for the upcoming academic session</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#071324]/60 p-4 rounded-xl border border-white/10">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">School Code</label>
              <input required type="text" value={formData.tenantCode} onChange={e => setFormData({...formData, tenantCode: e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1E38] border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-[#E86524]" placeholder="e.g. demo-school" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Student First Name</label>
                <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl bg-[#071324]/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#E86524]" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Student Last Name</label>
                <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl bg-[#071324]/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#E86524]" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Gender</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl bg-[#071324]/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#E86524]">
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Date of Birth</label>
                <input type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl bg-[#071324]/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#E86524]" />
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-bold text-[#E86524] uppercase tracking-wider mb-4">Guardian Contact Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Guardian Name</label>
                  <input required type="text" value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl bg-[#071324]/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#E86524]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Guardian Phone</label>
                  <input required type="text" value={formData.guardianPhone} onChange={e => setFormData({...formData, guardianPhone: e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl bg-[#071324]/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#E86524]" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Guardian Email (Optional)</label>
              <input type="email" value={formData.guardianEmail} onChange={e => setFormData({...formData, guardianEmail: e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl bg-[#071324]/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#E86524]" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Previous School (Optional)</label>
              <input type="text" value={formData.previousSchool} onChange={e => setFormData({...formData, previousSchool: e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl bg-[#071324]/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-[#E86524]" />
            </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[#E86524] hover:bg-[#d2541a] text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-[#E86524]/30 hover:shadow-[#E86524]/50 transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
    </FigmaGeometricBackground>
  );
}