'use client';

import { useEffect, useState, FormEvent, useRef } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  const [classes, setClasses] = useState<any[]>([]);
  
  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [gradingAssignment, setGradingAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submitAssignmentId, setSubmitAssignmentId] = useState<string | null>(null);
  
  // Forms
  const [formData, setFormData] = useState({ classId: '', title: '', description: '', dueDate: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    const [meData, classesData, assignmentsData] = await Promise.all([
      getMe(),
      api.get<any[]>('/api/v1/classes'),
      api.get<any[]>('/api/v1/assignments')
    ]);
    
    const isTeacher = (meData as any).roles?.includes('TEACHER') || (meData as any).roles?.includes('TENANT_ADMIN');
    setRole(isTeacher ? 'TEACHER' : 'STUDENT');
    setClasses(classesData);
    setAssignments(assignmentsData);
    if (classesData.length > 0) setFormData(prev => ({...prev, classId: classesData[0].id}));
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/assignments', formData);
    setIsCreateOpen(false);
    loadData();
  }

  async function handleSubmitWork(e: FormEvent) {
    e.preventDefault();
    if (!submitAssignmentId) return;
    setUploading(true);
    
    try {
      let fileUrl = undefined;
      if (file) {
        const fd = new FormData();
        fd.append('image', file); // Reusing the image upload endpoint
        const uploadRes = await api.post<{ url: string }>('/api/v1/upload', fd);
        fileUrl = uploadRes.url;
      }

      await api.post(`/api/v1/assignments/${submitAssignmentId}/submit`, { fileUrl });
      alert('Assignment submitted successfully!');
      setSubmitAssignmentId(null);
      setFile(null);
    } catch (err) {
      alert('Failed to submit assignment');
    } finally {
      setUploading(false);
    }
  }

  async function openGrading(assignment: any) {
    setGradingAssignment(assignment);
    const data = await api.get<any[]>(`/api/v1/assignments/${assignment.id}/submissions`);
    setSubmissions(data);
  }

  async function handleGrade(submissionId: string, grade: number) {
    await api.patch(`/api/v1/assignments/submissions/${submissionId}/grade`, { grade });
    // Refresh submissions
    const data = await api.get<any[]>(`/api/v1/assignments/${gradingAssignment.id}/submissions`);
    setSubmissions(data);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
          <p className="text-slate-500 text-sm mt-1">Manage homework and submissions</p>
        </div>
        {role === 'TEACHER' && (
          <button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Create Assignment
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((a) => (
          <div key={a.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                {a.class.name} - {a.class.section}
              </span>
              <span className="text-xs text-slate-500 font-medium">Due: {new Date(a.dueDate).toLocaleDateString()}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">{a.title}</h3>
            <p className="text-sm text-slate-600 mt-1 flex-1 line-clamp-3">{a.description}</p>
            
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              {role === 'TEACHER' ? (
                <button onClick={() => openGrading(a)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                  View {a._count.submissions} Submissions →
                </button>
              ) : (
                <button onClick={() => setSubmitAssignmentId(a.id)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-slate-800 w-full">
                  Submit Homework
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Create Assignment</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Class</label>
                <select value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Due Date</label>
                <input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT SUBMIT MODAL */}
      {submitAssignmentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Submit Homework</h2>
            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Upload File (PDF, Image, etc)</label>
                <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setSubmitAssignmentId(null)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" disabled={uploading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER GRADING MODAL */}
      {gradingAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">Submissions: {gradingAssignment.title}</h2>
            
            <div className="overflow-y-auto flex-1 border rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 sticky top-0 border-b">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">File</th>
                    <th className="py-3 px-4">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {submissions.map(s => (
                    <tr key={s.id}>
                      <td className="py-3 px-4 font-medium">{s.student.firstName} {s.student.lastName}</td>
                      <td className="py-3 px-4">
                        {s.fileUrl ? <a href={`http://localhost:4000${s.fileUrl}`} target="_blank" className="text-indigo-600 underline">Download</a> : 'No file'}
                      </td>
                      <td className="py-3 px-4">
                        <input 
                          type="number" 
                          defaultValue={s.grade || ''}
                          onBlur={(e) => handleGrade(s.id, Number(e.target.value))}
                          className="w-16 px-2 py-1 border rounded text-sm" 
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setGradingAssignment(null)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}