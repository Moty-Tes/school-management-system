'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

interface Invoice {
  id: string;
  title: string;
  amount: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  dueDate: string;
  student: { firstName: string; lastName: string };
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
      showSuccessToast('Payment recorded successfully!');
      setPayingInvoice(null);
      setPaymentData({ amount: '', method: 'CASH', reference: '' });
      loadData();
    } catch (err) {
      showErrorToast('Payment failed. Please try again.');
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
      showSuccessToast(`Successfully generated ${res.count} invoices!`);
      setTimeout(() => {
        setIsBulkOpen(false);
        setBulkMessage('');
        loadData();
      }, 2000);
    } catch (err) {
      showErrorToast('Failed to generate invoices. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  // --- Toast & Feedback System ---
  function showSuccessToast(message: string) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-3';
    toastContainer.innerHTML = `
      <div className="bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-emerald-500/20 transform translate-y-0 transition-transform duration-500 ease-out">
        <svg className="w-5 h-5 -mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastContainer);

    setTimeout(() => {
      toastContainer.querySelector('div')!.className = 'bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-emerald-500/20 transform translate-y-0 transition-transform duration-500 ease-out';
    }, 10);

    setTimeout(() => {
      toastContainer.style.transform = 'translateY(-100%)';
      toastContainer.style.opacity = '0';
      setTimeout(() => toastContainer.remove(), 300);
    }, 3000);
  }

  function showErrorToast(message: string) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-3';
    toastContainer.innerHTML = `
      <div className="bg-red-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-red-500/20 transform translate-y-0 transition-transform duration-500 ease-out">
        <svg className="w-5 h-5 -mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116 21H8a2 2 0 01-2-1.858L5 7"></path></svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastContainer);

    setTimeout(() => {
      toastContainer.style.transform = 'translateY(-100%)';
      toastContainer.style.opacity = '0';
      setTimeout(() => toastContainer.remove(), 300);
    }, 3000);
  }

  return (
    <motion.div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance & Fees</h1>
          <p className="text-slate-500 text-sm mt-1">Track student invoices and payments</p>
        </div>

        <motion.button
          onClick={() => setIsBulkOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 flex items-center gap-2"
        >
          ⚡ Generate Bulk Invoices
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m6 4h12m0 0l-4 4m4-4l-4-4m0-6H4"></path>
          </svg>
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-lg shadow-slate-50/30 mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Class</label>
            <select className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12">
              <option value="" disabled>Select a class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Invoices Table */}
      <motion.div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg shadow-slate-50/30">
        <motion.table className="w-full text-left animate-in" style={{ transitionProperty: 'all', transitionDuration: '0.2s' }}>
          <motion.thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <motion.tr>
              <motion.th className="py-3 px-4">Student</motion.th>
              <motion.th className="py-3 px-4">Invoice Title</motion.th>
              <motion.th className="py-3 px-4">Amount</motion.th>
              <motion.th className="py-3 px-4">Status</motion.th>
              <motion.th className="py-3 px-4 text-right">Actions</motion.th>
            </motion.tr>
          </motion.thead>
          <motion.tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <motion.tr className="align-middle">
                <motion.td colSpan={5} className="py-8 text-center text-slate-400">
                  Loading...
                </motion.td>
              </motion.tr>
            ) : invoices.length === 0 ? (
              <motion.tr className="align-middle">
                <motion.td colSpan={5} className="py-8 text-center text-slate-400">
                  No invoices found.
                </motion.td>
              </motion.tr>
            ) : (
              invoices.map(inv => {
                const totalPaid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);

                return (
                  <motion.tr
                    key={inv.id}
                    initial {{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <motion.td className="py-3 px-4 font-medium">
                      {inv.student.firstName} {inv.student.lastName}
                    </motion.td>
                    <motion.td className="py-3 px-4">{inv.title}</motion.td>
                    <motion.td className="py-3 px-4 font-mono">
                      {Number(inv.amount).toLocaleString()} ETB
                      {totalPaid > 0 && totalPaid < Number(inv.amount) && (
                        <span className="block text-xs text-slate-400">Paid: {totalPaid.toLocaleString()}</span>
                      )}
                    </motion.td>
                    <motion.td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700'
                          : inv.status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {inv.status}
                      </span>
                    </motion.td>
                    <motion.td className="py-3 px-4 text-right">
                      {inv.status !== 'PAID' && (
                        <motion.button
                          onClick={() => setPayingInvoice(inv)}
                          className="text-primary-600 font-semibold text-xs hover:underline transition-colors"
                        >
                          Record Payment
                        </motion.button>
                      )}
                    </motion.td>
                  </motion.tr>
                )
              })
            )}
          </motion.tbody>
        </motion.table>
      </motion.div>

      {/* Record Payment Modal */}
      {payingInvoice && (
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
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m6 4h12m0 0l-4 4m4-4l-4-4m0-6H4"></path>
              </svg>
              Record Payment
            </h2>

            <div className="mb-6 p-4 bg-slate-50 rounded-xl">
              <p className="text-sm font-semibold">{payingInvoice.student.firstName} {payingInvoice.student.lastName}</p>
              <p className="text-xs text-slate-500">{payingInvoice.title} - {Number(payingInvoice.amount).toLocaleString()} ETB</p>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount (ETB)</label>
                <input
                  required
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. 5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12"
                >
                  <option value="CASH">Cash</option>
                  <option value="TELEBIRR">Telebirr</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reference (Optional)</label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Transaction ID"
                />
              </div>
              <div className="flex justify-end gap-3 pt-8 border-t">
                <motion.button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="px-5 py-3 text-sm font-medium bg-primary-600 text-white rounded-xl transition-all"
                >
                  Save Payment
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Bulk Invoice Modal */}
      {isBulkOpen && (
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
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m6 4h12m0 0l-4 4m4-4l-4-4m0-6H4"></path>
              </svg>
              Generate Bulk Invoices
            </h2>

            <p className="text-sm text-slate-500 mb-6">This will instantly bill every student in the selected class.</p>

            {bulkMessage && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium animate-bounce">
                {bulkMessage}
              </div>
            )}

            <form onSubmit={handleBulkGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Class</label>
                <select
                  required
                  value={bulkData.classId}
                  onChange={(e) => setBulkData({...bulkData, classId: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12"
                >
                  <option value="" disabled>Select a class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Title</label>
                <input
                  required
                  type="text"
                  value={bulkData.title}
                  onChange={(e) => setBulkData({...bulkData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. Term 1 Tuition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount per Student (ETB)</label>
                <input
                  required
                  type="number"
                  value={bulkData.amount}
                  onChange={(e) => setBulkData({...bulkData, amount: Number(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  required
                  type="date"
                  value={bulkData.dueDate}
                  onChange={(e) => setBulkData({...bulkData, dueDate: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 pt-8 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsBulkOpen(false)}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-3 text-sm font-medium bg-primary-600 text-white rounded-xl disabled:opacity-50 transition-all"
                >
                  {isGenerating ? 'Generating...' : 'Generate Invoices'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}