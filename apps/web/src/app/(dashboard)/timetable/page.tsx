'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = ['08:30-09:30', '09:30-10:30', '10:30-11:30', '12:30-13:30', '13:30-14:30'];

export default function TimetablePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [timetable, setTimetable] = useState<any[]>([]);

  // Modals & Dropdowns
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [formData, setFormData] = useState({ subjectId: '', teacherId: '', dayOfWeek: 1, startTime: '08:30', endTime: '09:30' });
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    const [classesData, subjectsData, teachersData] = await Promise.all([
      api.get<any[]>('/api/v1/classes'),
      api.get<any[]>('/api/v1/timetable/subjects'),
      api.get<any[]>('/api/v1/teachers')
    ]);
    setClasses(classesData);
    setSubjects(subjectsData);
    setTeachers(teachersData);

    if (classesData.length > 0 && !selectedClassId) setSelectedClassId(classesData[0].id);
    if (subjectsData.length > 0 && !formData.subjectId) setFormData(prev => ({...prev, subjectId: subjectsData[0].id}));
    if (teachersData.length > 0 && !formData.teacherId) setFormData(prev => ({...prev, teacherId: teachersData[0].id}));
  }

  useEffect(() => { loadData(); }, []);

  async function loadTimetable() {
    if (!selectedClassId) return;
    const data = await api.get<any[]>(`/api/v1/timetable?classId=${selectedClassId}`);
    setTimetable(data);
  }

  useEffect(() => { loadTimetable(); }, [selectedClassId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/api/v1/timetable', { ...formData, classId: selectedClassId });
      showSuccessToast('Timetable schedule saved!');
      setIsModalOpen(false);
      loadTimetable();
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to save timetable');
    }
  }

  // Helper to find a schedule block for a specific day/time
  function getSlot(dayIndex: number, timeRange: string) {
    const [start, end] = timeRange.split('-');
    return timetable.find(t => t.dayOfWeek === dayIndex && t.startTime === start && t.endTime === end);
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
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Timetable</h1>
          <p className="text-slate-500 text-sm mt-1">Manage class schedules and prevent conflicts</p>
        </div>

        <motion.button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 flex items-center gap-2"
        >
          + Add Schedule
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m6 4h12m0 0l-4 4m4-4l-4-4m0-6H4"></path>
          </svg>
        </motion.button>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4 animate-bounce"
        >
          {error}
        </motion.div>
      )}

      {/* The Grid with animated cells */}
      <motion.div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl">
        <motion.table className="w-full animate-in" style={{ transitionProperty: 'all', transitionDuration: '0.2s' }}>
          <motion.thead className="bg-slate-50 border-b border-slate-200">
            <motion.tr className="border-b border-slate-200">
              <motion.th className="p-3 border-r text-xs text-slate-500 uppercase font-medium">Time</motion.th>
              {DAYS.map((d, i) => (
                <motion.th
                  key={d}
                  className={`p-3 border-r text-sm font-bold text-slate-700 transition-transform duration-300 hover:bg-slate-50`}
                  style={{ transform: `rotateX(${i % 2 === 0 ? 0 : -10}deg) translateY(${i * 2}px)` }}
                >
                  {d}
                </motion.th>
              ))}
            </motion.tr>
          </motion.thead>
          <motion.tbody>
            {PERIODS.map(period => (
              <motion.tr
                key={period}
                className="border-b transition-colors hover:bg-slate-50"
                style={{ animationDelay: `${PERIODS.indexOf(period)}0ms` }}
              >
                <motion.td
                  key="time"
                  className={`p-3 border-r bg-slate-50 text-xs font-semibold text-center text-slate-500 transition-colors`}
                >
                  {period}
                </motion.td>
                {[1, 2, 3, 4, 5].map(day => {
                  const slot = getSlot(day, period);
                  return (
                    <motion.td
                      key={day}
                      className={`p-2 border-r h-20 align-top transition-all duration-300 ease-out`}
                      style={{
                        background: slot
                          ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                          : 'linear-gradient(135deg, #e2e8f0, #f1f5f9)'
                      }}
                    >
                      {slot ? (
                        <motion.div
                          className="p-2 rounded-lg"
                          whileHover={{ transform: 'translateY(-4)', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)' }}
                        >
                          <p className="text-xs font-bold text-primary-600 mb-1">{slot.subject.name}</p>
                          <p className="text-[10px] text-primary-400 mt-1">
                            {slot.teacher.user.profile.firstName} {slot.teacher.user.profile.lastName}
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          className="h-full rounded-lg border-2 border-transparent hover:border-slate-300 transition-colors"
                          whileHover={{ borderColor: '#3b82f6', boxShadow: '0 2px 10px rgba(59, 130, 246, 0.15)' }}
                        >
                          <svg className="w-4 h-4 mx-auto my-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m6 4h12m0 0l-4 4m4-4l-4-4m0-6H4"></path>
                          </svg>
                        </motion.div>
                      )}
                    </motion.td>
                  );
                })}
              </motion.tr>
            ))}
          </motion.tbody>
        </motion.table>
      </motion.div>

      {/* Add Modal */}
      {isModalOpen && (
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
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m6 4h12m0 0l-4 4m4-4l-4-4m0-6H4"></path>
              </svg>
              Schedule Class
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teacher</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.user.profile.firstName} {t.user.profile.lastName}
                    </option>
                  ))}
                </select>
              </motion.div>

              <motion.div className="grid grid-cols-2 gap-4">
                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Day</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({...formData, dayOfWeek: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
                  >
                    {DAYS.map((d, i) => (
                      <option key={d} value={i + 1}>{d}</option>
                    ))}
                  </select>
                </motion.div>
                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time Slot</label>
                  <select
                    onChange={(e) => {
                      const [start, end] = e.target.value.split('-');
                      setFormData({...formData, startTime: start, endTime: end});
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
                  >
                    {PERIODS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </motion.div>
              </motion.div>

              <motion.div className="flex justify-end gap-3 pt-8 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="px-5 py-3 text-sm font-medium bg-primary-600 text-white rounded-xl transition-all"
                >
                  Save Schedule
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}