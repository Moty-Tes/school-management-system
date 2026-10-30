'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { motion } from 'framer-motion';
import { CheckCircle, X, AlertCircle, Clock, Loader2, FolderPlus as FolderAdd, Menu, GraduationCap, BarChart2, Shield, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function CBTPage() {
  const [role, setRole] = useState<string>('');
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [examData, setExamData] = useState({ title: '', classId: '', duration: 30, startTime: '', endTime: '', questions: [] });
  const [questions, setQuestions] = useState<any[]>([]);
  const [viewingResults, setViewingResults] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [activeAttempt, setActiveAttempt] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cheatingLogged = useRef(false);
  const timerRef = useRef<number | null>(null);

  const { toast } = useToast();

  async function loadData() {
    const meData: any = await getMe();
    const isTeacher = meData.roles?.includes('TEACHER') || meData.roles?.includes('TENANT_ADMIN');
    setRole(isTeacher ? 'TEACHER' : 'STUDENT');

    const classesData = await api.get<any[]>('/api/v1/classes');
    setClasses(classesData);
    if (classesData.length > 0 && !examData.classId) setExamData(prev => ({ ...prev, classId: classesData[0].id }));
  }

  useEffect(() => { loadData(); }, []);

  // --- ANTI-CHEAT LOGIC ---
  useEffect(() => {
    if (!activeAttempt) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !cheatingLogged.current) {
        cheatingLogged.current = true;
        toast({
          title: 'Anti-cheat alert',
          description: 'Tab switching detected. Your exam may be disqualified.',
          variant: 'destructive',
        });
        api.post('/api/v1/cbt/log-cheat', { attemptId: activeAttempt.attemptId }).catch(console.error);
      }
    };

    const handleBlur = () => {
      if (!cheatingLogged.current) {
        cheatingLogged.current = true;
        toast({
          title: 'Anti-cheat alert',
          description: 'Window lost focus. Exam may be disqualified.',
          variant: 'destructive',
        });
        api.post('/api/v1/cbt/log-cheat', { attemptId: activeAttempt.attemptId }).catch(console.error);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.key === 'u') || (e.ctrlKey && e.key === 'c') || (e.ctrlKey && e.key === 'v')) {
        if (!cheatingLogged.current) {
          cheatingLogged.current = true;
          toast({
            title: 'Anti-cheat alert',
            description: 'Keyboard shortcut detected. Exam may be disqualified.',
            variant: 'destructive',
          });
          api.post('/api/v1/cbt/log-cheat', { attemptId: activeAttempt.attemptId }).catch(console.error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeAttempt]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (!activeAttempt) {
      setTimeLeft(0);
      return;
    }
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }
    timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerRef.current!);
  }, [activeAttempt, timeLeft]);

  // --- TEACHER LOGIC ---
  function addQuestion() {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctOption: 0, marks: 1 }]);
  }
  function updateQ(qIndex: number, field: string, value: any) {
    const newQs = [...questions];
    newQs[qIndex] = { ...newQs[qIndex], [field]: value };
    setQuestions(newQs);
  }
  function updateOpt(qIndex: number, oIndex: number, value: string) {
    const newQs = [...questions];
    newQs[qIndex].options[oIndex] = value;
    setQuestions(newQs);
  }
  async function handleCreateExam(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/cbt', { ...examData, questions });
      setIsCreateOpen(false);
      toast({
        title: 'Exam published',
        description: 'The exam has been successfully published.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to publish exam. Please try again.',
        variant: 'destructive',
      });
    }
  }
  async function viewResults(examId: string) {
    setViewingResults(examId);
    try {
      const data = await api.get<any[]>(`/api/v1/cbt/${examId}/results`);
      setResults(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load results.',
        variant: 'destructive',
      });
    }
  }

  // --- STUDENT LOGIC ---
  async function startExam(examId: string) {
    try {
      const res = await api.post<any>(`/api/v1/cbt/${examId}/start`);
      setActiveAttempt(res);
      setTimeLeft(res.duration * 60);
      setAnswers({});
      cheatingLogged.current = false;
      toast({
        title: 'Exam started',
        description: 'Your exam has started. Good luck!',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Could not start exam. Maybe already taken.',
        variant: 'destructive',
      });
    }
  }
  async function handleSubmitExam() {
    if (!activeAttempt || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const answerArray = Object.keys(answers).map(qId => ({ questionId: qId, selectedOption: answers[qId] }));
      const res = await api.post<any>('/api/v1/cbt/submit', { attemptId: activeAttempt.attemptId, answers: answerArray });
      if (res.status === 'DISQUALIFIED') {
        toast({
          title: 'Exam Disqualified',
          description: 'Your exam was disqualified due to tab switching or other policy violations.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Exam Submitted',
          description: `Exam submitted successfully! Score: ${res.score}`,
          variant: 'success',
        });
      }
      setActiveAttempt(null);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to submit exam. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Render: Active Exam Player
  if (activeAttempt) {
    return (
      <motion.div className="min-h-screen bg-slate-50">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                <Shield className="w-5 h-5 text-red-600 mr-2" /> Active Exam
              </h1>
              <p className="text-slate-500 text-sm">Exam: {activeAttempt.examTitle}</p>
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                className="bg-red-50 border border-red-200 rounded-xl p-3"
                whileHover={{ transform: 'translateY(-2)', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)' }}
                transition={{ type: "spring" }}
              >
                <Clock className="w-4 h-4 text-red-500" /> <span className="text-red-600 font-medium">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
              </motion.div>

              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring" }}
                className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg transition-all duration-300 hover:shadow-slate-500/30"
              >
                {isSubmitting ? 'Submitting...' : 'Final Submit Exam'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Exam Content */}
        <motion.div className="px-6 py-8">
          {activeAttempt.questions.map((q: any, i: number) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, delay: i * 0.05 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 mb-6 group"
              style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">
                    Q{i + 1}: {q.text} <span className="text-xs text-slate-400 font-normal">({q.marks} marks)</span>
                  </h3>
                  <p className="text-sm text-slate-500">{q.timeRemaining || ''} minutes remaining for this question</p>
                </div>

                <div className="ml-6">
                  <div className="space-y-2">
                    {q.options.map((opt: string, oIndex: number) => (
                      <motion.label
                        key={oIndex}
                        whileHover={{ transform: 'translateY(-2) scale(1.02)', backgroundColor: 'var(--hover-bg)' }}
                        transition={{ type: "spring" }}
                        className={`flex items-center p-4 rounded-xl border border-slate-200 cursor-pointer transition-all duration-300 ${
                          answers[q.id] === oIndex
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-600'
                            : 'hover:bg-slate-50'
                        }`}
                        style={{ background: 'var(--bg-light)' }}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[q.id] === oIndex}
                          onChange={() => setAnswers({ ...answers, [q.id]: oIndex })}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-3 font-medium text-slate-700 flex-1">{opt}</span>
                        <svg className="w-4 h-4 text-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="bg-white border-t border-slate-200 px-6 py-4 shadow-sm"
        >
          <button
            onClick={handleSubmitExam}
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring" }}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 transition-all duration-300"
          >
            {isSubmitting ? 'Submitting...' : 'Final Submit Exam'}
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // --- RENDER: MAIN PAGE ---
  return (
    <motion.div className="min-h-screen bg-slate-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tighter">
              <Menu className="w-5 h-5 text-indigo-600 mr-2" /> Computer-Based Testing
            </h1>
            <p className="text-slate-500 text-sm mt-1">Advanced CBT Engine with Anti-Cheat</p>
          </div>

          {role === 'TEACHER' && (
            <motion.button
              onClick={() => setIsCreateOpen(true)}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring" }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
            >
              <FolderAdd className="w-4 h-4" /> Create Exam
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Stats & Exams Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
        className="px-6 py-8"
      >
        {role === 'TEACHER' && (
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-xl"
            >
              <h3 className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-1">Total Exams</h3>
              <p className="text-3xl font-bold text-slate-900">{exams.length}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-xl"
            >
              <h3 className="text-sm font-medium text-emerald-600 uppercase tracking-wider mb-1">Active Attempts</h3>
              <p className="text-3xl font-bold text-slate-900">{activeAttempt ? '1 in progress' : '0'}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-xl"
            >
              <h3 className="text-sm font-medium text-amber-600 uppercase tracking-wider mb-1">Total Questions</h3>
              <p className="text-3xl font-bold text-slate-900">{questions.length}</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-slate-50 border-l-4 border-slate-600 p-4 rounded-xl"
            >
              <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wider mb-1">Total Students</h3>
              <p className="text-3xl font-bold text-slate-900">Loading...</p>
            </motion.div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(e => (
            <motion.div
              key={e.id}
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40"
              style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{e.title}</h3>
                  <p className="text-sm text-slate-500 mb-2">{e.class.name} - {e.class.section}</p>
                  <p className="text-xs text-slate-400">⏱ {e.duration} mins • 🏆 {e.totalMarks} marks</p>
                </div>

                {role === 'TEACHER' ? (
                  <motion.button
                    onClick={() => viewResults(e.id)}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring" }}
                    className="mt-2 w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    View Results
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => startExam(e.id)}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring" }}
                    className="mt-2 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Start Exam
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CREATE EXAM MODAL */}
        {isCreateOpen && (
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
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FolderAdd className="w-5 h-5 text-indigo-500" /> Create Exam
              </h2>

              <form onSubmit={handleCreateExam} className="space-y-6">
                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Exam Title</label>
                  <input
                    required
                    placeholder="Final Exam - Semester 1"
                    value={examData.title}
                    onChange={(e) => setExamData({...examData, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </motion.div>

                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Class</label>
                  <select
                    value={examData.classId}
                    onChange={(e) => setExamData({...examData, classId: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
                  >
                    <option value="" disabled>Select a class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                    ))}
                  </select>
                </motion.div>

                <motion.div className="grid grid-cols-3 gap-4">
                  <input
                    required
                    type="number"
                    placeholder="Duration (mins)"
                    value={examData.duration}
                    onChange={(e) => setExamData({...examData, duration: Number(e.target.value)})}
                    className="px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                  <input
                    required
                    type="datetime-local"
                    placeholder="Start Time"
                    value={examData.startTime}
                    onChange={(e) => setExamData({...examData, startTime: e.target.value})}
                    className="px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                  <input
                    required
                    type="datetime-local"
                    placeholder="End Time"
                    value={examData.endTime}
                    onChange={(e) => setExamData({...examData, endTime: e.target.value})}
                    className="px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </motion.div>

                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Questions</label>
                  <p className="text-xs text-slate-500 mb-2">Add questions below</p>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="w-full py-2 px-3 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    + Add Question
                  </button>
                </motion.div>

                {questions.map((q, qIndex) => (
                  <motion.div
                    key={qIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: qIndex * 0.03 }}
                    className="bg-slate-50 p-4 rounded-lg mb-4 border"
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    <input
                      required
                      placeholder="Question text"
                      value={q.text}
                      onChange={(e) => updateQ(qIndex, 'text', e.target.value)}
                      className="w-full px-3 py-2 border rounded mb-2 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt: string, oIndex: number) => (
                        <div
                          key={oIndex}
                          className="flex items-center gap-2"
                          style={{ background: 'var(--bg-light)' }}
                        >
                          <input
                            type="radio"
                            checked={q.correctOption === oIndex}
                            onChange={() => updateQ(qIndex, 'correctOption', oIndex)}
                            className="w-3 h-3 text-indigo-600 focus:ring-indigo-500"
                          />
                          <input
                            required
                            placeholder={`Option ${oIndex + 1}`}
                            value={opt}
                            onChange={(e) => updateOpt(qIndex, oIndex, e.target.value)}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}

                <motion.div className="flex justify-end gap-3 pt-6 border-t">
                  <motion.button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring" }}
                    className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="px-5 py-3 text-sm font-medium bg-indigo-600 text-white rounded-xl transition-all"
                  >
                    Publish Exam
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* VIEW RESULTS MODAL */}
        {viewingResults && (
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
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-emerald-500" /> Exam Results
              </h2>

              <motion.table className="w-full text-left">
                <motion.thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <motion.tr>
                    <motion.th className="py-3 px-4">Student</motion.th>
                    <motion.th className="py-3 px-4">Score</motion.th>
                    <motion.th className="py-3 px-4">Status</motion.th>
                    <motion.th className="py-3 px-4 text-right">Actions</motion.th>
                  </motion.tr>
                </motion.thead>
                <motion.tbody className="divide-y divide-slate-100 text-sm">
                  {results.map(r => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                      className="hover:bg-slate-50"
                    >
                      <motion.td className="py-3 px-4 font-medium">
                        {r.student.firstName} {r.student.lastName}
                      </motion.td>
                      <motion.td className="py-3 px-4 font-bold text-emerald-600">
                        {r.score}
                      </motion.td>
                      <motion.td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          r.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {r.status}
                        </span>
                      </motion.td>
                      <motion.td className="py-3 px-4 text-right">
                        <motion.button
                          className="text-indigo-600 font-semibold text-sm hover:underline transition-colors"
                        >
                          Details
                        </motion.button>
                      </motion.td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </motion.table>

              <motion.div className="mt-6 flex justify-end gap-3">
                <motion.button
                  onClick={() => setViewingResults(null)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring" }}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Close
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}