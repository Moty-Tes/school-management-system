'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';
import { getMe } from '@/lib/auth';

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
      setIsModalOpen(false);
      setFormData({ email: '', firstName: '', lastName: '', employeeId: '', specialization: '', qualification: '' });
      loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create teacher');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teachers & Staff</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your school's teaching staff</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Add Teacher
          </button>
        )}
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <th className="py-3 px-4">Emp ID</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Specialization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <tr><td colSpan={4} className="py-10 text-center text-slate-400">Loading...</td></tr>
            ) : teachers.length === 0 ? (
              <tr><td colSpan={4} className="py-10 text-center text-slate-400">No teachers found.</td></tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-indigo-600">{teacher.employeeId}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {teacher.user.profile.firstName} {teacher.user.profile.lastName}
                  </td>
                  <td className="py-3 px-4">{teacher.user.email}</td>
                  <td className="py-3 px-4">{teacher.specialization || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Teacher</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                  <input required type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                  <input required type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Employee ID</label>
                  <input required type="text" value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Specialization</label>
                  <input type="text" value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Math" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}