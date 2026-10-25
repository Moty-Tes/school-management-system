'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

interface Invoice {
  id: string;
  title: string;
  amount: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  dueDate: string;
  student: { firstName: string, lastName: string };
  payments: { amount: string }[];
}

interface ClassItem {
  id: string;
  name: string;
  section: string;
}

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Record Payment Modal
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'CASH', reference: '' });

  // Bulk Invoice Modal
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkData, setBulkData] = useState({ classId: '', title: 'Term 1 Tuition', amount: 15000, dueDate: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [invoicesData, classesData] = await Promise.all([
        api.get<Invoice[]>('/api/v1/finance/invoices'),
        api.get<ClassItem[]>('/api/v1/classes')
      ]);
      setInvoices(invoicesData);
      setClasses(classesData);
      if (classesData.length > 0 && !bulkData.classId) {
        setBulkData(prev => ({ ...prev, classId: classesData[0].id }));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handlePayment(e: FormEvent) {
    e.preventDefault();
    if (!payingInvoice) return;
    
    try {
      await api.post(`/api/v1/finance/invoices/${payingInvoice.id}/pay`, {
        amount: Number(paymentData.amount),
        method: paymentData.method,
        reference: paymentData.reference,
      });
      setPayingInvoice(null);
      setPaymentData({ amount: '', method: 'CASH', reference: '' });
      loadData();
    } catch (err) {
      alert('Payment failed');
    }
  }

  async function handleBulkGenerate(e: FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    setBulkMessage('');
    
    try {
      const res = await api.post<{ count: number }>('/api/v1/finance/invoices/bulk', {
        classId: bulkData.classId,
        title: bulkData.title,
        amount: Number(bulkData.amount),
        dueDate: bulkData.dueDate,
      });
      setBulkMessage(`Successfully generated ${res.count} invoices!`);
      setTimeout(() => {
        setIsBulkOpen(false);
        setBulkMessage('');
        loadData();
      }, 2000);
    } catch (err) {
      setBulkMessage('Failed to generate invoices.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance & Fees</h1>
          <p className="text-slate-500 text-sm mt-1">Track student invoices and payments</p>
        </div>
        <button 
          onClick={() => setIsBulkOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          ⚡ Generate Bulk Invoices
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Invoice Title</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">No invoices found.</td></tr>
            ) : (
              invoices.map(inv => {
                const totalPaid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
                
                return (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{inv.student.firstName} {inv.student.lastName}</td>
                    <td className="py-3 px-4">{inv.title}</td>
                    <td className="py-3 px-4 font-mono">
                      {Number(inv.amount).toLocaleString()} ETB
                      {totalPaid > 0 && totalPaid < Number(inv.amount) && (
                        <span className="block text-xs text-slate-400">Paid: {totalPaid.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {inv.status !== 'PAID' && (
                        <button onClick={() => setPayingInvoice(inv)} className="text-indigo-600 font-semibold text-xs hover:underline">
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Record Payment</h2>
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-semibold">{payingInvoice.student.firstName} {payingInvoice.student.lastName}</p>
              <p className="text-xs text-slate-500">{payingInvoice.title} - {Number(payingInvoice.amount).toLocaleString()} ETB</p>
            </div>
            
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Amount (ETB)</label>
                <input required type="number" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. 5000" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Payment Method</label>
                <select value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="CASH">Cash</option>
                  <option value="TELEBIRR">Telebirr</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Reference (Optional)</label>
                <input type="text" value={paymentData.reference} onChange={e => setPaymentData({...paymentData, reference: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Transaction ID" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setPayingInvoice(null)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK INVOICE MODAL */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-2">Generate Bulk Invoices</h2>
            <p className="text-sm text-slate-500 mb-4">This will instantly bill every student in the selected class.</p>
            
            {bulkMessage && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">{bulkMessage}</div>}

            <form onSubmit={handleBulkGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Select Class</label>
                <select required value={bulkData.classId} onChange={e => setBulkData({...bulkData, classId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="" disabled>Select a class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Invoice Title</label>
                <input required type="text" value={bulkData.title} onChange={e => setBulkData({...bulkData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Term 1 Tuition" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Amount per Student (ETB)</label>
                <input required type="number" value={bulkData.amount} onChange={e => setBulkData({...bulkData, amount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Due Date</label>
                <input required type="date" value={bulkData.dueDate} onChange={e => setBulkData({...bulkData, dueDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsBulkOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" disabled={isGenerating} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {isGenerating ? 'Generating...' : 'Generate Invoices'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}