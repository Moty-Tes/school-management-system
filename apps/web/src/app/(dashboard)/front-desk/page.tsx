'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { CheckCircle, X, Loader2, FolderPlus as FolderAdd, Menu, Shield, Users, UserPlus, LogOut, Clock, Flag, Info, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function FrontDeskPage() {
  const [activeTab, setActiveTab] = useState<'visitors' | 'gatepasses'>('visitors');
  const [visitors, setVisitors] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisitorOpen, setIsVisitorOpen] = useState(false);
  const [isPassOpen, setIsPassOpen] = useState(false);

  const { toast } = useToast();

  async function loadData() {
    const [visitorData, passData] = await Promise.all([
      api.get<any[]>('/api/v1/frontdesk/visitors'),
      api.get<any[]>('/api/v1/frontdesk/gate-passes')
    ]);
    setVisitors(visitorData);
    setGatePasses(passData);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleLogVisitor(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/frontdesk/visitors', visitorForm);
      setIsVisitorOpen(false);
      setVisitorForm({ name: '', phone: '', purpose: '', hostName: '' });
      loadData();
      toast({
        title: 'Visitor logged',
        description: 'Visitor has been successfully checked in.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to log visitor. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleCheckoutVisitor(id: string) {
    try {
      await api.patch(`/api/v1/frontdesk/visitors/${id}/checkout`);
      loadData();
      toast({
        title: 'Visitor checked out',
        description: 'Visitor has been successfully checked out.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to check out visitor. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleCreatePass(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/frontdesk/gate-passes', passForm);
      setIsPassOpen(false);
      setPassForm({ admissionNumber: '', reason: '', releasedTo: '', approvedBy: '' });
      loadData();
      toast({
        title: 'Gate pass approved',
        description: 'Gate pass has been approved and logged.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to approve gate pass.',
        variant: 'destructive',
      });
    }
  }

  async function handleReturnStudent(id: string) {
    try {
      await api.patch(`/api/v1/frontdesk/gate-passes/${id}/return`);
      loadData();
      toast({
        title: 'Student returned',
        description: 'Student has been marked as returned.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to mark student as returned. Please try again.',
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
              <Shield className="w-5 h-5 text-indigo-600 mr-2" /> Front Desk & Security
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage visitors and student early departures</p>
          </div>

          <motion.button
            onClick={() => setActiveTab('visitors') === 'visitors' ? setIsVisitorOpen(true) : setIsPassOpen(true)}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring" }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
          >
            <FolderAdd className="w-4 h-4" /> Log Visitor
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
        className="px-6 py-4 border-b border-slate-200"
      >
        <div className="flex gap-4 border-b">
          <motion.button
            onClick={() => setActiveTab('visitors')}
            whileHover={{ scale: 1.02, background: 'var(--hover-bg)' }}
            transition={{ type: "spring" }}
            className={`pb-2 px-2 text-sm font-medium ${
              activeTab === 'visitors'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-indigo-600'
            } transition-colors`}
          >
            Active Visitors
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('gatepasses')}
            whileHover={{ scale: 1.02, background: 'var(--hover-bg)' }}
            transition={{ type: "spring" }}
            className={`pb-2 px-2 text-sm font-medium ${
              activeTab === 'gatepasses'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-indigo-600'
            } transition-colors`}
          >
            Students Off-Campus
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
        className="px-6 py-8 lg:px-12"
      >
        {/* Visitors Tab */}
        {activeTab === 'visitors' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="space-y-6"
          >
            {visitors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="p-12 text-center text-slate-500"
              >
                <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
                <p>No active visitors on campus.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visitors.map((v: any) => (
                  <motion.div
                    key={v.id}
                    whileHover={{ y: -6, scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40"
                    style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{v.name}</h3>
                        <p className="text-sm text-slate-500 mb-2">
                          <span className="font-semibold">Purpose:</span> {v.purpose}
                        </p>
                        <p className="text-sm text-slate-600">
                          <span className="font-semibold">Visiting:</span> {v.hostName || 'General'}
                        </p>
                        <p className="text-xs text-slate-500">
                          <span className="font-semibold">Check-in:</span> {new Date(v.checkInTime).toLocaleTimeString()}
                        </p>
                      </div>

                      <motion.div className="p-4 rounded-xl bg-indigo-50/50 backdrop-blur-sm">
                        <UserPlus className="w-4 h-4 text-indigo-400" />
                        <p className="text-xs text-indigo-600">Active visitor</p>
                      </motion.div>

                      <motion.button
                        onClick={() => handleCheckoutVisitor(v.id)}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring" }}
                        className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-lg text-sm font-medium transition-all duration-300"
                      >
                        Check Out
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* No visitors state */}
            {visitors.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="p-12 text-center text-slate-500"
              >
                <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
                <p>No active visitors on campus.</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Gate Passes Tab */}
        {activeTab === 'gatepasses' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="space-y-6"
          >
            {gatePasses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="p-12 text-center text-slate-500"
              >
                <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
                <p>No students are currently out of school.</p>
              </motion.div>
            ) : (
              <motion.div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-3xl shadow-slate-50/30">
                <motion.div className="animate-in" style={{ transitionProperty: 'all', transitionDuration: '0.2s' }}>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
                      <tr>
                        <th className="py-4 px-6">Student</th>
                        <th className="py-4 px-4">Reason</th>
                        <th className="py-4 px-4">Released To</th>
                        <th className="py-4 px-4">Exit Time</th>
                        <th className="py-4 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {gatePasses.map((p: any) => (
                        <motion.tr
                          key={p.id}
                          initial={{ opacity: 0, y: -10, x: -20 }}
                          animate={{ opacity: 1, y: 0, x: 0 }}
                          transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <motion.td className="py-4 px-6 font-medium text-slate-900">
                            {p.student.firstName} {p.student.lastName}
                          </motion.td>
                          <motion.td className="py-4 px-4 text-slate-600">{p.reason}</motion.td>
                          <motion.td className="py-4 px-4 text-slate-600">{p.releasedTo}</motion.td>
                          <motion.td className="py-4 px-4 font-mono text-slate-500">
                            {new Date(p.exitTime).toLocaleTimeString()}
                          </motion.td>
                          <motion.td className="py-4 px-4 text-right">
                            <motion.button
                              onClick={() => handleReturnStudent(p.id)}
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: "spring" }}
                              className="text-emerald-600 hover:text-emerald-800 text-sm font-medium hover:underline transition-colors"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" /> Mark Returned
                            </motion.button>
                          </motion.td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              </motion.div>
            )}

            {/* Empty state for gate passes */}
            {gatePasses.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="p-12 text-center text-slate-500"
              >
                <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
                <p>No students are currently out of school.</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* LOG VISITOR MODAL */}
      {isVisitorOpen && (
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
              <UserPlus className="w-5 h-5 text-indigo-500" /> Log New Visitor
            </h2>

            <form onSubmit={handleLogVisitor} className="space-y-5">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Visitor Name</label>
                <input
                  required
                  type="text"
                  value={visitorForm.name}
                  onChange={(e) => setVisitorForm({...visitorForm, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. Mr. John Smith"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={visitorForm.phone}
                  onChange={(e) => setVisitorForm({...visitorForm, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Optional"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Purpose of Visit</label>
                <input
                  required
                  type="text"
                  value={visitorForm.purpose}
                  onChange={(e) => setVisitorForm({...visitorForm, purpose: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. Meeting with Principal"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Host / Visiting Whom</label>
                <input
                  type="text"
                  value={visitorForm.hostName}
                  onChange={(e) => setVisitorForm({...visitorForm, hostName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. Principal's Office"
                />
              </motion.div>

              <motion.div className="flex justify-end gap-3 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsVisitorOpen(false)}
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
                  Check In
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* ISSUE GATE PASS MODAL */}
      {isPassOpen && (
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
              <Flag className="w-5 h-5 text-emerald-500" /> Issue Gate Pass
            </h2>

            <form onSubmit={handleCreatePass} className="space-y-5">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student Admission No.</label>
                <input
                  required
                  type="text"
                  value={passForm.admissionNumber}
                  onChange={(e) => setPassForm({...passForm, admissionNumber: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all uppercase font-mono"
                  placeholder="e.g. STU-0001"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Leaving</label>
                <input
                  required
                  type="text"
                  value={passForm.reason}
                  onChange={(e) => setPassForm({...passForm, reason: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. Doctor Appointment"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Released To (Guardian)</label>
                <input
                  required
                  type="text"
                  value={passForm.releasedTo}
                  onChange={(e) => setPassForm({...passForm, releasedTo: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. Mr. Smith (Father)"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Approved By (Staff)</label>
                <input
                  required
                  type="text"
                  value={passForm.approvedBy}
                  onChange={(e) => setPassForm({...passForm, approvedBy: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. Mr. Johnson"
                />
              </motion.div>

              <motion.div className="flex justify-end gap-3 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsPassOpen(false)}
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
                  className="px-5 py-3 text-sm font-medium bg-emerald-600 text-white rounded-xl transition-all"
                >
                  Authorize Exit
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}