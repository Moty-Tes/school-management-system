'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { motion } from 'framer-motion';
import { Sparkles, HelpCircle, Plus, Clock, Users, ArrowRight, Play, BookOpen, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface CBTExamItem {
  id: string;
  title: string;
  duration: number;
  totalMarks: number;
  startTime: string;
  endTime: string;
  class?: { id: string; name: string; section: string };
  questions?: any[];
  attempts?: any[];
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<CBTExamItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    classId: '',
    duration: 30,
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    questions: [
      { text: '', options: ['', '', '', ''], correctOption: 0, marks: 5 }
    ]
  });

  async function loadData() {
    try {
      setLoading(true);
      const [meData, classesData, cbtData] = await Promise.all([
        getMe().catch(() => ({ roles: [] })),
        api.get<any[]>('/api/v1/classes').catch(() => []),
        api.get<CBTExamItem[]>('/api/v1/cbt').catch(() => [])
      ]);

      const roles = (meData as any)?.roles || [];
      const staffRole = roles.includes('TEACHER') || roles.includes('TENANT_ADMIN') || roles.includes('SUPER_ADMIN');
      setIsStaff(staffRole);
      setClasses(classesData || []);
      setQuizzes(cbtData || []);

      if (classesData?.length > 0 && !formData.classId) {
        setFormData(prev => ({ ...prev, classId: classesData[0].id }));
      }
    } catch (err: any) {
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function addQuestion() {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { text: '', options: ['', '', '', ''], correctOption: 0, marks: 5 }]
    }));
  }

  function updateQuestion(index: number, text: string) {
    const next = [...formData.questions];
    next[index].text = text;
    setFormData(prev => ({ ...prev, questions: next }));
  }

  function updateOption(qIdx: number, oIdx: number, val: string) {
    const next = [...formData.questions];
    next[qIdx].options[oIdx] = val;
    setFormData(prev => ({ ...prev, questions: next }));
  }

  function setCorrectOption(qIdx: number, oIdx: number) {
    const next = [...formData.questions];
    next[qIdx].correctOption = oIdx;
    setFormData(prev => ({ ...prev, questions: next }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }
    if (!formData.classId) {
      toast.error('Please select a target class');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/api/v1/cbt', formData);
      toast.success('Interactive Quiz published successfully!');
      setIsCreateOpen(false);
      setFormData({
        title: '',
        classId: classes[0]?.id || '',
        duration: 30,
        startTime: new Date().toISOString().slice(0, 16),
        endTime: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
        questions: [{ text: '', options: ['', '', '', ''], correctOption: 0, marks: 5 }]
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-8 border border-white/40 shadow-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 border border-amber-300/40 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Gamified Interactive Quizzes
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Classroom Quizzes & Tests
            </h1>
            <p className="text-slate-600 text-sm mt-1 max-w-xl">
              Conduct instant timed quizzes, practice mock exams, and review student attempt scores with automatic anti-cheat validation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/cbt"
              className="glass-button-secondary inline-flex items-center gap-2 text-sm font-semibold"
            >
              <Play className="w-4 h-4 text-emerald-600" />
              Open CBT Room
            </Link>

            {isStaff && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="glass-button-primary inline-flex items-center gap-2 text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Create Quiz
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            Active Quizzes ({quizzes.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">Real-time synchronized with CBT Engine</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-6 rounded-2xl animate-pulse space-y-4">
                <div className="h-6 bg-slate-200/60 rounded w-2/3"></div>
                <div className="h-4 bg-slate-200/40 rounded w-1/2"></div>
                <div className="h-10 bg-slate-200/50 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto border border-dashed border-slate-300">
            <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Quizzes Created Yet</h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              Get started by creating your first timed quiz for students to complete.
            </p>
            {isStaff && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="glass-button-primary inline-flex items-center gap-2 text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Create First Quiz
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="glass-card rounded-2xl p-6 border border-white/60 shadow-lg hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-700 border border-indigo-200/50">
                      {quiz.class ? `${quiz.class.name} (${quiz.class.section})` : 'All Classes'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-white/70 px-2 py-0.5 rounded-full border border-slate-200/60">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {quiz.duration} mins
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1 mb-2">
                    {quiz.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Questions</span>
                      <span className="font-semibold text-slate-800">{quiz.questions?.length ?? 0} Questions</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Submissions</span>
                      <span className="font-semibold text-emerald-600">{quiz.attempts?.length ?? 0} Attempts</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700">
                    Max: {quiz.totalMarks || (quiz.questions ? quiz.questions.length * 5 : 100)} pts
                  </span>

                  <Link
                    href={`/cbt`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all"
                  >
                    Launch <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Quiz Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-white/60 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Create Interactive Quiz</h3>
                <p className="text-xs text-slate-500 mt-0.5">Define quiz parameters and multiple-choice questions</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Quiz Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Mathematics Quick Quiz - Fractions"
                    className="glass-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Target Class</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                    className="glass-input w-full"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Duration (Minutes)</label>
                  <input
                    required
                    type="number"
                    min="5"
                    max="180"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="glass-input w-full"
                  />
                </div>
              </div>

              {/* Questions Builder */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Questions ({formData.questions.length})
                  </label>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </div>

                {formData.questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 rounded-2xl bg-white/60 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Question #{qIdx + 1}</span>
                      <span className="text-[11px] text-amber-600 font-medium">Select radio to set correct answer</span>
                    </div>

                    <input
                      required
                      type="text"
                      value={q.text}
                      onChange={e => updateQuestion(qIdx, e.target.value)}
                      placeholder="e.g., What is 3/4 converted into a percentage?"
                      className="glass-input w-full text-sm"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2 bg-slate-50/70 p-2 rounded-xl border border-slate-200/50">
                          <input
                            type="radio"
                            name={`correct_${qIdx}`}
                            checked={q.correctOption === oIdx}
                            onChange={() => setCorrectOption(qIdx, oIdx)}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <input
                            required
                            type="text"
                            value={opt}
                            onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            className="w-full bg-transparent border-0 text-xs text-slate-800 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="glass-button-secondary text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="glass-button-primary text-sm font-semibold"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
