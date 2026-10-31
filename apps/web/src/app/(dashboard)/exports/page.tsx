'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, Users, Receipt, Calendar, GraduationCap, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportsPage() {
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  function downloadFile(endpoint: string, label: string) {
    try {
      toast.info(`Generating ${label} export...`);
      window.open(endpoint, '_blank');
    } catch {
      toast.error('Failed to initiate download');
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 bg-gradient-to-r from-slate-950 via-[#131130] to-[#1c1236] text-white">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 mb-4 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Official Reporting & Data Export</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Audit Data & Ledger Exports
          </h1>
          <p className="text-slate-300 text-sm mt-1.5 max-w-2xl font-medium">
            Generate Excel-compatible CSV exports for regulatory compliance, ministry audits, offline accounting, and parent communications.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* STUDENT ROSTER EXPORT */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glow-card-indigo rounded-3xl p-6 flex flex-col justify-between shadow-lg"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center mb-4 shadow-md shadow-indigo-500/25">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Student Roster</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
              Export all enrolled student records, class streams, admission numbers, and parent contact information.
            </p>
          </div>
          <button 
            onClick={() => downloadFile('/api/v1/exports/students', 'Student Roster')}
            className="w-full glass-button-primary font-bold text-xs uppercase tracking-wider py-3 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </motion.div>

        {/* FINANCE EXPORT */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glow-card-emerald rounded-3xl p-6 flex flex-col justify-between shadow-lg"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center mb-4 shadow-md shadow-emerald-500/25">
              <Receipt className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Finance Ledger</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
              Complete fee accounting audit including issued invoices, recorded payments, payment methods, and pending dues.
            </p>
          </div>
          <button 
            onClick={() => downloadFile('/api/v1/exports/finance', 'Financial Ledger')}
            className="w-full bg-gradient-to-tr from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </motion.div>

        {/* ATTENDANCE EXPORT */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glow-card-amber rounded-3xl p-6 flex flex-col justify-between shadow-lg"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mb-4 shadow-md shadow-amber-500/25">
              <Calendar className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Daily Attendance</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Export daily attendance register by date to analyze absences and tardiness.
            </p>
            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Target Date</label>
              <input 
                type="date" 
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full glass-input text-xs font-semibold"
              />
            </div>
          </div>
          <button 
            onClick={() => downloadFile(`/api/v1/exports/attendance?date=${attendanceDate}`, 'Daily Attendance')}
            className="w-full bg-gradient-to-tr from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
