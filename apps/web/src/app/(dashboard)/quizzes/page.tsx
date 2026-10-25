'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  
  // Create Quiz Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [duration, setDuration] = useState(15);
  const [questions, setQuestions] = useState<any[]>([]);

  // Take Quiz Mode
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizResult, setQuizResult] = useState<any>(null);

  async function loadData() {
    const [meData, classesData, quizzesData] = await Promise.all([
      getMe(),
      api.get<any[]>('/api/v1/classes'),
      api.get<any[]>('/api/v1/quizzes')
    ]);
    setRole((meData as any).roles?.includes('TEACHER') ? 'TEACHER' : 'STUDENT');
    setClasses(classesData);
    setQuizzes(quizzesData);
    if (classesData.length > 0) setClassId(classesData[0].id);
  }

  useEffect(() => { loadData(); }, []);

  // Timer Logic
  useEffect(() => {
    if (!activeQuiz || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit(); // Time is up!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, timeLeft]);

  // --- TEACHER LOGIC ---
  function addQuestion() {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctIndex: 0 }]);
  }

  function updateQuestion(qIndex: number, field: string, value: any) {
    const newQs = [...questions];
    if (field === 'text') newQs[qIndex].text = value;
    if (field === 'correctIndex') newQs[qIndex].correctIndex = Number(value);
    setQuestions(newQs);
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    const newQs = [...questions];
    newQs[qIndex].options[oIndex] = value;
    setQuestions(newQs);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/quizzes', { title, classId, duration, questions });
    setIsCreateOpen(false);
    setQuestions([]);
    loadData();
  }

  // --- STUDENT LOGIC ---
  async function startQuiz(quiz: any) {
    try {
      const fullQuiz = await api.get<any>(`/api/v1/quizzes/${quiz.id}/take`);
      setActiveQuiz(fullQuiz);
      setAnswers(new Array(fullQuiz.questions.length).fill(-1));
      setTimeLeft(fullQuiz.duration * 60);
      setQuizResult(null);
    } catch (err: any) {
      alert(err.message); // "Already taken" error
    }
  }

  async function handleAutoSubmit() {
    if (!activeQuiz) return;
    const res = await api.post<any>(`/api/v1/quizzes/${activeQuiz.id}/submit`, { answers });
    setQuizResult(res);
    setActiveQuiz(null);
    loadData();
  }

  // --- RENDER: EXAM MODE ---
  if (activeQuiz) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm flex justify-between items-center sticky top-20 z-10">
          <h1 className="text-xl font-bold text-slate-900">{activeQuiz.title}</h1>
          <div className="text-2xl font-mono font-bold text-red-600 bg-red-50 px-4 py-2 rounded-lg">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </div>

        {activeQuiz.questions.map((q: any, qIndex: number) => (
          <div key={qIndex} className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Question {qIndex + 1}: {q.text}</h3>
            <div className="space-y-2">
              {q.options.map((opt: string, oIndex: number) => (
                <label key={oIndex} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${answers[qIndex] === oIndex ? 'bg-indigo-50 border-indigo-600' : 'hover:bg-slate-50'}`}>
                  <input 
                    type="radio" 
                    name={`q-${qIndex}`} 
                    checked={answers[qIndex] === oIndex}
                    onChange={() => {
                      const newAns = [...answers];
                      newAns[qIndex] = oIndex;
                      setAnswers(newAns);
                    }}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="ml-3 font-medium text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <button onClick={handleAutoSubmit} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors">
          Submit Quiz
        </button>
      </div>
    );
  }

  // --- RENDER: MAIN PAGE ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Online Quizzes</h1>
          <p className="text-slate-500 text-sm mt-1">Computer-based testing</p>
        </div>
        {role === 'TEACHER' && (
          <button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Create Quiz
          </button>
        )}
      </div>

      {quizResult && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center">
          <h2 className="text-2xl font-bold text-emerald-800">Quiz Completed!</h2>
          <p className="text-emerald-600 mt-2 text-lg">Your Score: <span className="font-bold text-2xl">{quizResult.score}</span></p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quizzes.map(q => (
          <div key={q.id} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-slate-900">{q.title}</h3>
            <p className="text-sm text-slate-500 mb-4">{q.class.name} - {q.class.section}</p>
            <div className="flex justify-between text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded">
              <span>⏱ {q.duration} mins</span>
              <span>🏆 {q.totalMarks} marks</span>
            </div>
            <div className="mt-auto">
              {role === 'TEACHER' ? (
                <p className="text-sm font-semibold text-indigo-600">{q._count.attempts} Students submitted</p>
              ) : (
                <button onClick={() => startQuiz(q)} className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm hover:bg-slate-800">
                  Start Quiz
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE QUIZ MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 my-8">
            <h2 className="text-xl font-bold mb-4">Create Online Quiz</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Title</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Class</label>
                  <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Duration (Minutes)</label>
                <input required type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900">Questions</h3>
                  <button type="button" onClick={addQuestion} className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded">+ Add Question</button>
                </div>
                
                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-200">
                    <input required type="text" placeholder={`Question ${qIndex + 1}`} value={q.text} onChange={e => updateQuestion(qIndex, 'text', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mb-3" />
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt: string, oIndex: number) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input type="radio" checked={q.correctIndex === oIndex} onChange={() => updateQuestion(qIndex, 'correctIndex', oIndex)} required />
                          <input required type="text" placeholder={`Option ${oIndex + 1}`} value={opt} onChange={e => updateOption(qIndex, oIndex, e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Publish Quiz</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}