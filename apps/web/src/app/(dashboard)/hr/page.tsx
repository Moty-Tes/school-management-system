'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { motion } from 'framer-motion';
import { CheckCircle, X, Loader2, FolderPlus as FolderAdd, Menu, Shield, Users, UserPlus, LogOut, Clock, Flag, Info, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function HRPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { toast } = useToast();

  async function loadData() {
    try {
      const meData: any = await getMe();
      const isAdmin = meData.roles?.includes('TENANT_ADMIN') || meData.roles?.includes('SUPER_ADMIN');
      setRole(isAdmin ? 'ADMIN' : 'TEACHER');

      const endpoint = isAdmin ? '/api/v1/leaves/all' : '/api/v1/leaves/me';
      const data = await api.get<any[]>(endpoint);
      setLeaves(data);
      setLoading(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load leave requests.',
        variant: 'destructive',
      });
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/leaves', formData);
      setIsModalOpen(false);
      setFormData({ type: 'SICK', startDate: '', endDate: '', reason: '' });
      loadData();
      toast({
        title: 'Leave request submitted',
        description: 'Your leave request has been successfully submitted.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to submit leave request. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleUpdateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    try {
      await api.patch(`/api/v1/leaves/${id}`, { status });
      loadData();
      toast({
        title: 'Leave updated',
        description: `Leave request has been ${status.toLowerCase()}.`,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update leave request status.',
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
              <Shield className="w-5 h-5 text-indigo-600 mr-2" /> HR & Leave Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {role === 'ADMIN' ? 'Manage staff leave requests' : 'Request time off and view your history'}
            </p>
          </div>

          {role === 'TEACHER' && (
            <motion.button
              onClick={() => setIsModalOpen(true)}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring" }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Request Leave
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
        {/* Stats Header (Admin only) */}
        {role === 'ADMIN' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-xl"
            >
              <h3 className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-1">Total Requests</h3>
              <p className="text-3xl font-bold text-slate-900">{leaves.length}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-xl"
            >
              <h3 className="text-sm font-medium text-emerald-600 uppercase tracking-wider mb-1">Approved</h3>
              <p className="text-3xl font-bold text-slate-900">{leaves.filter(l => l.status === 'APPROVED').length}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-xl"
            >
              <h3 className="text-sm font-medium text-amber-600 uppercase tracking-wider mb-1">Pending</h3>
              <p className="text-3xl font-bold text-slate-900">{leaves.filter(l => l.status === 'PENDING').length}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-red-50 border-l-4 border-red-600 p-4 rounded-xl"
            >
              <h3 className="text-sm font-medium text-red-600 uppercase tracking-wider mb-1">Rejected</h3>
              <p className="text-3xl font-bold text-slate-900">{leaves.filter(l => l.status === 'REJECTED').length}</p>
            </motion.div>
          </motion.div>
        )}

        {/* Leave Table */}
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
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Duration</th>
                  <th className="py-4 px-4">Reason</th>
                  <th className="py-4 px-4">Status</th>
                  {role === 'ADMIN' && (
                    <th className="py-4 px-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {leaves.length === 0 ? (
                  <motion.tr>
                    <motion.td
                      colSpan={role === 'ADMIN' ? 6 : 4}
                      className="py-8 text-center text-slate-500"
                    >
                      {role === 'ADMIN' ? 'No leave requests found.' : 'No leave requests found.'}
                    </motion.td>
                  </motion.tr>
                ) : (
                  leaves.map((leave) => (
                    <motion.tr
                      key={leave.id}
                      initial={{ opacity: 0, y: -10, x: -20 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {role === 'ADMIN' && (
                        <motion.td className="py-4 px-4 font-medium text-slate-900">
                          {leave.teacher.user.profile?.firstName} {leave.teacher.user.profile?.lastName}
                        </motion.td>
                      )}

                      <motion.td className="py-4 px-4">
                        <span className={`
                          bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold
                          ${leave.type === 'SICK' ? 'border-l-2 border-indigo-500' : leave.type === 'ANNUAL' ? 'border-l-2 border-emerald-500' : leave.type === 'MATERNITY' ? 'border-l-2 border-amber-500' : 'border-l-2 border-red-500'}
                        `}>
                          {leave.type}
                        </span>
                      </motion.td>

                      <motion.td className="py-4 px-4">
                        {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                      </motion.td>

                      <motion.td className="py-4 px-4 text-slate-600 max-w-xs truncate">
                        {leave.reason}
                      </motion.td>

                      <motion.td className="py-4 px-4">
                        <span className={`
                          px-2.5 py-1 rounded-full text-xs font-bold
                          ${leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}
                        `}>
                          {leave.status}
                        </span>
                      </motion.td>

                      {role === 'ADMIN' && (
                        <motion.td className="py-4 px-4 text-right space-x-2">
                          {leave.status === 'PENDING' && (
                            <motion.div>
                              <motion.button
                                onClick={() => handleUpdateStatus(leave.id, 'APPROVED')}
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: "spring" }}
                                className="text-emerald-600 font-bold text-xs hover:underline transition-colors"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Approve
                              </motion.button>
                              <motion.button
                                onClick={() => handleUpdateStatus(leave.id, 'REJECTED')}
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: "spring" }}
                                className="text-red-600 font-bold text-xs hover:underline transition-colors"
                              >
                                <X className="w-3 h-3 mr-1" /> Reject
                              </motion.button>
                            </motion.div>
                          )}
                        </motion.td>
                      )}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        </motion.div>

        {/* REQUEST LEAVE MODAL */}
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
                <UserPlus className="w-5 h-5 text-indigo-500" /> Request Leave
              </h2>

              <form onSubmit={handleRequest} className="space-y-5">
                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="SICK">Sick Leave</option>
                    <option value="ANNUAL">Annual Leave</option>
                    <option value="MATERNITY">Maternity Leave</option>
                    <option value="UNPAID">Unpaid Leave</option>
                  </select>
                </motion.div>

                <motion.div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input
                      required
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input
                      required
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>
                </motion.div>

                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Provide a brief reason..."
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
                    Submit Request
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}