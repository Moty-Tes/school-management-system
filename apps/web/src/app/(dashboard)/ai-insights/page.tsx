'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Sparkles, BrainCircuit, AlertTriangle, ShieldCheck, 
  TrendingDown, CheckCircle, ArrowRight, User, Filter, Calendar 
} from 'lucide-react';

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  useEffect(() => {
    async function loadInsights() {
      try {
        const students = await api.get<any[]>('/api/v1/students').catch(() => []);
        
        // Fetch risk score for each student in parallel
        const promises = students.map(async (student) => {
          try {
            const risk = await api.get<any>(`/api/v1/ai/risk/${student.id}`);
            return { student, risk };
          } catch {
            return { student, risk: null };
          }
        });

        const results = await Promise.all(promises);
        
        // Sort by highest risk first
        results.sort((a, b) => (b.risk?.riskScore || 0) - (a.risk?.riskScore || 0));
        
        setInsights(results.filter(r => r.risk !== null));
      } catch (e) {
        setInsights([]);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, []);

  const filtered = insights.filter(item => {
    if (filterLevel === 'ALL') return true;
    return item.risk?.riskLevel === filterLevel;
  });

  const highRiskCount = insights.filter(i => i.risk?.riskLevel === 'HIGH').length;
  const mediumRiskCount = insights.filter(i => i.risk?.riskLevel === 'MEDIUM').length;
  const lowRiskCount = insights.filter(i => i.risk?.riskLevel === 'LOW').length;

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 bg-gradient-to-r from-slate-950 via-[#131130] to-[#201036] text-white">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 mb-4 shadow-inner">
              <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
              <span>Predictive Student Analytics Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              AI Early Intervention & Risk Radar
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl font-medium">
              Multi-factor machine learning models evaluating classroom attendance patterns, score trends, and behavior logs to predict students needing academic assistance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/ptm"
              className="glass-button-primary inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider py-2.5 px-4"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Interventions</span>
            </Link>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Total Evaluated</span>
            <span className="text-2xl font-black text-white">{insights.length} students</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-rose-300 block">High Risk Attention</span>
            <span className="text-2xl font-black text-rose-400">{highRiskCount} cases</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-300 block">Moderate Watchlist</span>
            <span className="text-2xl font-black text-amber-400">{mediumRiskCount} cases</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-300 block">On-Track & Thriving</span>
            <span className="text-2xl font-black text-emerald-400">{lowRiskCount} students</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <button
            onClick={() => setFilterLevel('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterLevel === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Students ({insights.length})
          </button>
          <button
            onClick={() => setFilterLevel('HIGH')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterLevel === 'HIGH'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> High Risk ({highRiskCount})
          </button>
          <button
            onClick={() => setFilterLevel('MEDIUM')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterLevel === 'MEDIUM'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            Moderate ({mediumRiskCount})
          </button>
          <button
            onClick={() => setFilterLevel('LOW')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterLevel === 'LOW'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> On Track ({lowRiskCount})
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">Ranked by risk priority score</span>
      </div>

      {/* Insights Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass-card p-6 rounded-3xl animate-pulse space-y-4">
              <div className="h-6 bg-slate-200/60 rounded w-1/2"></div>
              <div className="h-4 bg-slate-200/40 rounded w-1/3"></div>
              <div className="h-16 bg-slate-200/50 rounded-2xl"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto border border-dashed border-slate-300">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Risk Flags in this Category</h3>
          <p className="text-xs text-slate-500 mt-1">All students matching this filter are in good standing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(({ student, risk }) => {
            const isHigh = risk.riskLevel === 'HIGH';
            const isMed = risk.riskLevel === 'MEDIUM';

            return (
              <motion.div
                key={student.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`glass-card rounded-3xl overflow-hidden border shadow-lg flex flex-col justify-between ${
                  isHigh 
                    ? 'border-rose-200/80 bg-gradient-to-b from-rose-50/40 to-white/90' 
                    : isMed 
                    ? 'border-amber-200/80 bg-gradient-to-b from-amber-50/40 to-white/90' 
                    : 'border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 to-white/90'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center text-white shadow-md ${
                        isHigh 
                          ? 'bg-gradient-to-tr from-rose-500 to-pink-600 shadow-rose-500/25' 
                          : isMed 
                          ? 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/25' 
                          : 'bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-emerald-500/25'
                      }`}>
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-400">{student.admissionNumber || 'STU-ID'}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isHigh 
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30' 
                        : isMed 
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30' 
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {risk.riskLevel}
                    </span>
                  </div>

                  {/* Metrics Bar */}
                  <div className="p-5 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-500">Attendance Rate</span>
                        <span className={risk.metrics.attendanceRate < 75 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                          {risk.metrics.attendanceRate}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${risk.metrics.attendanceRate < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, risk.metrics.attendanceRate)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-500">Average Grade</span>
                        <span className={risk.metrics.averageGrade < 60 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                          {risk.metrics.averageGrade}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${risk.metrics.averageGrade < 60 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                          style={{ width: `${Math.min(100, risk.metrics.averageGrade)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                      <span className="text-slate-500">Behavior Incidents:</span>
                      <span className="font-bold text-slate-800">{risk.metrics.negativeBehavior || 0} incidents</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="p-4 border-t border-slate-100 bg-white/50 flex items-center justify-between gap-2">
                  <Link
                    href={`/ptm`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Parent Meeting
                  </Link>
                  <Link
                    href={`/students/${student.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    Profile <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
