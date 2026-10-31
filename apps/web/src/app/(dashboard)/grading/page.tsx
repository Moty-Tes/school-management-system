'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Plus, CheckCircle, AlertCircle, Save, Sparkles, 
  Settings2, ChevronRight, GraduationCap, Award, HelpCircle,
  FolderPlus, Trash2, Edit2, Loader2, Check, RefreshCw
} from 'lucide-react';
import { sonner } from '@/components/sonner';

interface ClassItem {
  id: string;
  name: string;
  section: string;
}

interface AssessmentItem {
  id: string;
  title: string;
  maxScore: number;
  date: string;
  classId: string;
}

interface StudentGradeRow {
  studentId: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  score: string | number;
}

interface GradeScaleRule {
  grade: string;
  minPercent: number;
  maxPercent: number;
  remark: string;
}

interface GradingScale {
  id: string;
  name: string;
  isDefault: boolean;
  rules: GradeScaleRule[];
}

export default function GradingPage() {
  const [activeTab, setActiveTab] = useState<'gradebook' | 'scales'>('gradebook');

  // --- Gradebook States ---
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [students, setStudents] = useState<StudentGradeRow[]>([]);
  const [loadingGradebook, setLoadingGradebook] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);

  // --- New Assessment Modal ---
  const [isNewAssessmentOpen, setIsNewAssessmentOpen] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    maxScore: 100,
    date: new Date().toISOString().split('T')[0],
  });

  // --- Grading Scales States ---
  const [scales, setScales] = useState<GradingScale[]>([]);
  const [isCreateScaleOpen, setIsCreateScaleOpen] = useState(false);
  const [scaleName, setScaleName] = useState('Standard Scale');
  const [rules, setRules] = useState<GradeScaleRule[]>([
    { grade: 'A', minPercent: 90, maxPercent: 100, remark: 'Excellent' },
    { grade: 'B', minPercent: 80, maxPercent: 89, remark: 'Very Good' },
    { grade: 'C', minPercent: 70, maxPercent: 79, remark: 'Good' },
    { grade: 'D', minPercent: 60, maxPercent: 69, remark: 'Satisfactory' },
    { grade: 'F', minPercent: 0, maxPercent: 59, remark: 'Needs Improvement' },
  ]);

  // Load classes and scales initially
  useEffect(() => {
    async function init() {
      try {
        const [classesData, scalesData] = await Promise.all([
          api.get<ClassItem[]>('/api/v1/classes').catch(() => []),
          api.get<GradingScale[]>('/api/v1/grading').catch(() => [])
        ]);

        setClasses(classesData || []);
        setScales(scalesData || []);

        if (classesData && classesData.length > 0) {
          setSelectedClassId(classesData[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }
    init();
  }, []);

  // When class changes, load assessments for that class
  useEffect(() => {
    if (!selectedClassId) return;

    async function loadAssessments() {
      try {
        const list = await api.get<AssessmentItem[]>(`/api/v1/assessments?classId=${selectedClassId}`);
        setAssessments(list || []);

        if (list && list.length > 0) {
          setSelectedAssessmentId(list[0].id);
        } else {
          setSelectedAssessmentId('');
          setStudents([]);
        }
      } catch (err) {
        console.error('Failed to load assessments:', err);
      }
    }

    loadAssessments();
  }, [selectedClassId]);

  // When assessment changes, load students in the class + their existing grades
  useEffect(() => {
    if (!selectedClassId || !selectedAssessmentId) {
      setStudents([]);
      return;
    }

    async function loadStudentsAndGrades() {
      setLoadingGradebook(true);
      try {
        const [allStudents, existingGrades] = await Promise.all([
          api.get<any[]>('/api/v1/students').catch(() => []),
          api.get<{ studentId: string; score: number }[]>(`/api/v1/assessments/${selectedAssessmentId}/grades`).catch(() => [])
        ]);

        const classStudents = allStudents.filter(s => s.classId === selectedClassId);

        const rows: StudentGradeRow[] = classStudents.map(s => {
          const match = existingGrades.find(g => g.studentId === s.id);
          return {
            studentId: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            admissionNumber: s.admissionNumber,
            score: match !== undefined ? match.score : '',
          };
        });

        setStudents(rows);
      } catch (err) {
        console.error('Failed to load student grades:', err);
        sonner.error('Failed to load grade roster');
      } finally {
        setLoadingGradebook(false);
      }
    }

    loadStudentsAndGrades();
  }, [selectedClassId, selectedAssessmentId]);

  // Current selected assessment object
  const currentAssessment = assessments.find(a => a.id === selectedAssessmentId);
  const maxScore = currentAssessment?.maxScore || 100;

  // Calculate grade letter based on score
  function getGradeLetter(score: number | string): { grade: string; color: string; remark: string } {
    if (score === '' || isNaN(Number(score))) {
      return { grade: '—', color: 'text-slate-400 bg-slate-100', remark: 'Not Graded' };
    }
    const percent = Math.round((Number(score) / maxScore) * 100);

    // Use default scale rules if available
    const defaultScale = scales.find(s => s.isDefault) || scales[0];
    const rulesList = defaultScale?.rules || rules;

    const matched = rulesList.find(r => percent >= r.minPercent && percent <= r.maxPercent);

    if (matched) {
      if (percent >= 80) return { grade: matched.grade, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', remark: matched.remark };
      if (percent >= 60) return { grade: matched.grade, color: 'text-blue-700 bg-blue-50 border-blue-200', remark: matched.remark };
      if (percent >= 50) return { grade: matched.grade, color: 'text-amber-700 bg-amber-50 border-amber-200', remark: matched.remark };
      return { grade: matched.grade, color: 'text-rose-700 bg-rose-50 border-rose-200', remark: matched.remark };
    }

    if (percent >= 90) return { grade: 'A', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', remark: 'Excellent' };
    if (percent >= 80) return { grade: 'B', color: 'text-blue-700 bg-blue-50 border-blue-200', remark: 'Very Good' };
    if (percent >= 70) return { grade: 'C', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', remark: 'Good' };
    if (percent >= 60) return { grade: 'D', color: 'text-amber-700 bg-amber-50 border-amber-200', remark: 'Pass' };
    return { grade: 'F', color: 'text-rose-700 bg-rose-50 border-rose-200', remark: 'Fail' };
  }

  // Handle score change
  function handleScoreChange(studentId: string, val: string) {
    let cleanVal: string | number = val;
    if (val !== '') {
      const num = Number(val);
      if (num < 0) cleanVal = 0;
      else if (num > maxScore) cleanVal = maxScore;
      else cleanVal = num;
    }

    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, score: cleanVal } : s));
  }

  // Save all entered grades
  async function handleSaveGrades() {
    if (!selectedAssessmentId) {
      sonner.error('Please select an assessment first');
      return;
    }

    setSavingGrades(true);
    try {
      const validRecords = students
        .filter(s => s.score !== '')
        .map(s => ({
          studentId: s.studentId,
          score: Number(s.score)
        }));

      await api.post('/api/v1/assessments/grades', {
        assessmentId: selectedAssessmentId,
        grades: validRecords,
        records: validRecords,
      });

      sonner.success(`Successfully saved grades for ${validRecords.length} students!`);
    } catch (err: any) {
      console.error('Failed to save grades:', err);
      sonner.error(err.message || 'Failed to save grades');
    } finally {
      setSavingGrades(false);
    }
  }

  // Quick fill buttons
  function quickFillPassing() {
    const passScore = Math.round(maxScore * 0.75);
    setStudents(prev => prev.map(s => ({ ...s, score: passScore })));
    sonner.info(`Set all student scores to ${passScore}/${maxScore} (75%)`);
  }

  function quickClearAll() {
    setStudents(prev => prev.map(s => ({ ...s, score: '' })));
    sonner.info('Cleared all score inputs');
  }

  // Create new assessment
  async function handleCreateAssessment(e: FormEvent) {
    e.preventDefault();
    if (!selectedClassId) {
      sonner.error('Please select a class first');
      return;
    }

    try {
      const created = await api.post<AssessmentItem>('/api/v1/assessments', {
        classId: selectedClassId,
        title: newAssessment.title,
        maxScore: Number(newAssessment.maxScore),
        date: newAssessment.date,
      });

      sonner.success(`Created assessment "${newAssessment.title}"`);
      setIsNewAssessmentOpen(false);
      setNewAssessment({ title: '', maxScore: 100, date: new Date().toISOString().split('T')[0] });

      // Refresh assessments
      const list = await api.get<AssessmentItem[]>(`/api/v1/assessments?classId=${selectedClassId}`);
      setAssessments(list || []);
      if (created?.id) {
        setSelectedAssessmentId(created.id);
      }
    } catch (err: any) {
      sonner.error(err.message || 'Failed to create assessment');
    }
  }

  // --- Scales Handlers ---
  function addRule() {
    setRules([...rules, { grade: '', minPercent: 0, maxPercent: 0, remark: '' }]);
  }

  function updateRule(index: number, field: keyof GradeScaleRule, value: any) {
    const next = [...rules];
    next[index] = { ...next[index], [field]: value };
    setRules(next);
  }

  function removeRule(index: number) {
    setRules(rules.filter((_, i) => i !== index));
  }

  async function handleCreateScale(e: FormEvent) {
    e.preventDefault();
    try {
      const sortedRules = [...rules].sort((a, b) => b.minPercent - a.minPercent);
      await api.post('/api/v1/grading', { name: scaleName, rules: sortedRules });
      setIsCreateScaleOpen(false);
      sonner.success('Grading scale created successfully');
      const data = await api.get<GradingScale[]>('/api/v1/grading');
      setScales(data || []);
    } catch (err: any) {
      sonner.error(err.message || 'Failed to create grading scale');
    }
  }

  async function setDefaultScale(id: string) {
    try {
      await api.patch(`/api/v1/grading/${id}/default`);
      sonner.success('Default scale updated');
      const data = await api.get<GradingScale[]>('/api/v1/grading');
      setScales(data || []);
    } catch (err: any) {
      sonner.error(err.message || 'Failed to update default scale');
    }
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Top Banner Header */}
      <div className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-r from-slate-950 via-[#10142b] to-[#1e1336]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/10">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>Academic Performance & Scoring</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Gradebook & Academic Rules</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Enter student test and exam marks, calculate letter grades, and manage institutional grading scales.
            </p>
          </div>

          {/* Tab Switcher Pills */}
          <div className="flex bg-white/10 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('gradebook')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'gradebook'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Enter Grades</span>
            </button>
            <button
              onClick={() => setActiveTab('scales')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'scales'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span>Grading Scales</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: GRADEBOOK & ENTER GRADES */}
      {/* ==================================================================== */}
      {activeTab === 'gradebook' && (
        <div className="space-y-6">
          {/* Filter & Controls Card */}
          <div className="glass-card rounded-3xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Select Class */}
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

              {/* Select Assessment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Select Assessment
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedAssessmentId}
                    onChange={(e) => setSelectedAssessmentId(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl glass-input text-sm font-semibold text-slate-800"
                    disabled={assessments.length === 0}
                  >
                    {assessments.length === 0 ? (
                      <option value="">No assessments created yet</option>
                    ) : (
                      assessments.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.title} (Max: {a.maxScore})
                        </option>
                      ))
                    )}
                  </select>

                  <button
                    onClick={() => setIsNewAssessmentOpen(true)}
                    className="px-3 py-2.5 rounded-xl glass-button-primary text-xs font-bold flex items-center gap-1.5 shrink-0"
                    title="Create new assessment"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={quickFillPassing}
                  disabled={students.length === 0}
                  className="px-3 py-2.5 rounded-xl glass-button-secondary text-xs font-semibold disabled:opacity-50"
                  title="Auto-fill 75% for all students"
                >
                  Fill 75%
                </button>
                <button
                  onClick={quickClearAll}
                  disabled={students.length === 0}
                  className="px-3 py-2.5 rounded-xl glass-button-secondary text-xs font-semibold disabled:opacity-50"
                  title="Clear all scores"
                >
                  Clear
                </button>
                <button
                  onClick={handleSaveGrades}
                  disabled={students.length === 0 || savingGrades}
                  className="flex-1 px-4 py-2.5 rounded-xl glass-button-primary text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                >
                  {savingGrades ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save All Grades</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Student Roster Table Card */}
          <div className="glass-card rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {currentAssessment ? currentAssessment.title : 'Grade Roster'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter student marks (Max Score: <span className="font-bold text-indigo-600">{maxScore}</span>). Letter grade and remark are calculated live.
                </p>
              </div>

              {currentAssessment && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
                  <span>Due: {new Date(currentAssessment.date).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {loadingGradebook ? (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-sm">Loading student roster...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="p-16 text-center text-slate-500">
                <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Students or Assessments Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {assessments.length === 0 
                    ? 'Create your first assessment using the "New" button above to start grading.'
                    : 'No enrolled students found in this class.'}
                </p>
                {assessments.length === 0 && (
                  <button
                    onClick={() => setIsNewAssessmentOpen(true)}
                    className="mt-4 px-4 py-2 rounded-xl glass-button-primary text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Assessment</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3.5 px-6">Student</th>
                      <th className="py-3.5 px-4">Admission #</th>
                      <th className="py-3.5 px-6">Score (Out of {maxScore})</th>
                      <th className="py-3.5 px-4">Percentage</th>
                      <th className="py-3.5 px-4">Grade</th>
                      <th className="py-3.5 px-6">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student, idx) => {
                      const gradeInfo = getGradeLetter(student.score);
                      const percent = student.score !== '' ? Math.round((Number(student.score) / maxScore) * 100) : null;

                      return (
                        <tr key={student.studentId} className="hover:bg-slate-50/60 transition-colors">
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

                          <td className="py-3 px-6">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={maxScore}
                                value={student.score}
                                onChange={(e) => handleScoreChange(student.studentId, e.target.value)}
                                placeholder="0"
                                className="w-24 px-3 py-1.5 rounded-xl glass-input text-sm font-bold text-slate-800 text-center"
                              />
                              <span className="text-xs text-slate-400 font-semibold">/ {maxScore}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-xs font-bold text-slate-700">
                            {percent !== null ? `${percent}%` : '—'}
                          </td>

                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold border ${gradeInfo.color}`}>
                              {gradeInfo.grade}
                            </span>
                          </td>

                          <td className="py-3 px-6 text-xs font-medium text-slate-500">
                            {gradeInfo.remark}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: GRADING SCALES DEFINITION */}
      {/* ==================================================================== */}
      {activeTab === 'scales' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Grading Scale Rules</h2>
              <p className="text-xs text-slate-500">Define score thresholds for report cards and GPA calculations</p>
            </div>
            <button
              onClick={() => setIsCreateScaleOpen(true)}
              className="px-4 py-2.5 rounded-xl glass-button-primary text-xs font-bold flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create New Scale</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scales.map((s) => (
              <div key={s.id} className="glass-card rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{s.name}</h3>
                    <p className="text-xs text-slate-400">{s.rules?.length || 0} Grade boundaries</p>
                  </div>
                  {s.isDefault ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ACTIVE DEFAULT
                    </span>
                  ) : (
                    <button
                      onClick={() => setDefaultScale(s.id)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {s.rules?.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-8 font-black text-slate-900 text-sm">{r.grade}</span>
                        <span className="font-mono text-slate-600 font-bold">{r.minPercent}% - {r.maxPercent}%</span>
                      </div>
                      <span className="text-slate-500 font-medium">{r.remark}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CREATE ASSESSMENT */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isNewAssessmentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md p-6 rounded-3xl shadow-2xl"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <span>Create New Assessment</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">Add a new test, quiz, or exam for this class to grade students.</p>

              <form onSubmit={handleCreateAssessment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Assessment Title
                  </label>
                  <input
                    required
                    type="text"
                    value={newAssessment.title}
                    onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                    placeholder="e.g. Midterm Examination"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Max Score
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      max={1000}
                      value={newAssessment.maxScore}
                      onChange={(e) => setNewAssessment({ ...newAssessment, maxScore: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Date
                    </label>
                    <input
                      required
                      type="date"
                      value={newAssessment.date}
                      onChange={(e) => setNewAssessment({ ...newAssessment, date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewAssessmentOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl glass-button-secondary text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl glass-button-primary text-xs font-bold shadow-md shadow-indigo-500/20"
                  >
                    Create & Start Grading
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* MODAL: CREATE SCALE */}
      {/* ==================================================================== */}
      <AnimatePresence>
        {isCreateScaleOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-xl p-6 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                <span>Create Grading Scale</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">Define letter grades, percentage boundaries, and remarks.</p>

              <form onSubmit={handleCreateScale} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Scale Name
                  </label>
                  <input
                    required
                    type="text"
                    value={scaleName}
                    onChange={(e) => setScaleName(e.target.value)}
                    placeholder="e.g. Cambridge IGCSE Scale"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Grade Rules
                    </label>
                    <button
                      type="button"
                      onClick={addRule}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      + Add Row
                    </button>
                  </div>

                  <div className="space-y-2">
                    {rules.map((rule, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          required
                          type="text"
                          value={rule.grade}
                          onChange={(e) => updateRule(idx, 'grade', e.target.value)}
                          placeholder="Grade"
                          className="w-16 px-2.5 py-1.5 rounded-lg glass-input text-xs font-bold text-center"
                        />
                        <input
                          required
                          type="number"
                          value={rule.minPercent}
                          onChange={(e) => updateRule(idx, 'minPercent', Number(e.target.value))}
                          placeholder="Min %"
                          className="w-20 px-2.5 py-1.5 rounded-lg glass-input text-xs text-center"
                        />
                        <input
                          required
                          type="number"
                          value={rule.maxPercent}
                          onChange={(e) => updateRule(idx, 'maxPercent', Number(e.target.value))}
                          placeholder="Max %"
                          className="w-20 px-2.5 py-1.5 rounded-lg glass-input text-xs text-center"
                        />
                        <input
                          type="text"
                          value={rule.remark}
                          onChange={(e) => updateRule(idx, 'remark', e.target.value)}
                          placeholder="Remark"
                          className="flex-1 px-2.5 py-1.5 rounded-lg glass-input text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeRule(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateScaleOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl glass-button-secondary text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl glass-button-primary text-xs font-bold shadow-md shadow-indigo-500/20"
                  >
                    Save Scale
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
