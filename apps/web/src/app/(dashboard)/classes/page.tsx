'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { motion } from 'framer-motion';
import { School, Plus, Users, ArrowRight, Sparkles, Layers, X, CheckCircle, Calendar, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface ClassItem {
  id: string;
  name: string;
  section: string;
  capacity: number;
  _count?: { students?: number };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: 'Grade 10', section: 'A', capacity: 40 });

  async function loadData() {
    try {
      setLoading(true);
      const [classesData, meData] = await Promise.all([
        api.get<ClassItem[]>('/api/v1/classes'),
        getMe().catch(() => ({ roles: [] }))
      ]);
      setClasses(classesData || []);
      const roles = (meData as any)?.roles || [];
      setIsAdmin(roles.includes('TENANT_ADMIN') || roles.includes('SUPER_ADMIN'));
    } catch (err: any) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/api/v1/classes', formData);
      toast.success(`Class ${formData.name} (${formData.section}) created successfully!`);
      setIsModalOpen(false);
      setFormData({ name: 'Grade 10', section: 'A', capacity: 40 });
      loadData();
    } catch (err: any) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create class');
    } finally {
      setIsSubmitting(false);
    }
  }

  const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-8 border border-white/40 shadow-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-700 border border-indigo-300/40 mb-3">
              <School className="w-3.5 h-3.5 text-indigo-600" />
              Academic Class & Section Registry
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Academic Classes
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-xl">
              Organize grade levels, cohort streams, seat capacities, and section schedules across your school.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="glass-button-primary inline-flex items-center gap-2 text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Add New Class
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200/60">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Active Classes</span>
            <span className="text-2xl font-black text-slate-900">{classes.length}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Student Capacity</span>
            <span className="text-2xl font-black text-indigo-600">{totalCapacity} seats</span>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Average Class Size</span>
            <span className="text-2xl font-black text-emerald-600">
              {classes.length ? Math.round(totalCapacity / classes.length) : 0}
            </span>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Configured Classes ({classes.length})
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-card p-6 rounded-2xl animate-pulse space-y-4">
                <div className="h-6 bg-slate-200/60 rounded w-1/2"></div>
                <div className="h-4 bg-slate-200/40 rounded w-1/3"></div>
                <div className="h-10 bg-slate-200/50 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto border border-dashed border-slate-300">
            <GraduationCap className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Classes Found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              Set up your school's first academic class to enroll students and track attendance.
            </p>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="glass-button-primary inline-flex items-center gap-2 text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Create First Class
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((c) => (
              <motion.div
                key={c.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="glass-card rounded-2xl p-6 border border-white/60 shadow-lg hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-700 border border-indigo-200/50">
                      Section {c.section}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/60">
                      Cap: {c.capacity} students
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">
                    {c.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Stream {c.section} • Standard Academic Cohort
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100/80 flex items-center justify-between gap-2">
                  <Link
                    href={`/attendance`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Attendance
                  </Link>
                  <Link
                    href={`/grading`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Gradebook
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border border-white/60 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Add Academic Class</h3>
                <p className="text-xs text-slate-500 mt-0.5">Register a grade level and section stream</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Class / Grade Name
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Grade 10 or Year 11"
                  className="glass-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Section
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g. A"
                    className="glass-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Capacity
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="200"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    className="glass-input w-full"
                  />
                </div>
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
