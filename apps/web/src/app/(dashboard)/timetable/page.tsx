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

  async function loadTimetable() {
    if (!selectedClassId) return;
    const data = await api.get<any[]>(`/api/v1/timetable?classId=${selectedClassId}`);
    setTimetable(data);
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadTimetable(); }, [selectedClassId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/api/v1/timetable', { ...formData, classId: selectedClassId });
      setIsModalOpen(false);
      loadTimetable();
    } catch (err: any) {
      setError(err.message); // Catches our custom "Teacher is already booked" error
    }
  }

  // Helper to find a schedule block for a specific day/time
  function getSlot(dayIndex: number, timeRange: string) {
    const [start, end] = timeRange.split('-');
    return timetable.find(t => t.dayOfWeek === dayIndex && t.startTime === start && t.endTime === end);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Timetable</h1>
          <p className="text-slate-500 text-sm mt-1">Manage class schedules and prevent conflicts</p>
        </div>
        <div className="flex gap-4">
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
          </select>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Add Schedule
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-bold">{error}</div>}

      {/* The Grid */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="p-3 border-r text-xs text-slate-500 uppercase">Time</th>
              {DAYS.map((d, i) => (
                <th key={d} className="p-3 border-r text-sm font-bold text-slate-700">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map(period => (
              <tr key={period} className="border-b">
                <td className="p-3 border-r bg-slate-50 text-xs font-semibold text-center text-slate-500">{period}</td>
                {[1, 2, 3, 4, 5].map(day => {
                  const slot = getSlot(day, period);
                  return (
                    <td key={day} className="p-2 border-r h-20 align-top">
                      {slot ? (
                        <div className="bg-indigo-50 border border-indigo-200 p-2 rounded-lg h-full">
                          <p className="text-xs font-bold text-indigo-800">{slot.subject.name}</p>
                          <p className="text-[10px] text-indigo-600 mt-1">
                            {slot.teacher.user.profile.firstName} {slot.teacher.user.profile.lastName}
                          </p>
                        </div>
                      ) : (
                        <div className="h-full rounded-lg border-2 border-dashed border-transparent hover:border-slate-200"></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Schedule Class</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Subject</label>
                <select value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Teacher</label>
                <select value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.user.profile.firstName} {t.user.profile.lastName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Day</label>
                  <select value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Time Slot</label>
                  <select onChange={e => {
                    const [start, end] = e.target.value.split('-');
                    setFormData({...formData, startTime: start, endTime: end});
                  }} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}