'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { CheckCircle, X, Loader2, FolderAdd, Menu, GraduationCap, Shield, Clock, Users, CreditCard, Banknote, LogOut, Upload, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ParentPortal() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [studentClubs, setStudentClubs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [topUpAmount, setTopUpAmount] = useState(100);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [viewInvoices, setViewInvoices] = useState(false);

  const { toast } = useToast();

  async function loadChildData(childId: string) {
    const [walletData, logsData, clubsData, invoicesData] = await Promise.all([
      api.get(`/api/v1/cafeteria/wallet/${childId}`),
      api.get(`/api/v1/dailylogs/student/${childId}`),
      api.get(`/api/v1/clubs/student/${childId}`),
      api.get(`/api/v1/finance/invoices?studentId=${childId}`)
    ]);
    setWallet(walletData);
    setDailyLogs(logsData);
    setStudentClubs(clubsData);
    setInvoices(invoicesData);
  }

  async function loadData() {
    try {
      const childrenData = await api.get<any[]>('/api/v1/parents/my-children');
      setChildren(childrenData);
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
        await loadChildData(childrenData[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleChildChange(childId: string) {
    const child = children.find((c: any) => c.id === childId);
    setSelectedChild(child);
    if (child) await loadChildData(child.id);
  }

  async function handleTopUp() {
    if (!selectedChild) return;
    try {
      await api.post('/api/v1/cafeteria/wallet/topup', { studentId: selectedChild.id, amount: topUpAmount });
      setIsTopUpOpen(false);
      toast({
        title: 'Wallet topped up',
        description: `ETB ${topUpAmount} has been added to ${selectedChild.firstName}'s cafeteria wallet.`,
        variant: 'success',
      });
      await loadChildData(selectedChild.id);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to top up wallet. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handlePayInvoice(invId: string) {
    if (!selectedChild) return;
    try {
      await api.post(`/api/v1/finance/invoices/${invId}/pay`, { studentId: selectedChild.id });
      toast({
        title: 'Payment successful',
        description: 'Invoice payment has been recorded successfully.',
        variant: 'success',
      });
      await loadChildData(selectedChild.id);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to process payment. Please try again.',
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
              <Users className="w-5 h-5 text-indigo-600 mr-2" /> Parent Portal
            </h1>
            <p className="text-slate-500 text-sm mt-1">Monitor your children's daily school life</p>
          </div>

          {children.length > 1 && (
            <motion.select
              onChange={(e: any) => handleChildChange(e.target.value)}
              value={selectedChild?.id}
              className="bg-white px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer transition-colors"
              style={{ transition: 'all 0.3s ease' }}
            >
              {children.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </motion.select>
          )}

          <motion.button
            onClick={() => setIsTopUpOpen(true)}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring" }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4" /> Wallet
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
        {children.length === 0 ? (
          <motion.div
            className="bg-white rounded-3xl border border-slate-200 p-8 shadow-3xl shadow-slate-50/30 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
            <p className="text-slate-500 text-lg">No students linked to your account.</p>
          </motion.div>
        ) : (
          children.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT COLUMN: Profile, Wallet, Invoices */}
            <div className="space-y-6 lg:col-span-1">

              {/* Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30"
                style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {selectedChild?.firstName?.[0]}{selectedChild?.lastName?.[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedChild?.firstName} {selectedChild?.lastName}</h2>
                    <p className="text-sm text-slate-500 font-mono">{selectedChild?.admissionNumber}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Class</span>
                    <span className="font-medium">{selectedChild?.class?.name ? `${selectedChild.class.name} - ${selectedChild.class.section}` : 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Status</span>
                    <span className="font-medium text-emerald-600">Active</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-slate-500">Admission Date</span>
                    <span className="font-medium text-slate-400">{selectedChild?.createdAt ? new Date(selectedChild.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </motion.div>

              {/* Wallet Card */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                className="bg-slate-950 p-6 rounded-3xl shadow-2xl text-white"
                style={{ transition: 'all 0.3s ease' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cafeteria Wallet</p>
                  <Shield className="w-6 h-6 text-indigo-400" />
                </div>

                <div className="text-4xl font-bold mb-2">
                  {wallet ? Number(wallet.balance).toLocaleString() : '0'}
                  <span className="text-sm text-slate-400"> ETB</span>
                </div>

                <p className="text-sm text-slate-400 mb-4">Balance for cafeteria meals and school purchases</p>

                <div className="border-t pt-4">
                  <button
                    onClick={() => setIsTopUpOpen(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors"
                  >
                    + Top Up
                  </button>
                </div>
              </motion.div>

              {/* Tuition Invoices */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30"
                style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
              >
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Tuition Invoices</h3>

                <div className="space-y-3">
                  {invoices.length === 0 ? (
                    <p className="text-sm text-emerald-600 font-medium">All fees are fully paid! 🎉</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {invoices.map((inv: any) => {
                        const isPaid = inv.status === 'PAID';
                        const statusBg = isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
                        const statusText = isPaid ? 'Paid' : 'Unpaid';

                        return (
                          <motion.div
                            key={inv.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                            className={`p-4 rounded-lg border ${
                              isPaid ? 'border-emerald-200' : 'border-red-200'
                            } ${statusBg}`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-bold text-slate-900 text-sm">{inv.title}</p>
                              <span className="text-[10px] bg-${isPaid ? 'emerald-100' : 'red-100'} text-${isPaid ? 'emerald-700' : 'red-700'} px-2 py-0.5 rounded font-bold">{statusText}</span>
                            </div>
                            <p className="text-lg text-${isPaid ? 'emerald-600' : 'red-600'} font-bold mb-3">
                              {Number(inv.amount).toLocaleString()} ETB
                            </p>
                            <motion.button
                              onClick={() => handlePayInvoice(inv.id)}
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: "spring" }}
                              className={`w-full bg-${isPaid ? 'emerald-600' : 'red-600'} text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-${isPaid ? 'emerald-700' : 'red-700'} transition-colors`}
                            >
                              {isPaid ? 'Paid' : 'Pay Now'}
                            </motion.button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Clubs */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30"
                style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
              >
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Clubs & Activities</h3>

                <div className="space-y-3">
                  {studentClubs.length === 0 ? (
                    <p className="text-sm text-slate-500">Not enrolled in any clubs.</p>
                  ) : (
                    studentClubs.map((sc: any) => (
                      <motion.div
                        key={sc.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                        className="p-4 border rounded-lg bg-indigo-50/50 flex justify-between items-center"
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{sc.club.name}</p>
                          <p className="text-[10px] text-slate-500">Advisor: {sc.club.advisorName}</p>
                        </div>
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{sc.role}</span>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN: Daily Diary */}
            <div className="lg:col-span-2 space-y-6">

              {/* Daily Diary Section */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30"
                style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
              >
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" /> Daily School Diary
                </h3>

                {dailyLogs.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="p-12 text-center text-slate-500"
                  >
                    <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
                    <p>No diary entries yet.</p>
                  </motion.div>
                ) : (
                  <motion.div className="relative border-l-2 border-indigo-100 ml-3 space-y-8">
                    {dailyLogs.map((log: any) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: -10, x: -20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                        className="relative pl-6 space-y-6"
                        style={{ transition: 'all 0.3s ease' }}
                      >
                        <div className="absolute -left-2 top-2 w-5 h-5 rounded-full bg-indigo-500 border-4 border-white shadow"></div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
                          className="bg-slate-50 p-5 rounded-xl border border-slate-100"
                          style={{ transition: 'all 0.3s ease' }}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <motion.p
                              className="text-sm font-bold text-slate-900"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              {new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </motion.p>
                            <span className="text-xs text-slate-400">
                              Logged by {log.teacher?.user?.profile?.firstName || 'Unknown'}
                            </span>
                          </div>

                          <motion.div
                            className="flex gap-4 mb-3"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
                          >
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
                              className="bg-white px-3 py-1.5 rounded-lg border text-xs shadow-sm"
                            >
                              <span className="text-slate-400">Mood:</span>
                              <span className="font-bold text-slate-900">{log.mood}</span>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
                              className="bg-white px-3 py-1.5 rounded-lg border text-xs shadow-sm"
                            >
                              <span className="text-slate-400">Appetite:</span>
                              <span className="font-bold text-slate-900">{log.appetite}</span>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
                              className="bg-white px-3 py-1.5 rounded-lg border text-xs shadow-sm"
                            >
                              <span className="text-slate-400">Participation:</span>
                              <span className="font-bold text-slate-900">{log.participation}</span>
                            </motion.div>
                          </motion.div>

                          {log.homework && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
                              className="bg-amber-50 border border-amber-100 p-3 rounded-lg mb-3"
                              style={{ transition: 'all 0.2s ease' }}
                            >
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                className="text-xs font-bold text-amber-800 mb-1"
                              >
                                📚 Homework:
                              </motion.p>
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                className="text-sm text-amber-900"
                              >
                                {log.homework}
                              </motion.p>
                            </motion.div>
                          )}

                          {log.notes && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ type: "spring", stiffness: 300 }}
                              className="text-sm text-slate-600 italic"
                            >
                              "{log.notes}"
                            </motion.p>
                          )}
                        </motion.div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Bottom action bar */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                  className="pt-6 border-t border-slate-200"
                >
                  <motion.p
                    className="text-sm text-slate-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    Keep checking for daily updates on your child's school life!
                  </motion.p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>

      {/* TOP UP MODAL */}
      {isTopUpOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          whileHover={{ opacity: 0.9 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-3xl w-full max-w-sm p-8 shadow-3xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-500" /> Top Up Wallet
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (ETB)</label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Math.max(10, Number(e.target.value)))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsTopUpOpen(false)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring" }}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleTopUp}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring" }}
                  className="px-5 py-3 text-sm font-medium bg-indigo-600 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  {topUpAmount < 10 ? 'Amount too low' : 'Confirm Payment'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}