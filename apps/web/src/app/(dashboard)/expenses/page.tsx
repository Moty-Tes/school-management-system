'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

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
    await api.post('/api/v1/expenses', { ...formData, amount: Number(formData.amount) });
    setIsModalOpen(false);
    setFormData({ title: '', category: 'UTILITIES', amount: 0, vendorName: '', date: new Date().toISOString().split('T')[0], notes: '' });
    loadData();
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading expenses...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">School Expenses</h1>
          <p className="text-slate-500 text-sm mt-1">Track money flowing out of the school</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Record Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Expenses</p>
          <p className="text-3xl font-bold mt-2 text-red-400">{summary?.total.toLocaleString()} ETB</p>
        </div>
        {summary?.byCategory.map((cat: any) => (
          <div key={cat.category} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cat.category}</p>
            <p className="text-2xl font-bold mt-2 text-slate-900">{cat.total.toLocaleString()} ETB</p>
          </div>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Vendor</th>
              <th className="py-3 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {expenses.map(ex => (
              <tr key={ex.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-500">{new Date(ex.date).toLocaleDateString()}</td>
                <td className="py-3 px-4 font-medium text-slate-900">{ex.title}</td>
                <td className="py-3 px-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{ex.category}</span></td>
                <td className="py-3 px-4 text-slate-600">{ex.vendorName || '-'}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-red-600">-{Number(ex.amount).toLocaleString()} ETB</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Record Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Bought 500 Textbooks" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="UTILITIES">Utilities (Water/Electric)</option>
                    <option value="SALARIES">Salaries & Wages</option>
                    <option value="BOOKS">Books & Supplies</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="TRANSPORT">Transport & Fuel</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Amount (ETB)</label>
                  <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Vendor/Supplier</label>
                  <input type="text" value={formData.vendorName} onChange={e => setFormData({...formData, vendorName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Date</label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Notes</label>
                <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}