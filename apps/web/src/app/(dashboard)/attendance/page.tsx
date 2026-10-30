'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';

interface ClassItem {
  id: string;
  name: string;
  section: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  status?: 'PRESENT' | 'ABSENT' | 'LATE';
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 1. Load classes on mount
  useEffect(() => {
    api.get<ClassItem[]>('/api/v1/classes').then((data) => {
      setClasses(data);
      if (data.length > 0) setSelectedClassId(data[0].id);
    });
  }, []);

  // 2. Load students and existing attendance when class or date changes
  useEffect(() => {
    if (!selectedClassId || !date) return;

    async function loadAttendance() {
      setLoading(true);
      setMessage(null);
      try {
        // Fetch students in this class
        const allStudents = await api.get<Student[]>('/api/v1/students');
        const classStudents = allStudents.filter((s: any) => s.classId === selectedClassId);

        // Fetch existing attendance for this date
        const existing = await api.get<{ studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' }[]>(
          `/api/v1/attendance?classId=${selectedClassId}&date=${date}`
        );

        // Merge them together
        const merged = classStudents.map((student) => {
          const record = existing.find((e) => e.studentId === student.id);
          return { ...student, status: record?.status || 'PRESENT' }; // Default to PRESENT
        });

        setStudents(merged);
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load attendance data' });
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, [selectedClassId, date]);

  function toggleStatus(studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') {
    // Update the student status in local state
    // In a real app, this would update the visual feedback immediately
    // The actual save happens on handleSave
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/api/v1/attendance', {
        classId: selectedClassId,
        date,
        records: students.map(s => ({ studentId: s.id, status: s.status })),
      });
      setMessage({ type: 'success', text: 'Attendance saved successfully!' });

      // Show success animation
      showSuccessToast('Attendance saved successfully!');

      // Reload after a moment
      setTimeout(() => {
        loadAttendance();
        setSaving(false);
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save attendance' });
      showErrorToast('Failed to save attendance. Please try again.');
      setSaving(false);
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

    // Animate in
    setTimeout(() => {
      toastContainer.querySelector('div')!.className = 'bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-emerald-500/20 transform translate-y-0 transition-transform duration-500 ease-out';
    }, 10);

    // Remove after 3 seconds
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
          <h1 className="text-2xl font-bold text-slate-900">Daily Attendance</h1>
          <p className="text-slate-500 text-sm mt-1">Mark attendance for your class</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Save button */}
          {students.length > 0 && (
            <motion.button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Attendance'}
              <svg className="w-4 h-4 inline -mr-1 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </motion.button>
          )}

          {/* Message display */}
          {message && (
            <motion.div
              className={`p-4 rounded-lg mb-4 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Filters with nice animations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-lg shadow-slate-50/30 mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
            >
              <option value="" disabled>Select a class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
            />
          </div>
        </div>
      </motion.div>

      {/* Student List with animated rows */}
      <motion.div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg shadow-slate-50/30">
        <motion.table className="w-full text-left animate-in" style={{ transitionProperty: 'all', transitionDuration: '0.2s' }}>
          <motion.thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <motion.tr>
              <motion.th className="py-3 px-4">Adm No</motion.th>
              <motion.th className="py-3 px-4">Name</motion.th>
              <motion.th className="py-3 px-4 text-right">Status</motion.th>
            </motion.tr>
          </motion.thead>
          <motion.tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <motion.tr className="align-middle">
                <motion.td colSpan={3} className="py-10 text-center text-slate-400">
                  Loading students...
                </motion.td>
              </motion.tr>
            ) : students.length === 0 ? (
              <motion.tr className="align-middle">
                <motion.td colSpan={3} className="py-10 text-center text-slate-400">
                  No students in this class.
                </motion.td>
              </motion.tr>
            ) : (
              students.map((student, index) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, delay: index * 0.05 }}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <motion.td className="py-3 px-4 font-mono text-indigo-600">{student.admissionNumber}</motion.td>
                  <motion.td className="py-3 px-4 font-medium text-slate-900">{student.firstName} {student.lastName}</motion.td>
                  <motion.td className="py-3 px-4 text-right">
                    <motion.div className="flex gap-2">
                      <motion.button
                        onClick={() => toggleStatus(student.id, 'PRESENT')}
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          student.status === 'PRESENT'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                        whileHover={{ background: student.status === 'PRESENT' ? 'bg-emerald-700' : 'bg-indigo-50' }}
                      >
                        Present
                      </motion.button>
                      <motion.button
                        onClick={() => toggleStatus(student.id, 'ABSENT')}
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          student.status === 'ABSENT'
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                        whileHover={{ background: student.status === 'ABSENT' ? 'bg-red-700' : 'bg-indigo-50' }}
                      >
                        Absent
                      </motion.button>
                      <motion.button
                        onClick={() => toggleStatus(student.id, 'LATE')}
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          student.status === 'LATE'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                        whileHover={{ background: student.status === 'LATE' ? 'bg-amber-600' : 'bg-indigo-50' }}
                      >
                        Late
                      </motion.button>
                    </motion.div>
                  </motion.td>
                </motion.tr>
              ))
            )}
          </motion.tbody>
        </motion.table>
      </motion.div>

      {/* Save Button */}
      {students.length > 0 && (
        <motion.div className="mt-6">
          <motion.button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium text-sm transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:opacity-50"
            whileHover={{ transform: 'translateY(-2)', background: 'bg-emerald-700' }}
            whileTap={{ transform: 'translateY(2)' }}
          >
            {saving ? 'Saving Attendance...' : 'Save All Attendance'}
            <svg className="w-4 h-4 inline -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}