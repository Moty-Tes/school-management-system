'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function VerifyDocumentPage() {
  const { studentId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${apiUrl}/api/v1/verify/student/${studentId}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) setData(res.data);
        else setError(res.error.message);
      })
      .catch(() => setError('Failed to connect to the verification server.'))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Document</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-2xl w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Official Document Verification</p>
          <h1 className="text-3xl font-bold text-slate-900">Document Authenticated</h1>
        </div>

        {/* Certificate Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
          
          {/* Top Green Banner */}
          <div className="bg-emerald-500 p-6 flex items-center justify-center gap-3 text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="text-lg font-bold tracking-wide">AUTHENTIC & VERIFIED</span>
          </div>

          <div className="p-8 sm:p-12">
            {/* School Info */}
            <div className="flex flex-col items-center mb-10">
              {data.schoolLogo ? (
                <img src={data.schoolLogo} alt="Logo" className="w-16 h-16 object-contain mb-4" />
              ) : (
                <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center text-2xl font-bold mb-4">
                  {data.schoolName.charAt(0)}
                </div>
              )}
              <h2 className="text-xl font-bold text-slate-900">{data.schoolName}</h2>
            </div>

            {/* Student Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Student Name</p>
                <p className="font-bold text-slate-900 text-lg">{data.studentName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Admission Number</p>
                <p className="font-mono text-slate-700">{data.admissionNumber}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Class / Cohort</p>
                <p className="font-medium text-slate-900">{data.class}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${data.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  {data.status}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                This document was cryptographically verified by the {data.schoolName} Management System on <br/>
                <span className="font-semibold">{new Date(data.verifiedAt).toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by School Management System
        </p>
      </div>
    </div>
  );
}