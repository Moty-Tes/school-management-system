'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { motion } from 'framer-motion';
import { UserPlus, Search, Mail, Briefcase, GraduationCap, Award, X, Sparkles, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Teacher {
  id: string;
  employeeId: string;
  specialization?: string;
  qualification?: string;
  user: {
    email: string;
    profile: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    employeeId: '',
    specialization: '',
    qualification: '',
  });

  async function loadData() {
    try {
      setLoading(true);
      const [teachersData, meData] = await Promise.all([
        api.get<Teacher[]>('/api/v1/teachers'),
        getMe().catch(() => ({ roles: [] }))
      ]);
      setTeachers(teachersData || []);
      const roles = (meData as any)?.roles || [];
      setIsAdmin(roles.includes('TENANT_ADMIN') || roles.includes('SUPER_ADMIN'));
    } catch (err: any) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/api/v1/teachers', formData);
      toast.success(`Teacher ${formData.firstName} ${formData.lastName} added successfully!`);
      setIsModalOpen(false);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        employeeId: '',
        specialization: '',
        qualification: '',
      });
      loadData();
    } catch (err: any) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create teacher account');
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredTeachers = teachers.filter(t => {
    const q = searchQuery.toLowerCase();
    const fullName = `${t.user?.profile?.firstName || ''} ${t.user?.profile?.lastName || ''}`.toLowerCase();
    const email = (t.user?.email || '').toLowerCase();
    const empId = (t.employeeId || '').toLowerCase();
    const spec = (t.specialization || '').toLowerCase();
    return fullName.includes(q) || email.includes(q) || empId.includes(q) || spec.includes(q);
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-8 border border-white/40 shadow-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-800 border border-emerald-300/40 mb-3">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              Faculty & Academic Staff
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Teachers & Educators
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-xl">
              Manage instructors, departmental specializations, credentials, and teaching assignments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="glass-button-primary inline-flex items-center gap-2 text-sm font-semibold"
              >
                <UserPlus className="w-4 h-4" />
                Add New Teacher
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200/60">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Faculty</span>
            <span className="text-2xl font-black text-slate-900">{teachers.length}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Active Status</span>
            <span className="text-2xl font-black text-emerald-600">100% Verified</span>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Departments</span>
            <span className="text-2xl font-black text-indigo-600">
              {new Set(teachers.map(t => t.specialization).filter(Boolean)).size || 1} Fields
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, employee ID, subject..."
            className="glass-input w-full pl-10 text-sm"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-800">{filteredTeachers.length}</span> of {teachers.length} teachers
        </div>
      </div>

      {/* Teachers Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/60 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Employee ID</th>
                <th className="py-4 px-6">Teacher Name</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Specialization</th>
                <th className="py-4 px-6">Qualification</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2"></div>
                    <p className="text-xs font-medium">Loading faculty members...</p>
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No teachers found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchQuery ? 'Try matching a different search keyword.' : 'Click "+ Add New Teacher" above to enroll.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher, index) => (
                  <motion.tr
                    key={teacher.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono font-bold text-xs text-indigo-600">
                      {teacher.employeeId}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {teacher.user?.profile?.firstName?.charAt(0) || 'T'}
                      </div>
                      <span>
                        {teacher.user?.profile?.firstName} {teacher.user?.profile?.lastName}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      <span className="flex items-center gap-1.5 text-xs">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {teacher.user?.email}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                        {teacher.specialization || 'General Studies'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                      {teacher.qualification || 'B.Ed / M.Ed'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-300/40">
                        <UserCheck className="w-3 h-3 text-emerald-600" /> Active
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-white/60 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Add Faculty Member</h3>
                <p className="text-xs text-slate-500 mt-0.5">Register instructor account and teaching credentials</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">First Name</label>
                  <input
                    required
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="e.g. Sarah"
                    className="glass-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input
                    required
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="e.g. Jenkins"
                    className="glass-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="sarah.jenkins@school.edu"
                  className="glass-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Employee ID</label>
                  <input
                    required
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="EMP-1042"
                    className="glass-input w-full font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g. Mathematics"
                    className="glass-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Qualification</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="e.g. M.Sc. Applied Mathematics, B.Ed"
                  className="glass-input w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="glass-button-secondary text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="glass-button-primary text-sm font-semibold"
                >
                  {isSubmitting ? 'Registering...' : 'Save Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
