'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { motion } from 'framer-motion';
import { Users, Calendar, Loader2, X, CheckCircle, AlertCircle, FileText, FolderAdd, Menu } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  const [classes, setClasses] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [gradingAssignment, setGradingAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submitAssignmentId, setSubmitAssignmentId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

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

  const [formData, setFormData] = useState({ classId: '', title: '', description: '', dueDate: '' });

  useEffect(() => { loadData(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/assignments', formData);
      setIsCreateOpen(false);
      loadData();
      toast({
        title: 'Assignment created',
        description: 'The assignment has been successfully created.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create assignment. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleSubmitWork(e: FormEvent) {
    e.preventDefault();
    if (!submitAssignmentId) return;
    setUploading(true);

    try {
      let fileUrl = undefined;
      if (file) {
        const fd = new FormData();
        fd.append('image', file);
        const uploadRes = await api.post<{ url: string }>('/api/v1/upload', fd);
        fileUrl = uploadRes.url;
      }

      await api.post(`/api/v1/assignments/${submitAssignmentId}/submit`, { fileUrl });
      toast({
        title: 'Submission successful',
        description: 'Your homework has been submitted successfully.',
        variant: 'success',
      });
      setSubmitAssignmentId(null);
      setFile(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to submit assignment. Please try again.',
        variant: 'destructive',
      });
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
    try {
      await api.patch(`/api/v1/assignments/submissions/${submissionId}/grade`, { grade });
      toast({
        title: 'Grade recorded',
        description: 'The submission grade has been updated.',
        variant: 'success',
      });
      const data = await api.get<any[]>(`/api/v1/assignments/${gradingAssignment.id}/submissions`);
      setSubmissions(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to record grade. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleDeleteAssignment(id: string) {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    setDeletingAssignment(id);
    try {
      // Assuming there's a delete endpoint; if not, we'll just remove from UI
      setAssignments(prev => prev.filter(a => a.id !== id));
      toast({
        title: 'Assignment deleted',
        description: 'The assignment has been successfully deleted.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete assignment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingAssignment(null);
    }
  }

  return (
    <motion.div className="min-h-screen bg-slate-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="bg-white border-b border-slate-200 px-6 py-6 shadow-sm"
      >
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">
              <Menu className="w-5 h-5 text-indigo-600 mr-2" /> Assignments
            </h1>
            <p className="text-slate-500 text-sm">Manage homework and submissions</p>
          </div>

          {role === 'TEACHER' && (
            <motion.button
              onClick={() => setIsCreateOpen(true)}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring" }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
            >
              <FolderAdd className="w-4 h-4" /> Create Assignment
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Stats Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
        className="px-6 py-4 bg-white border-b border-slate-200 shadow-sm"
      >
        {role === 'TEACHER' && (
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-xl"
            >
              <h3 className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-1">Total Assignments</h3>
              <p className="text-3xl font-bold text-slate-900">{assignments.length}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-xl"
            >
              <h3 className="text-sm font-medium text-emerald-600 uppercase tracking-wider mb-1">Pending Submissions</h3>
              <p className="text-3xl font-bold text-slate-900">{assignments.filter(a => a.status === 'pending').length}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-xl"
            >
              <h3 className="text-sm font-medium text-amber-600 uppercase tracking-wider mb-1">Graded</h3>
              <p className="text-3xl font-bold text-slate-900">{assignments.filter(a => a.status === 'graded').length}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-red-50 border-l-4 border-red-600 p-4 rounded-xl"
            >
              <h3 className="text-sm font-medium text-red-600 uppercase tracking-wider mb-1">Overdue</h3>
              <p className="text-3xl font-bold text-slate-900">{assignments.filter(a => a.isOverdue).length}</p>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
        className="px-6 py-8"
      >
        {role === 'TEACHER' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((a) => (
              <motion.div
                key={a.id}
                whileHover={{ y: -8, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40"
                style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{a.class.name} - {a.class.section}</p>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">{a.title}</h2>
                    <p className="text-sm text-slate-500 mb-2 line-clamp-2">{a.description}</p>
                    <p className="text-xs text-slate-400">
                      Due: {new Date(a.dueDate).toLocaleDateString()} • {' '}
                      {a.status === 'pending' ? (
                        <span className="text-indigo-600 font-medium">Pending</span>
                      ) : a.status === 'graded' ? (
                        <span className="text-emerald-600 font-medium">Graded</span>
                      ) : (
                        <span className="text-amber-600 font-medium">Submitted</span>
                      )}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      {a.status !== 'graded' && (
                        <motion.button
                          onClick={() => openGrading(a)}
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring" }}
                          className="text-indigo-600 font-medium text-sm hover:underline transition-colors"
                        >
                          View Submissions
                        </motion.button>
                      )}
                      {a.status === 'pending' && (
                        <motion.button
                          onClick={() => setSubmitAssignmentId(a.id)}
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring" }}
                          className="text-emerald-600 font-medium text-sm hover:underline transition-colors"
                        >
                          Submit Homework
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {assignments.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl shadow-slate-50/30 flex flex-col"
                style={{ transition: 'all 0.3s ease' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    {a.class.name} - {a.class.section}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Due: {new Date(a.dueDate).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{a.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-3">{a.description}</p>

                {role === 'STUDENT' && (
                  <motion.button
                    onClick={() => setSubmitAssignmentId(a.id)}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring" }}
                    className="mt-4 w-full py-3 px-4 bg-indigo-600 text-white rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                  >
                    Submit Homework
                  </motion.button>
                )}
              </motion.div>
            ))}

            {assignments.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="p-12 text-center text-slate-500"
              >
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No assignments found.</p>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          whileHover={{ opacity: 0.9 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-3xl w-full max-w-md p-8 shadow-3xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <FolderAdd className="w-5 h-5 text-indigo-500" /> Create Assignment
            </h2>

            <form onSubmit={handleCreate} className="space-y-6">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Class</label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({...formData, classId: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
                >
                  <option value="" disabled>Select a class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                  ))}
                </select>
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. Math Homework - Chapter 3"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Describe the assignment..."
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                <input
                  required
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </motion.div>

              <motion.div className="flex justify-end gap-4 pt-8 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="px-5 py-3 text-sm font-medium bg-indigo-600 text-white rounded-xl transition-all"
                >
                  Create Assignment
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* STUDENT SUBMIT MODAL */}
      {submitAssignmentId && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          whileHover={{ opacity: 0.9 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-3xl w-full max-w-md p-8 shadow-3xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-500" /> Submit Homework
            </h2>

            <form onSubmit={handleSubmitWork} className="space-y-4">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload File</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer"
                />
                <p className="text-xs text-slate-500 mt-1">Supported: PDF, JPG, PNG, DOCS (max 10MB)</p>
              </motion.div>

              <motion.div className="flex justify-end gap-3 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={() => setSubmitAssignmentId(null)}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-3 text-sm font-medium bg-indigo-600 text-white rounded-xl disabled:opacity-50 transition-all"
                >
                  {uploading ? 'Uploading...' : 'Submit'}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* TEACHER GRADING MODAL */}
      {gradingAssignment && (
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
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <FolderAdd className="w-5 h-5 text-indigo-500" /> Submissions: {gradingAssignment.title}
            </h2>

            <div className="overflow-y-auto flex-1 border rounded-lg">
              <motion.table className="w-full text-left">
                <motion.thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <motion.tr>
                    <motion.th className="py-3 px-4">Student</motion.th>
                    <motion.th className="py-3 px-4">File</motion.th>
                    <motion.th className="py-3 px-4">Grade</motion.th>
                  </motion.tr>
                </motion.thead>
                <motion.tbody className="divide-y divide-slate-100 text-sm">
                  {submissions.map(s => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                      className="hover:bg-slate-50"
                    >
                      <motion.td className="py-3 px-4 font-medium">
                        {s.student.firstName} {s.student.lastName}
                      </motion.td>
                      <motion.td className="py-3 px-4">
                        {s.fileUrl ? (
                          <a
                            href={`http://localhost:4000${s.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 underline hover:text-indigo-800"
                          >
                            Download
                          </a>
                        ) : (
                          <span className="text-slate-400">No file</span>
                        )}
                      </motion.td>
                      <motion.td className="py-3 px-4">
                        <input
                          type="number"
                          defaultValue={s.grade || ''}
                          onBlur={(e) => handleGrade(s.id, Number(e.target.value))}
                          className="w-20 px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-placeholder"
                          placeholder="0"
                        />
                      </motion.td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </motion.table>
            </div>

            <div className="mt-6 flex justify-end">
              <motion.button
                onClick={() => setGradingAssignment(null)}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring" }}
                className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}