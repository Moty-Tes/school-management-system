'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PayrollPage() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Admin States
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);

  async function loadData() {
    setLoading(true);
    const meData: any = await getMe();
    const isAdmin = meData.roles?.includes('TENANT_ADMIN') || meData.roles?.includes('SUPER_ADMIN');
    setRole(isAdmin ? 'ADMIN' : 'TEACHER');

    try {
      if (isAdmin) {
        const data = await api.get<any[]>(`/api/v1/payroll/list?month=${month}&year=${year}`);
        setPayslips(data);
      } else {
        const data = await api.get<any[]>('/api/v1/payroll/me');
        setPayslips(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [month, year]);

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await api.post<any>('/api/v1/payroll/generate', { month, year });
      alert(`Generated ${res.count} new payslips!`);
      loadData();
    } catch (err) {
      alert('Failed to generate payroll');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleMarkPaid(id: string) {
    if (!window.confirm("Mark this payslip as PAID?")) return;
    await api.patch(`/api/v1/payroll/${id}/pay`);
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll & Salaries</h1>
          <p className="text-slate-500 text-sm mt-1">
            {role === 'ADMIN' ? 'Generate and manage staff payslips' : 'View your salary history'}
          </p>
        </div>
      </div>

      {/* ADMIN FILTERS */}
      {role === 'ADMIN' && (
        <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-700 mb-1">Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-700 mb-1">Year</label>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button onClick={handleGenerate} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {isGenerating ? 'Generating...' : 'Generate Payroll'}
          </button>
        </div>
      )}

      {/* PAYSLIPS TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
            <tr>
              {role === 'ADMIN' && <th className="py-3 px-4">Staff Name</th>}
              <th className="py-3 px-4">Period</th>
              <th className="py-3 px-4">Base Salary</th>
              <th className="py-3 px-4">Deductions</th>
              <th className="py-3 px-4 font-bold text-slate-900">Net Pay</th>
              <th className="py-3 px-4">Status</th>
              {role === 'ADMIN' && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading payroll data...</td></tr>
            ) : payslips.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-slate-400">No payslips found for this period.</td></tr>
            ) : (
              payslips.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  {role === 'ADMIN' && (
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {p.teacher.user.profile?.firstName} {p.teacher.user.profile?.lastName}
                    </td>
                  )}
                  <td className="py-3 px-4 text-slate-600">{MONTHS[p.month - 1]} {p.year}</td>
                  <td className="py-3 px-4 font-mono">{p.baseSalary.toLocaleString()} ETB</td>
                  <td className="py-3 px-4 font-mono text-red-600">-{p.deductions.toLocaleString()} ETB</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-base">{p.netPay.toLocaleString()} ETB</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status}
                    </span>
                  </td>
                  {role === 'ADMIN' && (
                    <td className="py-3 px-4 text-right">
                      {p.status === 'PENDING' && (
                        <button onClick={() => handleMarkPaid(p.id)} className="text-indigo-600 font-semibold text-xs hover:underline">Mark as Paid</button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}