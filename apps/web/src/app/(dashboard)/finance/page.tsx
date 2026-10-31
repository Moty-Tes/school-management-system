'use client';

import { useEffect, useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { 
  CreditCard, Plus, DollarSign, Receipt, CheckCircle2, 
  AlertCircle, Calendar, Users, Search, Filter, Loader2, Sparkles, ArrowRight
} from 'lucide-react';
import { sonner } from '@/components/sonner';

interface StudentItem {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber?: string;
  class?: { name: string; section?: string };
}

interface Invoice {
  id: string;
  title: string;
  amount: string | number;
  status: 'PENDING' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  dueDate: string;
  student: { firstName: string; lastName: string; admissionNumber?: string };
  payments: { amount: string | number; method?: string; createdAt?: string }[];
}

interface ClassItem {
  id: string;
  name: string;
  section: string;
}

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');

  // Single Invoice Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({
    studentId: '',
    title: 'Tuition Fee - Term 1',
    amount: 5000,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Bulk Invoice Modal
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkData, setBulkData] = useState({ 
    classId: '', 
    title: 'Tuition Fee - Term 1', 
    amount: 15000, 
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Record Payment Modal
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentData, setPaymentData] = useState({ 
    amount: '', 
    method: 'CASH', 
    reference: '' 
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [invoicesData, classesData, studentsData] = await Promise.all([
        api.get<Invoice[]>('/api/v1/finance/invoices').catch(() => []),
        api.get<ClassItem[]>('/api/v1/classes').catch(() => []),
        api.get<StudentItem[]>('/api/v1/students').catch(() => [])
      ]);

      setInvoices(invoicesData || []);
      setClasses(classesData || []);
      setStudents(studentsData || []);

      if (classesData && classesData.length > 0 && !bulkData.classId) {
        setBulkData(prev => ({ ...prev, classId: classesData[0].id }));
      }
      if (studentsData && studentsData.length > 0 && !createData.studentId) {
        setCreateData(prev => ({ ...prev, studentId: studentsData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load finance data:', err);
      sonner.error('Failed to load invoice records');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // Create single invoice
  async function handleCreateInvoice(e: FormEvent) {
    e.preventDefault();
    if (!createData.studentId) {
      sonner.error('Please select a student');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      await api.post('/api/v1/finance/invoices', {
        studentId: createData.studentId,
        title: createData.title,
        amount: Number(createData.amount),
        dueDate: createData.dueDate,
      });

      sonner.success('Invoice created successfully!');
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Failed to create invoice:', err);
      sonner.error(err.message || 'Failed to create invoice');
    } finally {
      setIsSubmittingCreate(false);
    }
  }

  // Bulk generate invoices
  async function handleBulkGenerate(e: FormEvent) {
    e.preventDefault();
    if (!bulkData.classId) {
      sonner.error('Please select a class');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await api.post<{ count: number }>('/api/v1/finance/invoices/bulk', {
        classId: bulkData.classId,
        title: bulkData.title,
        amount: Number(bulkData.amount),
        dueDate: bulkData.dueDate,
      });

      sonner.success(`Successfully generated ${res?.count || 'class'} invoices!`);
      setIsBulkOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Failed to generate bulk invoices:', err);
      sonner.error(err.message || 'Failed to generate bulk invoices');
    } finally {
      setIsGenerating(false);
    }
  }

  // Record payment
  async function handleRecordPayment(e: FormEvent) {
    e.preventDefault();
    if (!payingInvoice) return;

    setIsSubmittingPayment(true);
    try {
      await api.post(`/api/v1/finance/invoices/${payingInvoice.id}/pay`, {
        amount: Number(paymentData.amount),
        method: paymentData.method,
        reference: paymentData.reference,
      });

      sonner.success('Payment recorded successfully!');
      setPayingInvoice(null);
      setPaymentData({ amount: '', method: 'CASH', reference: '' });
      loadData();
    } catch (err: any) {
      console.error('Payment failed:', err);
      sonner.error(err.message || 'Payment recording failed');
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  // Aggregate Calculations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => {
    const paid = inv.payments?.reduce((s, p) => s + Number(p.amount || 0), 0) || 0;
    return sum + paid;
  }, 0);
  const pendingBalance = Math.max(0, totalInvoiced - totalCollected);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const fullName = `${inv.student?.firstName || ''} ${inv.student?.lastName || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                          (inv.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || 
                          inv.status === statusFilter || 
                          (statusFilter === 'UNPAID' && (inv.status === 'PENDING' || inv.status === 'UNPAID'));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header Banner */}
      <div className="glass-card-dark rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/10">
              <Receipt className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tuition & Accounts Receivable</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Finance & Fee Management</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Track student school fees, issue tuition invoices, record payments, and audit balances.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 border border-white/10"
            >
              <span>⚡</span>
              <span>Bulk Invoices</span>
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 rounded-xl glass-button-primary font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-4">
            {totalInvoiced.toLocaleString()} <span className="text-sm font-semibold text-slate-500">ETB</span>
          </p>
          <p className="text-xs text-slate-400 font-medium mt-1">{invoices.length} total issued invoices</p>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected</span>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 mt-4">
            {totalCollected.toLocaleString()} <span className="text-sm font-semibold text-slate-500">ETB</span>
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">{collectionRate}% collection rate</p>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Balance</span>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-600 mt-4">
            {pendingBalance.toLocaleString()} <span className="text-sm font-semibold text-slate-500">ETB</span>
          </p>
          <p className="text-xs text-amber-600 font-semibold mt-1">Outstanding unpaid fees</p>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Students</span>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-4">{students.length}</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Enrolled student accounts</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or title..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm font-semibold"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto overflow-x-auto">
            {['ALL', 'UNPAID', 'PARTIAL', 'PAID'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === status
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices List Table Card */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Student Invoices</h2>
            <p className="text-xs text-slate-500 mt-0.5">Showing {filteredInvoices.length} invoices matching criteria.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm">Loading financial invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Invoices Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create an invoice for a student or generate bulk tuition fees for a class.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl glass-button-primary text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Invoice</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-6">Student</th>
                  <th className="py-3.5 px-4">Invoice Title</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Paid</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const paid = inv.payments?.reduce((s, p) => s + Number(p.amount || 0), 0) || 0;
                  const amt = Number(inv.amount || 0);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            {inv.student?.firstName?.charAt(0)}{inv.student?.lastName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {inv.student?.firstName} {inv.student?.lastName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {inv.student?.admissionNumber || 'Student'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-sm font-semibold text-slate-800">{inv.title}</p>
                        <p className="text-[11px] text-slate-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {amt.toLocaleString()} ETB
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className={paid > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                          {paid.toLocaleString()} ETB
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inv.status === 'PARTIAL'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        {inv.status !== 'PAID' ? (
                          <button
                            onClick={() => {
                              setPayingInvoice(inv);
                              setPaymentData({ 
                                amount: String(Math.max(0, amt - paid)), 
                                method: 'CASH', 
                                reference: '' 
                              });
                            }}
                            className="px-3.5 py-1.5 rounded-xl glass-button-primary text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                          >
                            <span>Record Payment</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL: CREATE INVOICE */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md p-6 rounded-3xl shadow-2xl"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span>Create Student Invoice</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">Issue a new fee charge for a specific student.</p>

              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Select Student
                  </label>
                  <select
                    required
                    value={createData.studentId}
                    onChange={(e) => setCreateData({ ...createData, studentId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold text-slate-800"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} {s.class ? `(${s.class.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Fee Title
                  </label>
                  <input
                    required
                    type="text"
                    value={createData.title}
                    onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                    placeholder="e.g. Tuition Fee - Term 1"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Amount (ETB)
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      value={createData.amount}
                      onChange={(e) => setCreateData({ ...createData, amount: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Due Date
                    </label>
                    <input
                      required
                      type="date"
                      value={createData.dueDate}
                      onChange={(e) => setCreateData({ ...createData, dueDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl glass-button-secondary text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCreate}
                    className="flex-1 px-4 py-2.5 rounded-xl glass-button-primary text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {isSubmittingCreate ? 'Creating...' : 'Create Invoice'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL: BULK INVOICES */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isBulkOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md p-6 rounded-3xl shadow-2xl"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <span>⚡</span>
                <span>Generate Bulk Invoices</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">Create tuition fee invoices for all students in an entire class at once.</p>

              <form onSubmit={handleBulkGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Target Class
                  </label>
                  <select
                    required
                    value={bulkData.classId}
                    onChange={(e) => setBulkData({ ...bulkData, classId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold text-slate-800"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section ? `(${c.section})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Invoice Title
                  </label>
                  <input
                    required
                    type="text"
                    value={bulkData.title}
                    onChange={(e) => setBulkData({ ...bulkData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Fee Amount (ETB)
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      value={bulkData.amount}
                      onChange={(e) => setBulkData({ ...bulkData, amount: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Due Date
                    </label>
                    <input
                      required
                      type="date"
                      value={bulkData.dueDate}
                      onChange={(e) => setBulkData({ ...bulkData, dueDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl glass-button-secondary text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="flex-1 px-4 py-2.5 rounded-xl glass-button-primary text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : 'Generate All'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL: RECORD PAYMENT */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {payingInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md p-6 rounded-3xl shadow-2xl"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Record Fee Payment</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Student: <span className="font-bold text-slate-800">{payingInvoice.student?.firstName} {payingInvoice.student?.lastName}</span>
              </p>

              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Payment Amount (ETB)
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-lg font-bold text-slate-900 text-center"
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Method
                    </label>
                    <select
                      value={paymentData.method}
                      onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-bold text-slate-800"
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="MOBILE_MONEY">Mobile Money</option>
                      <option value="CHECK">Check</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Reference / Receipt #
                    </label>
                    <input
                      type="text"
                      value={paymentData.reference}
                      onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                      placeholder="e.g. TXN-9842"
                      className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayingInvoice(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl glass-button-secondary text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="flex-1 px-4 py-2.5 rounded-xl glass-button-primary text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isSubmittingPayment ? 'Saving...' : 'Submit Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
