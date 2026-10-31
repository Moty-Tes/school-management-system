'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { 
  Clock, CheckCircle2, XCircle, AlertCircle, 
  Calendar as CalendarIcon, Save, Users, Sparkles, Loader2 
} from 'lucide-react';
import { sonner } from '@/components/sonner';

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
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Load classes on mount
  useEffect(() => {
    api.get<ClassItem[]>('/api/v1/classes').then((data) => {
      setClasses(data || []);
      if (data && data.length > 0) setSelectedClassId(data[0].id);
    }).catch(console.error);
  }, []);

  // 2. Load students and existing attendance when class or date changes
  async function fetchAttendance() {
    if (!selectedClassId || !date) return;
    setLoading(true);
    try {
      const [allStudents, existing] = await Promise.all([
        api.get<any[]>('/api/v1/students').catch(() => []),
        api.get<{ studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' }[]>(
          `/api/v1/attendance?classId=${selectedClassId}&date=${date}`
        ).catch(() => [])
      ]);

      const classStudents = allStudents.filter((s: any) => s.classId === selectedClassId);

      const merged: Student[] = classStudents.map((student) => {
        const record = existing.find((e) => e.studentId === student.id);
        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          admissionNumber: student.admissionNumber,
          status: record?.status || 'PRESENT', // default to PRESENT
        };
      });

      setStudents(merged);
    } catch (err) {
      console.error('Failed to load attendance:', err);
      sonner.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAttendance();
  }, [selectedClassId, date]);

  // Toggle individual student attendance
  function toggleStatus(studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
  }

  // Quick Actions: mark all
  function markAll(status: 'PRESENT' | 'ABSENT' | 'LATE') {
    setStudents(prev => prev.map(s => ({ ...s, status })));
    sonner.info(`Marked all students as ${status.toLowerCase()}`);
  }

  // Save attendance
  async function handleSave() {
    if (!selectedClassId) {
      sonner.error('Please select a class first');
      return;
    }

    setSaving(true);
    try {
      await api.post('/api/v1/attendance', {
        classId: selectedClassId,
        date,
        records: students.map(s => ({ studentId: s.id, status: s.status })),
      });

      sonner.success('Attendance recorded and saved successfully!');
    } catch (err: any) {
      console.error('Failed to save attendance:', err);
      sonner.error(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  }

  // Calculate live counts
  const presentCount = students.filter(s => s.status === 'PRESENT').length;
  const absentCount = students.filter(s => s.status === 'ABSENT').length;
  const lateCount = students.filter(s => s.status === 'LATE').length;
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-r from-slate-950 via-[#0d172c] to-[#122238]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/10">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Daily Roll Call</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Classroom Attendance</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Take daily attendance, track absent and late students, and maintain audit-compliant records.
            </p>
          </div>

          {/* Save Button in Header */}
          <button
            onClick={handleSave}
            disabled={saving || students.length === 0}
            className="px-6 py-3 rounded-2xl glass-button-primary text-sm font-bold flex items-center gap-2 shadow-xl shadow-indigo-600/30 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Attendance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and KPI Counters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class and Date Selectors */}
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold text-slate-800"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section ? `(${c.section})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Attendance Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold text-slate-800"
            />
          </div>

          {/* Quick Mark All Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              onClick={() => markAll('PRESENT')}
              disabled={students.length === 0}
              className="flex-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors disabled:opacity-50"
            >
              ✓ All Present
            </button>
            <button
              onClick={() => markAll('ABSENT')}
              disabled={students.length === 0}
              className="flex-1 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors disabled:opacity-50"
            >
              ✗ All Absent
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 items-stretch">
          <div className="glow-card-indigo rounded-3xl p-5 flex flex-col justify-between transition-all duration-300">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-700">Total Enrolled</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-black text-slate-900">{students.length}</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[11px] text-indigo-600/80 mt-1 font-semibold">Active students</span>
          </div>

          <div className="glow-card-emerald rounded-3xl p-5 flex flex-col justify-between transition-all duration-300">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700">Present</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-black text-slate-900">{presentCount}</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[11px] text-emerald-700 mt-1 font-bold">{attendanceRate}% Rate</span>
          </div>

          <div className="glow-card-purple rounded-3xl p-5 flex flex-col justify-between transition-all duration-300">
            <span className="text-xs font-black uppercase tracking-wider text-rose-700">Absent</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-black text-rose-600">{absentCount}</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[11px] text-rose-700 mt-1 font-bold">Unexcused</span>
          </div>

          <div className="glow-card-amber rounded-3xl p-5 flex flex-col justify-between transition-all duration-300">
            <span className="text-xs font-black uppercase tracking-wider text-amber-700">Late</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-black text-amber-600">{lateCount}</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[11px] text-amber-700 mt-1 font-bold">Tardy arrival</span>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Student Attendance Roster</h2>
            <p className="text-xs text-slate-500 mt-0.5">Click any status pill to toggle student attendance.</p>
          </div>

          <div className="text-xs font-bold text-slate-500">
            Date: <span className="text-indigo-600">{new Date(date).toLocaleDateString()}</span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm">Loading attendance roster...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Students Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              There are no students enrolled in this class yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-6">Student</th>
                  <th className="py-3.5 px-4">Admission #</th>
                  <th className="py-3.5 px-6 text-right">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {student.firstName} {student.lastName}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
                      {student.admissionNumber}
                    </td>

                    <td className="py-3 px-6 text-right">
                      <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/60 gap-1">
                        <button
                          type="button"
                          onClick={() => toggleStatus(student.id, 'PRESENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            student.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-emerald-700 hover:bg-white/50'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Present</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleStatus(student.id, 'ABSENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            student.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-600 hover:text-rose-700 hover:bg-white/50'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Absent</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleStatus(student.id, 'LATE')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            student.status === 'LATE'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-slate-600 hover:text-amber-700 hover:bg-white/50'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Late</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
