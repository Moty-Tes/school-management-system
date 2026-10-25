'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

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
      setGradingAssessment(null);
      loadData(); // Refresh count
    } catch (err) { alert('Failed to save grades'); }
    finally { setSavingGrades(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assessments & Grades</h1>
          <p className="text-slate-500 text-sm mt-1">Create exams and enter student scores</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + New Assessment
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm w-64">
        <label className="block text-xs font-medium text-slate-700 mb-1">Filter by Class</label>
        <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
        </select>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Class</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Max Score</th>
              <th className="py-3 px-4">Graded</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {assessments.map(a => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-medium text-slate-900">{a.title}</td>
                <td className="py-3 px-4">{a.class.name} - {a.class.section}</td>
                <td className="py-3 px-4">{new Date(a.date).toLocaleDateString()}</td>
                <td className="py-3 px-4">{a.maxScore}</td>
                <td className="py-3 px-4">{a._count.grades} Students</td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => openGrading(a)} className="text-indigo-600 font-semibold text-xs hover:underline">Enter Grades</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">New Assessment</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Midterm Exam" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Class</label>
                <select required value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Max Score</label>
                  <input required type="number" value={formData.maxScore} onChange={e => setFormData({...formData, maxScore: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Date</label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRADING MODAL */}
      {gradingAssessment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 flex flex-col max-h-[90vh]">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Enter Grades: {gradingAssessment.title}</h2>
              <p className="text-sm text-slate-500">Max Score: {gradingAssessment.maxScore}</p>
            </div>
            
            <div className="overflow-y-auto flex-1 border rounded-lg">
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
                          value={s.score} 
                          onChange={e => {
                            const newStudents = [...students];
                            newStudents[idx].score = e.target.value;
                            setStudents(newStudents);
                          }}
                          className="w-20 px-2 py-1 border rounded text-right" 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <button onClick={() => setGradingAssessment(null)} className="px-4 py-2 text-sm">Cancel</button>
              <button onClick={handleSaveGrades} disabled={savingGrades} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">
                {savingGrades ? 'Saving...' : 'Save Grades'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}