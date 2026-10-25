'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      const students = await api.get<any[]>('/api/v1/students');
      
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
      
      setInsights(results);
      setLoading(false);
    }
    loadInsights();
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse text-indigo-600 font-bold">Analyzing student data with AI...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold tracking-tight">AI Predictive Insights</h1>
        <p className="text-indigo-100 mt-2 max-w-2xl">
          Our AI engine analyzes attendance, grades, and behavior logs to predict dropout risk and help you intervene early. Students are ranked from highest risk to lowest.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.map(({ student, risk }) => {
          if (!risk) return null;
          
          const isHigh = risk.riskLevel === 'HIGH';
          const isMed = risk.riskLevel === 'MEDIUM';

          return (
            <div key={student.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className={`p-4 border-b flex justify-between items-center ${isHigh ? 'bg-red-50' : isMed ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-slate-800 shadow-sm">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{student.firstName} {student.lastName}</h3>
                    <p className="text-xs text-slate-500">{student.admissionNumber}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isHigh ? 'bg-red-600 text-white' : isMed ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                  {risk.riskLevel} RISK
                </span>
              </div>

              <div className="p-4 space-y-3 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Attendance</span>
                  <span className="font-bold text-slate-900">{risk.metrics.attendanceRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Average Grade</span>
                  <span className="font-bold text-slate-900">{risk.metrics.averageGrade}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Negative Behaviors</span>
                  <span className="font-bold text-slate-900">{risk.metrics.negativeBehavior}</span>
                </div>
              </div>

              <div className="p-4 border-t bg-slate-50">
                <Link href={`/students/${student.id}`} className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  View Student Profile
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}