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
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
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
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save attendance' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Daily Attendance</h1>
        <p className="text-slate-500 text-sm mt-1">Mark attendance for your class</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-700 mb-1">Select Class</label>
          <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="" disabled>Select a class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-700 mb-1">Select Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <th className="py-3 px-4">Adm No</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <tr><td colSpan={3} className="py-10 text-center text-slate-400">Loading students...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={3} className="py-10 text-center text-slate-400">No students in this class.</td></tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono text-indigo-600">{student.admissionNumber}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{student.firstName} {student.lastName}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button onClick={() => toggleStatus(student.id, 'PRESENT')} className={`px-3 py-1 rounded text-xs font-semibold ${student.status === 'PRESENT' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Present</button>
                    <button onClick={() => toggleStatus(student.id, 'ABSENT')} className={`px-3 py-1 rounded text-xs font-semibold ${student.status === 'ABSENT' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Absent</button>
                    <button onClick={() => toggleStatus(student.id, 'LATE')} className={`px-3 py-1 rounded text-xs font-semibold ${student.status === 'LATE' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Late</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {students.length > 0 && (
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      )}
    </div>
  );
}