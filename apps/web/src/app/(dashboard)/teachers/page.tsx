'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { motion } from 'framer-motion';
import { UserPlus, UserRemove, Mail, User } from 'lucide-react';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        getMe()
      ]);
      setTeachers(teachersData);
      setIsAdmin((meData as any).roles?.includes('TENANT_ADMIN') || (meData as any).roles?.includes('SUPER_ADMIN'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/api/v1/teachers', formData);
      showSuccessToast('Teacher added successfully!');
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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create teacher');
      showErrorToast('Failed to create teacher. Please try again.');
    } finally {
      setIsSubmitting(false);
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teachers & Staff</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your school's teaching staff</p>
        </div>

        {isAdmin && (
          <motion.button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add Teacher
          </motion.button>
        )}
      </motion.div>

      {error && (
        <motion.div
          className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4 animate-bounce"
        >
          {error}
        </motion.div>
      )}

      {/* Teachers Table with animated rows */}
      <motion.div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg shadow-slate-50/30">
        <motion.table className="w-full text-left animate-in" style={{ transitionProperty: 'all', transitionDuration: '0.2s' }}>
          <motion.thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <motion.tr>
              <motion.th className="py-3 px-4">Emp ID</motion.th>
              <motion.th className="py-3 px-4">Name</motion.th>
              <motion.th className="py-3 px-4">Email</motion.th>
              <motion.th className="py-3 px-4">Specialization</motion.th>
            </motion.tr>
          </motion.thead>
          <motion.tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <motion.tr className="align-middle">
                <motion.td colSpan={4} className="py-10 text-center text-slate-400">Loading teachers...</motion.td>
              </motion.tr>
            ) : teachers.length === 0 ? (
              <motion.tr className="align-middle">
                <motion.td colSpan={4} className="py-10 text-center text-slate-400">No teachers found.</motion.td>
              </motion.tr>
            ) : teachers.map((teacher, index) => (
              <motion.tr
                key={teacher.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: index * 0.03 }}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <motion.td className="py-3 px-4 font-mono text-indigo-600">{teacher.employeeId}</motion.td>
                <motion.td className="py-3 px-4 font-medium text-slate-900">
                  {teacher.user.profile.firstName} {teacher.user.profile.lastName}
                </motion.td>
                <motion.td className="py-3 px-4">{teacher.user.email}</motion.td>
                <motion.td className="py-3 px-4">{teacher.specialization || '—'}</motion.td>
              </motion.tr>
            ))}
          </motion.tbody>
        </motion.table>
      </motion.div>

      {/* Add Teacher Modal */}
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
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m6 4h12m0 0l-4 4m4-4l-4-4m0-6H4"></path>
              </svg>
              Add New Teacher
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                <input
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="John"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                <input
                  required
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Doe"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="john@school.edu"
                />
              </motion.div>

              <motion.div className="grid grid-cols-2 gap-4">
                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                  <input
                    required
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </motion.div>
                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="e.g. Mathematics"
                  />
                </motion.div>
              </motion.div>

              <motion.div className="flex justify-end gap-3 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-3 text-sm font-medium bg-primary-600 text-white rounded-xl transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Add Teacher'}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

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