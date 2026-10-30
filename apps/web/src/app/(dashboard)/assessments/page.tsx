'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { CalendarPlus, Clipboard, Plus, CheckCircle, AlertCircle } from 'lucide-react';

interface ClassItem { id: string; name: string; section: string; }
interface Assessment { id: string; title: string; maxScore: number; date: string; class: ClassItem; _count: { grades: number } }
interface Student { id: string; firstName: string; lastName: string; admissionNumber: string; score?: number | string; }

export default function AssessmentsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', maxScore: 100, date: new Date().toISOString().split('T')[0], classId: '' });

  // Grade Modal
  const [gradingAssessment, setGradingAssessment] = useState<Assessment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [savingGrades, setSavingGrades] = useState(false);

  async function loadData() {
    const [classesData, assessmentsData] = await Promise.all([
      api.get<ClassItem[]>('/api/v1/classes'),
      api.get<Assessment[]>(`/api/v1/assessments${selectedClassId ? `?classId=${selectedClassId}` : ''}`)
    ]);
    setClasses(classesData);
    setAssessments(assessmentsData);
    if (classesData.length > 0 && !formData.classId) setFormData(prev => ({ ...prev, classId: classesData[0].id }));
  }

  useEffect(() => { loadData(); }, [selectedClassId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/assessments', formData);
    showSuccessToast('Assessment created successfully!');
    setIsCreateOpen(false);
    loadData();
  }

  async function openGrading(assessment: Assessment) {
    setGradingAssessment(assessment);
    // Fetch students in this class
    const allStudents = await api.get<Student[]>('/api/v1/students');
    const classStudents = allStudents.filter((s: any) => s.classId === assessment.class.id);

    // Fetch existing grades
    const existingGrades = await api.get<{ studentId: string, score: number }[]>(`/api/v1/assessments/${assessment.id}/grades`);

    const merged = classStudents.map(s => {
      const grade = existingGrades.find(g => g.studentId === s.id);
      return { ...s, score: grade ? grade.score : '' };
    });
    setStudents(merged);
  }

  async function handleSaveGrades() {
    if (!gradingAssessment) return;
    setSavingGrades(true);
    try {
      await api.post('/api/v1/assessments/grades', {
        assessmentId: gradingAssessment.id,
        records: students.filter(s => s.score !== '').map(s => ({ studentId: s.id, score: Number(s.score) }))
      });
      showSuccessToast('Grades saved successfully!');
      setGradingAssessment(null);
      loadData();
    } catch (err) {
      showErrorToast('Failed to save grades. Please try again.');
    } finally {
      setSavingGrades(false);
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
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assessments & Grades</h1>
          <p className="text-slate-500 text-sm mt-1">Create exams and enter student scores</p>
        </div>

        <motion.button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Assessment
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-lg shadow-slate-50/30 mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Assessments Table */}
      <motion.div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg shadow-slate-50/30">
        <motion.table className="w-full text-left animate-in" style={{ transitionProperty: 'all', transitionDuration: '0.2s' }}>
          <motion.thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <motion.tr>
              <motion.th className="py-3 px-4">Title</motion.th>
              <motion.th className="py-3 px-4">Class</motion.th>
              <motion.th className="py-3 px-4">Date</motion.th>
              <motion.th className="py-3 px-4">Max Score</motion.th>
              <motion.th className="py-3 px-4">Graded</motion.th>
              <motion.th className="py-3 px-4 text-right">Actions</motion.th>
            </motion.tr>
          </motion.thead>
          <motion.tbody className="divide-y divide-slate-100 text-sm">
            {assessments.map(a => (
              <motion.tr
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                className="hover:bg-slate-50"
              >
                <motion.td className="py-3 px-4 font-medium text-slate-900">{a.title}</motion.td>
                <motion.td className="py-3 px-4">{a.class.name} - {a.class.section}</motion.td>
                <motion.td className="py-3 px-4">{new Date(a.date).toLocaleDateString()}</motion.td>
                <motion.td className="py-3 px-4 font-mono text-primary-600">{a.maxScore}</motion.td>
                <motion.td className="py-3 px-4 text-emerald-600 font-medium">{a._count.grades} Students</motion.td>
                <motion.td className="py-3 px-4 text-right">
                  <motion.button
                    onClick={() => openGrading(a)}
                    className="text-primary-600 font-semibold text-xs hover:underline transition-colors"
                  >
                    Enter Grades
                  </motion.button>
                </motion.td>
              </motion.tr>
            ))}
          </motion.tbody>
        </motion.table>
      </motion.div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
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
              New Assessment
            </h2>

            <form onSubmit={handleCreate} className="space-y-5">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. Midterm Exam"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                <select
                  required
                  value={formData.classId}
                  onChange={(e) => setFormData({...formData, classId: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div className="grid grid-cols-2 gap-4">
                <motion.div>
                  <label className="block text-sm font-medium mb-1">Max Score</label>
                  <input
                    required
                    type="number"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({...formData, maxScore: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </motion.div>
                <motion.div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </motion.div>
              </motion.div>

              <motion.div className="flex justify-end gap-3 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="px-5 py-3 text-sm font-medium bg-primary-600 text-white rounded-xl transition-all"
                >
                  Save
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* GRADING MODAL */}
      {gradingAssessment && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          whileHover={{ opacity: 0.9 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-3xl w-full max-w-2xl p-8 shadow-3xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m6 4h12m0 0l-4 4m4-4l-4-4m0-6H4"></path>
                </svg>
                Enter Grades: {gradingAssessment.title}
              </h2>
              <p className="text-sm text-slate-500">Max Score: {gradingAssessment.maxScore}</p>
            </div>

            <div className="overflow-y-auto flex-1 border rounded-lg my-4">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 sticky top-0 border-b">
                  <tr>
                    <th className="py-2 px-4">Student</th>
                    <th className="py-2 px-4 w-32 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="py-2 px-4 font-medium">{s.firstName} {s.lastName}</td>
                      <td className="py-2 px-4 text-right">
                        <input
                          type="number"
                          min="0"
                          max={gradingAssessment.maxScore}
                          value={s.score || ''}
                          onChange={(e) => {
                            const newStudents = [...students];
                            newStudents[idx].score = e.target.value;
                            setStudents(newStudents);
                          }}
                          className="w-24 px-2 py-1 border rounded text-right"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <motion.button
                onClick={() => setGradingAssessment(null)}
                className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleSaveGrades}
                disabled={savingGrades}
                className="px-5 py-3 text-sm font-medium bg-primary-600 text-white rounded-xl transition-all"
              >
                {savingGrades ? 'Saving...' : 'Save Grades'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}