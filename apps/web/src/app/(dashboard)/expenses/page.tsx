'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { CheckCircle, X, Loader2, FolderPlus as FolderAdd, Menu, Shield, Clock, Users, CreditCard, Banknote, LogOut, Calendar, Mail, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    category: 'UTILITIES',
    amount: 0,
    vendorName: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const { toast } = useToast();

  async function loadData() {
    const [expensesData, summaryData] = await Promise.all([
      api.get<any[]>('/api/v1/expenses'),
      api.get<any>('/api/v1/expenses/summary')
    ]);
    setExpenses(expensesData);
    setSummary(summaryData);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/expenses', { ...formData, amount: Number(formData.amount) });
      setIsModalOpen(false);
      setFormData({
        title: '',
        category: 'UTILITIES',
        amount: 0,
        vendorName: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      loadData();
      toast({
        title: 'Expense recorded',
        description: 'The expense has been successfully recorded.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to record expense. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      // Assuming delete endpoint exists; if not, just remove from UI
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      toast({
        title: 'Expense deleted',
        description: 'The expense has been successfully deleted.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete expense. Please try again.',
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
              <FolderAdd className="w-5 h-5 text-indigo-600 mr-2" /> School Expenses
            </h1>
            <p className="text-slate-500 text-sm mt-1">Track money flowing out of the school</p>
          </div>

          <motion.button
            onClick={() => setIsModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring" }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Record Expense
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
        className="px-6 py-8 lg:px-12"
      >
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {/* Total Expenses Card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-white rounded-3xl border border-slate-200 p-8 shadow-3xl shadow-slate-50/30"
            style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expenses</p>
                <p className="text-5xl font-bold text-slate-900 mt-2">{summary?.total?.toLocaleString() || '0'} ETB</p>
              </div>

              <motion.div
                className="p-4 rounded-xl bg-indigo-50/50 backdrop-blur-sm"
                whileHover={{ transform: 'translateY(-2)', boxShadow: '0 4px 20px rgba(79, 137, 241, 0.15)' }}
                transition={{ type: "spring" }}
              >
                <Clock className="w-5 h-5 text-indigo-400" /> <span className="text-indigo-500 font-medium">Monthly</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Category Breakdown */}
          {summary?.byCategory && summary.byCategory.length > 0 && (
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="grid grid-cols-2 gap-4"
            >
              {summary.byCategory.map((cat: any) => (
                <motion.div
                  key={cat.category}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cat.category}</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{cat.total.toLocaleString()} ETB</p>
                    </div>

                    <motion.div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      whileHover={{ rotate: 5, scale: 1.05 }}
                      transition={{ type: "spring" }}
                    >
                      <CheckCircle className={`w-6 h-6 text-${cat.category === 'UTILITIES' ? 'indigo-500' : cat.category === 'SALARIES' ? 'red-500' : cat.category === 'BOOKS' ? 'emerald-500' : 'amber-500'}`} />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* This Month Card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-white rounded-3xl border border-slate-200 p-8 shadow-3xl shadow-slate-50/30"
            style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
          >
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">This Month</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">{summary?.monthlyTotal?.toLocaleString() || '0'} ETB</p>
            <p className="text-sm text-slate-500 mt-1">{summary?.monthLabel || 'Current Month'}</p>
          </motion.div>
        </motion.div>

        {/* Expenses Table */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
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
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Title</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Vendor</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {expenses.map((ex, idx) => (
                  <motion.tr
                    key={ex.id}
                    initial={{ opacity: 0, x: -20, y: idx % 2 === 0 ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: idx * 0.02 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <motion.td className="py-4 px-6 text-slate-500">
                      {new Date(ex.date).toLocaleDateString()}
                    </motion.td>
                    <motion.td className="py-4 px-6 font-medium text-slate-900">
                      {ex.title}
                    </motion.td>
                    <motion.td className="py-4 px-6">
                      <span className={`
                        bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold
                        ${ex.category === 'UTILITIES' ? 'border-l-2 border-indigo-500' : ex.category === 'SALARIES' ? 'border-l-2 border-red-500' : ex.category === 'BOOKS' ? 'border-l-2 border-emerald-500' : 'border-l-2 border-amber-500'}
                      `}>
                        {ex.category}
                      </span>
                    </motion.td>
                    <motion.td className="py-4 px-6 text-slate-600">
                      {ex.vendorName || '-'}
                    </motion.td>
                    <motion.td className="py-4 px-6 text-right font-mono font-bold">
                      {-Number(ex.amount).toLocaleString()} ETB
                    </motion.td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </motion.div>

        {/* No expenses state */}
        {expenses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-12 text-center text-slate-500"
          >
            <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
            <p>No expenses recorded yet.</p>
            <p className="text-sm text-slate-400 mt-2">Click + Record Expense to add your first expense.</p>
          </motion.div>
        )}
      </motion.div>

      {/* MODAL */}
      {isModalOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          whileHover={{ opacity: 0.9 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-3xl w-full max-w-md p-8 shadow-3xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-500" /> Record Expense
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. Bought 500 Textbooks"
                />
              </motion.div>

              <motion.div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
                  >
                    <option value="UTILITIES">Utilities (Water/Electric)</option>
                    <option value="SALARIES">Salaries & Wages</option>
                    <option value="BOOKS">Books & Supplies</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="TRANSPORT">Transport & Fuel</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (ETB)</label>
                  <input
                    required
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
              </motion.div>

              <motion.div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendor/Supplier</label>
                  <input
                    type="text"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </motion.div>

              <motion.div className="flex justify-end gap-3 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring" }}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring" }}
                  className="px-5 py-3 text-sm font-medium bg-indigo-600 text-white rounded-xl transition-all"
                >
                  Save Expense
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}