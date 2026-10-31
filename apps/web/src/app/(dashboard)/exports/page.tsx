'use client';

import { useState } from 'react';

export default function ExportsPage() {
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  function downloadFile(endpoint: string) {
    // We use window.open because the backend sends a file download stream
    window.open(`${apiUrl}${endpoint}`, '_blank');
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Data Export Center</h1>
        <p className="text-slate-500 text-sm mt-1">Download school data as Excel-compatible CSV files</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* STUDENT EXPORT */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Student Roster</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">Download all active students, their classes, and guardian contact details.</p>
          </div>
          <button 
            onClick={() => downloadFile('/api/v1/exports/students')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-colors"
          >
            Download CSV
          </button>
        </div>

        {/* FINANCE EXPORT */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Finance Ledger</h2>
            <p className="text-sm text-slate-500 mt-1 mb-6">Download all invoices, payments, and outstanding balances for accounting.</p>
          </div>
          <button 
            onClick={() => downloadFile('/api/v1/exports/finance')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors"
          >
            Download CSV
          </button>
        </div>

        {/* ATTENDANCE EXPORT */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Daily Attendance</h2>
            <p className="text-sm text-slate-500 mt-1 mb-4">Download the attendance sheet for a specific day.</p>
            <input 
              type="date" 
              value={attendanceDate} 
              onChange={e => setAttendanceDate(e.target.value)} 
              className="w-full px-3 py-2 border rounded-lg text-sm mb-4 font-mono"
            />
          </div>
          <button 
            onClick={() => downloadFile(`/api/v1/exports/attendance?date=${attendanceDate}`)}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition-colors"
          >
            Download CSV
          </button>
        </div>

      </div>
    </div>
  );
}