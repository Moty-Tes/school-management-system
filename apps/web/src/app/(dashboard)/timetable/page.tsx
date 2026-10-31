'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Calendar, Plus, Clock, BookOpen, User, Sparkles, X, Check, Filter } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = [
  { name: 'Monday', index: 1 },
  { name: 'Tuesday', index: 2 },
  { name: 'Wednesday', index: 3 },
  { name: 'Thursday', index: 4 },
  { name: 'Friday', index: 5 },
];

const PERIODS = [
  { label: 'Period 1', start: '08:30', end: '09:30' },
  { label: 'Period 2', start: '09:30', end: '10:30' },
  { label: 'Period 3', start: '10:30', end: '11:30' },
  { label: 'Period 4', start: '12:30', end: '13:30' },
  { label: 'Period 5', start: '13:30', end: '14:30' },
];

export default function TimetablePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [timetable, setTimetable] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    subjectId: '',
    teacherId: '',
    dayOfWeek: 1,
    startTime: '08:30',
    endTime: '09:30',
  });

  const [subjectData, setSubjectData] = useState({ name: '', code: '' });

  async function loadInitialData() {
    try {
      setLoading(true);
      const [classesRes, subjectsRes, teachersRes] = await Promise.all([
        api.get<any[]>('/api/v1/classes').catch(() => []),
        api.get<any>('/api/v1/timetable/subjects').catch(() => []),
        api.get<any[]>('/api/v1/teachers').catch(() => []),
      ]);

      const cList = Array.isArray(classesRes) ? classesRes : (classesRes?.data || []);
      const sList = Array.isArray(subjectsRes) ? subjectsRes : (subjectsRes?.data || []);
      const tList = Array.isArray(teachersRes) ? teachersRes : (teachersRes?.data || []);

      setClasses(cList);
      setSubjects(sList);
      setTeachers(tList);

      if (cList.length > 0 && !selectedClassId) {
        setSelectedClassId(cList[0].id);
      }
      if (sList.length > 0 && !formData.subjectId) {
        setFormData(prev => ({ ...prev, subjectId: sList[0].id }));
      }
      if (tList.length > 0 && !formData.teacherId) {
        setFormData(prev => ({ ...prev, teacherId: tList[0].id }));
      }
    } catch (err: any) {
      toast.error('Failed to load scheduling data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadTimetable() {
    if (!selectedClassId) return;
    try {
      const data = await api.get<any>(`/api/v1/timetable?classId=${selectedClassId}`);
      const list = Array.isArray(data) ? data : (data?.data || []);
      setTimetable(list);
    } catch (err) {
      setTimetable([]);
    }
  }

  useEffect(() => {
    loadTimetable();
  }, [selectedClassId]);

  function getSlot(dayIndex: number, start: string, end: string) {
    return timetable.find(
      (t) => t.dayOfWeek === dayIndex && t.startTime === start && t.endTime === end
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedClassId) {
      toast.error('Please select a class first');
      return;
    }
    if (!formData.subjectId || !formData.teacherId) {
      toast.error('Please select both a subject and teacher');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/api/v1/timetable', { ...formData, classId: selectedClassId });
      toast.success('Timetable period scheduled successfully!');
      setIsModalOpen(false);
      loadTimetable();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save timetable slot');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateSubject(e: FormEvent) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const newSub = await api.post<any>('/api/v1/timetable/subjects', subjectData);
      toast.success(`Subject ${subjectData.name} created!`);
      setIsSubjectModalOpen(false);
      setSubjectData({ name: '', code: '' });
      // Refresh subjects
      const updated = await api.get<any>('/api/v1/timetable/subjects');
      const list = Array.isArray(updated) ? updated : (updated?.data || []);
      setSubjects(list);
      if (list.length > 0) {
        setFormData(prev => ({ ...prev, subjectId: list[list.length - 1].id }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create subject');
    } finally {
      setIsSubmitting(false);
    }
  }

  function openCreateForSlot(dayIndex: number, start: string, end: string) {
    setFormData(prev => ({
      ...prev,
      dayOfWeek: dayIndex,
      startTime: start,
      endTime: end,
    }));
    setIsModalOpen(true);
  }

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-8 border border-white/40 shadow-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-700 border border-indigo-300/40 mb-3">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Master Academic Schedule
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Timetable & Period Allocations
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-xl">
              Coordinate class periods, assign subject teachers, and manage conflict-free weekly schedules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="glass-button-secondary inline-flex items-center gap-2 text-sm font-semibold"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              New Subject
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="glass-button-primary inline-flex items-center gap-2 text-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add Period Slot
            </button>
          </div>
        </div>

        {/* Class Selection & Quick Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-200/60">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-600" /> Filter Class:
            </span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="glass-input text-sm font-semibold text-slate-800 py-1.5 px-3 min-w-[200px]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - Section {c.section}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px]">Scheduled Slots</span>
              <span className="font-bold text-slate-800 text-sm">{timetable.length} periods</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Subjects In Roster</span>
              <span className="font-bold text-indigo-600 text-sm">{subjects.length} subjects</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Active Class</span>
              <span className="font-bold text-emerald-600 text-sm">
                {selectedClass ? `${selectedClass.name} (${selectedClass.section})` : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/60 shadow-xl p-4 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr>
                <th className="p-3 pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-left border-b border-slate-200/70 w-28">
                  Time
                </th>
                {DAYS.map((d) => (
                  <th
                    key={d.name}
                    className="p-3 pb-4 text-sm font-bold text-slate-800 text-center border-b border-slate-200/70"
                  >
                    <span className="px-3 py-1 rounded-full bg-slate-100/70 text-slate-700 border border-slate-200/50">
                      {d.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {PERIODS.map((period) => (
                <tr key={period.label} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="p-3 text-xs font-semibold text-slate-500 whitespace-nowrap align-top border-r border-slate-100/80">
                    <div className="font-bold text-slate-700">{period.label}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {period.start} - {period.end}
                    </div>
                  </td>

                  {DAYS.map((day) => {
                    const slot = getSlot(day.index, period.start, period.end);
                    return (
                      <td
                        key={day.name}
                        className="p-2.5 align-top min-w-[150px] border-r border-slate-100/80 last:border-r-0"
                      >
                        {slot ? (
                          <motion.div
                            whileHover={{ y: -2 }}
                            transition={{ duration: 0.15 }}
                            className="glass-card rounded-2xl p-3 border border-indigo-200/60 shadow-sm hover:shadow-md bg-gradient-to-br from-indigo-50/80 to-white/90 relative overflow-hidden"
                          >
                            <div className="w-1.5 h-full absolute left-0 top-0 bg-indigo-600"></div>
                            <div className="pl-1.5">
                              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                                {slot.subject?.code || 'SUBJ'}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                                {slot.subject?.name || 'Class Period'}
                              </h4>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                                <User className="w-3 h-3 text-slate-400" />
                                {slot.teacher?.user?.profile?.firstName}{' '}
                                {slot.teacher?.user?.profile?.lastName}
                              </p>
                            </div>
                          </motion.div>
                        ) : (
                          <button
                            onClick={() => openCreateForSlot(day.index, period.start, period.end)}
                            className="w-full h-20 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all flex flex-col items-center justify-center text-slate-300 hover:text-indigo-600 group/btn"
                          >
                            <Plus className="w-4 h-4 mb-0.5 transform group-hover/btn:scale-110 transition-transform" />
                            <span className="text-[10px] font-semibold opacity-0 group-hover/btn:opacity-100 transition-opacity">
                              Add Slot
                            </span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border border-white/60 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Schedule Class Slot</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Class: {selectedClass ? `${selectedClass.name} (${selectedClass.section})` : 'Selected Class'}
                </p>
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
                  Subject
                </label>
                {subjects.length === 0 ? (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    No subjects created yet. Click "New Subject" first!
                  </div>
                ) : (
                  <select
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="glass-input w-full"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Teacher
                </label>
                {teachers.length === 0 ? (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    No teachers registered. Add teachers in the Faculty directory first.
                  </div>
                ) : (
                  <select
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="glass-input w-full"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.user?.profile?.firstName} {t.user?.profile?.lastName} ({t.employeeId})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Day of Week
                  </label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                    className="glass-input w-full"
                  >
                    {DAYS.map((d) => (
                      <option key={d.index} value={d.index}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Time Period
                  </label>
                  <select
                    value={`${formData.startTime}-${formData.endTime}`}
                    onChange={(e) => {
                      const [start, end] = e.target.value.split('-');
                      setFormData({ ...formData, startTime: start, endTime: end });
                    }}
                    className="glass-input w-full font-mono text-xs"
                  >
                    {PERIODS.map((p) => (
                      <option key={p.label} value={`${p.start}-${p.end}`}>
                        {p.start} - {p.end}
                      </option>
                    ))}
                  </select>
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
                  disabled={isSubmitting || subjects.length === 0 || teachers.length === 0}
                  className="glass-button-primary text-sm font-semibold"
                >
                  {isSubmitting ? 'Scheduling...' : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 sm:p-8 border border-white/60 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Create Subject</h3>
                <p className="text-xs text-slate-500 mt-0.5">Add course to academic curriculum</p>
              </div>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject Name
                </label>
                <input
                  required
                  type="text"
                  value={subjectData.name}
                  onChange={(e) => setSubjectData({ ...subjectData, name: e.target.value })}
                  placeholder="e.g. Pure Mathematics"
                  className="glass-input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject Code
                </label>
                <input
                  required
                  type="text"
                  value={subjectData.code}
                  onChange={(e) => setSubjectData({ ...subjectData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. MTH-101"
                  className="glass-input w-full font-mono uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="glass-button-secondary text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="glass-button-primary text-sm font-semibold"
                >
                  {isSubmitting ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
