'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { motion } from 'framer-motion';
import { CheckCircle, X, Loader2, FolderAdd, Menu, Shield, Users, UserPlus, LogOut, Clock, Flag, Info, Trash2, Edit2, RefreshCw, MoneyBill, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PayrollPage() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();

  async function loadData() {
    try {
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
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load payroll data.',
          variant: 'destructive',
        });
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [month, year]);

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post<any>('/api/v1/payroll/generate', { month, year });
      toast({
        title: 'Payroll generated',
        description: `${res.count} new payslips have been generated successfully.`,
        variant: 'success',
      });
      setIsGenerating(false);
      loadData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate payroll. Please try again.',
        variant: 'destructive',
      });
      setIsGenerating(false);
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      await api.patch(`/api/v1/payroll/${id}/pay`);
      loadData();
      toast({
        title: 'Marked as paid',
        description: 'This payslip has been marked as paid.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to mark payslip as paid. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <motion.div className="min-h-screen bg-slate-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tighter">
              <MoneyBill className="w-5 h-5 text-emerald-600 mr-2" /> Payroll & Salaries
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {role === 'ADMIN' ? 'Generate and manage staff payslips' : 'View your salary history'}
            </p>
          </div>

          {role === 'ADMIN' && (
            <motion.button
              onClick={() => setIsGenerating(true)}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring" }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4" /> Generate Payroll
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
        className="px-6 py-8 lg:px-12"
      >
        {/* Admin Filters */}
        {role === 'ADMIN' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 mb-8"
            style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
          >
            <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-4">Payroll Period</h2>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <motion.div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-3 pr-12 cursor-pointer"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </motion.div>

              <motion.div>
                <motion.button
                  onClick={handleGenerate}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring" }}
                  disabled={isGenerating}
                  className="px-6 py-3 text-sm font-medium bg-indigo-600 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Payroll'}
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Payslips Table */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-3xl shadow-slate-50/30"
          style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="border-b border-slate-200"
          >
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  {role === 'ADMIN' && (
                    <th className="py-4 px-6">Staff Name</th>
                  )}
                  <th className="py-4 px-4">Period</th>
                  <th className="py-4 px-4">Base Salary</th>
                  <th className="py-4 px-4">Deductions</th>
                  <th className="py-4 px-4 font-bold text-slate-900">Net Pay</th>
                  <th className="py-4 px-4">Status</th>
                  {role === 'ADMIN' && (
                    <th className="py-4 px-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <motion.tr>
                    <motion.td colSpan={role === 'ADMIN' ? 7 : 5} className="py-8 text-center text-slate-400">
                      Loading payroll data...
                    </motion.td>
                  </motion.tr>
                ) : payslips.length === 0 ? (
                  <motion.tr>
                    <motion.td colSpan={role === 'ADMIN' ? 7 : 5} className="py-8 text-center text-slate-500">
                      No payslips found for this period.
                    </motion.td>
                  </motion.tr>
                ) : (
                  payslips.map((p) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: -10, x: -20 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {role === 'ADMIN' && (
                        <motion.td className="py-4 px-4 font-medium text-slate-900">
                          {p.teacher.user.profile?.firstName} {p.teacher.user.profile?.lastName}
                        </motion.td>
                      )}

                      <motion.td className="py-4 px-4">
                        {MONTHS[p.month - 1]} {p.year}
                      </motion.td>

                      <motion.td className="py-4 px-4 font-mono">
                        {p.baseSalary.toLocaleString()} ETB
                      </motion.td>

                      <motion.td className="py-4 px-4 font-mono text-red-600">
                        -{p.deductions.toLocaleString()} ETB
                      </motion.td>

                      <motion.td className="py-4 px-4 font-mono font-bold text-emerald-600 text-base">
                        {p.netPay.toLocaleString()} ETB
                      </motion.td>

                      <motion.td className="py-4 px-4">
                        <span className={`
                          px-2.5 py-1 rounded-full text-xs font-bold
                          ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
                        `}>
                          {p.status}
                        </span>
                      </motion.td>

                      {role === 'ADMIN' && (
                        <motion.td className="py-4 px-4 text-right">
                          {p.status === 'PENDING' && (
                            <motion.button
                              onClick={() => handleMarkPaid(p.id)}
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: "spring" }}
                              className="text-indigo-600 font-semibold text-xs hover:underline transition-colors"
                            >
                              Mark as Paid
                            </motion.button>
                          )}
                        </motion.td>
                      )}
                    </motion.tr>
                  ))}
                )}
              </tbody>
            </table>
          </motion.div>
        </motion.div>

        {/* No payslips state */}
        {role === 'ADMIN' && loading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-8 text-center text-slate-500"
          >
            <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
            <p>Loading payroll data...</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}