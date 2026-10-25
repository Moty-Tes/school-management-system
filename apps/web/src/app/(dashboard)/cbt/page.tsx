'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';

export default function CBTPage() {
  const [role, setRole] = useState<string>('');
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  // Teacher State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [examData, setExamData] = useState({ title: '', classId: '', duration: 30, startTime: '', endTime: '' });
  const [questions, setQuestions] = useState<any[]>([]);
  const [viewingResults, setViewingResults] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);

  // Student State
  const [activeAttempt, setActiveAttempt] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cheatingLogged = useRef(false);

  async function loadData() {
    const meData: any = await getMe();
    const isTeacher = meData.roles?.includes('TEACHER') || meData.roles?.includes('TENANT_ADMIN');
    setRole(isTeacher ? 'TEACHER' : 'STUDENT');
    
    // In a real app, you'd fetch exams for the specific class. Here we fetch all for demo.
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
        cheatingLogged.current = true; // Prevent spamming the API
        api.post('/api/v1/cbt/log-cheat', { attemptId: activeAttempt.attemptId }).catch(console.error);
      }
    };

    const handleBlur = () => {
      if (!cheatingLogged.current) {
        cheatingLogged.current = true;
        api.post('/api/v1/cbt/log-cheat', { attemptId: activeAttempt.attemptId }).catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [activeAttempt]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (!activeAttempt) return;
    if (timeLeft <= 0) {
      handleSubmitExam(); // Auto-submit on time up
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
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
    await api.post('/api/v1/cbt', { ...examData, questions });
    setIsCreateOpen(false);
    alert('Exam created successfully!');
  }
  async function viewResults(examId: string) {
    setViewingResults(examId);
    const data = await api.get<any[]>(`/api/v1/cbt/${examId}/results`);
    setResults(data);
  }

  // --- STUDENT LOGIC ---
  async function startExam(examId: string) {
    try {
      const res = await api.post<any>(`/api/v1/cbt/${examId}/start`);
      setActiveAttempt(res);
      setTimeLeft(res.duration * 60);
      setAnswers({});
      cheatingLogged.current = false;
    } catch (err: any) {
      alert(err.message); // "Already taken"
    }
  }
  async function handleSubmitExam() {
    if (!activeAttempt || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const answerArray = Object.keys(answers).map(qId => ({ questionId: qId, selectedOption: answers[qId] }));
      const res = await api.post<any>('/api/v1/cbt/submit', { attemptId: activeAttempt.attemptId, answers: answerArray });
      alert(res.status === 'DISQUALIFIED' ? 'Exam Disqualified due to tab switching.' : `Exam Submitted! Score: ${res.score}`);
      setActiveAttempt(null);
    } catch {
      alert('Failed to submit exam');
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- RENDER: ACTIVE EXAM PLAYER ---
  if (activeAttempt) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm flex justify-between items-center sticky top-20 z-10">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Active Exam</h1>
            <p className="text-red-600 font-bold text-sm">⚠️ Do not switch tabs or you will be disqualified.</p>
          </div>
          <div className="text-3xl font-mono font-bold text-red-600 bg-red-50 px-6 py-2 rounded-xl">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </div>

        {activeAttempt.questions.map((q: any, i: number) => (
          <div key={q.id} className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Q{i + 1}: {q.text} <span className="text-xs text-slate-400 font-normal">({q.marks} marks)</span></h3>
            <div className="space-y-2">
              {q.options.map((opt: string, oIndex: number) => (
                <label key={oIndex} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${answers[q.id] === oIndex ? 'bg-indigo-50 border-indigo-600' : 'hover:bg-slate-50'}`}>
                  <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === oIndex} onChange={() => setAnswers({ ...answers, [q.id]: oIndex })} className="w-4 h-4 text-indigo-600" />
                  <span className="ml-3 font-medium text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <button onClick={handleSubmitExam} disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50">
          {isSubmitting ? 'Submitting...' : 'Final Submit Exam'}
        </button>
      </div>
    );
  }

  // --- RENDER: MAIN PAGE ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Computer-Based Testing</h1>
          <p className="text-slate-500 text-sm mt-1">Advanced CBT Engine with Anti-Cheat</p>
        </div>
        {role === 'TEACHER' && (
          <button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Create Exam</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map(e => (
          <div key={e.id} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-900">{e.title}</h3>
            <p className="text-sm text-slate-500 mb-4">{e.class.name} - {e.class.section}</p>
            <div className="flex justify-between text-xs font-semibold text-slate-500 bg-slate-50 p-2 rounded mb-4">
              <span>⏱ {e.duration} mins</span>
              <span>🏆 {e.totalMarks} marks</span>
            </div>
            {role === 'TEACHER' ? (
              <button onClick={() => viewResults(e.id)} className="mt-auto w-full bg-slate-900 text-white py-2 rounded-lg text-sm hover:bg-slate-800">View Results</button>
            ) : (
              <button onClick={() => startExam(e.id)} className="mt-auto w-full bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700">Start Exam</button>
            )}
          </div>
        ))}
      </div>

      {/* CREATE EXAM MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 my-8">
            <h2 className="text-xl font-bold mb-4">Create Exam</h2>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Exam Title" value={examData.title} onChange={e => setExamData({...examData, title: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                <select value={examData.classId} onChange={e => setExamData({...examData, classId: e.target.value})} className="px-3 py-2 border rounded-lg text-sm">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <input required type="number" placeholder="Duration (mins)" value={examData.duration} onChange={e => setExamData({...examData, duration: Number(e.target.value)})} className="px-3 py-2 border rounded-lg text-sm" />
                <input required type="datetime-local" value={examData.startTime} onChange={e => setExamData({...examData, startTime: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
                <input required type="datetime-local" value={examData.endTime} onChange={e => setExamData({...examData, endTime: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Questions</h3>
                  <button type="button" onClick={addQuestion} className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded">+ Add Question</button>
                </div>
                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="bg-slate-50 p-4 rounded-lg mb-4 border">
                    <input required placeholder="Question text" value={q.text} onChange={e => updateQ(qIndex, 'text', e.target.value)} className="w-full px-3 py-2 border rounded mb-2 text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt: string, oIndex: number) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input type="radio" checked={q.correctOption === oIndex} onChange={() => updateQ(qIndex, 'correctOption', oIndex)} required />
                          <input required placeholder={`Option ${oIndex + 1}`} value={opt} onChange={e => updateOpt(qIndex, oIndex, e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Publish Exam</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW RESULTS MODAL */}
      {viewingResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Exam Results</h2>
            <table className="w-full text-left border-collapse text-sm mb-4">
              <thead className="bg-slate-50 border-b">
                <tr><th className="p-2">Student</th><th className="p-2">Score</th><th className="p-2">Status</th><th className="p-2 text-red-600">Cheat Flags</th></tr>
              </thead>
              <tbody className="divide-y">
                {results.map(r => (
                  <tr key={r.id}>
                    <td className="p-2 font-medium">{r.student.firstName} {r.student.lastName}</td>
                    <td className="p-2 font-bold text-indigo-600">{r.score}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                    </td>
                    <td className="p-2 font-mono text-red-600 font-bold">{r.tabSwitches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setViewingResults(null)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}