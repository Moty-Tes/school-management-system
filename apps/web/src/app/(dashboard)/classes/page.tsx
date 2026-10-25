'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';
import { getMe } from '@/lib/auth';

interface ClassItem {
  id: string;
  name: string;
  section: string;
  capacity: number;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: 'Grade 9', section: 'A', capacity: 40 });

  async function loadData() {
    try {
      setLoading(true);
      const [classesData, meData] = await Promise.all([
        api.get<ClassItem[]>('/api/v1/classes'),
        getMe()
      ]);
      setClasses(classesData);
      setIsAdmin((meData as any).roles?.includes('TENANT_ADMIN') || (meData as any).roles?.includes('SUPER_ADMIN'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load classes');
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
      await api.post('/api/v1/classes', formData);
      setIsModalOpen(false);
      setFormData({ name: 'Grade 9', section: 'A', capacity: 40 });
      loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create class');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Classes</h1>
          <p className="text-slate-500 text-sm mt-1">Manage grades and sections</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Add Class
          </button>
        )}
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : classes.length === 0 ? (
          <p className="text-slate-500 col-span-full">No classes created yet.</p>
        ) : (
          classes.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                  <p className="text-sm text-slate-500">Section {c.section}</p>
                </div>
                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                  Cap: {c.capacity}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Class</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Grade Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Grade 10" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Section</label>
                <input required type="text" value={formData.section} onChange={(e) => setFormData({...formData, section: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. A" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Capacity</label>
                <input required type="number" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}