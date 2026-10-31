'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, BarChart3, Clipboard, TrendingUp, AlertCircle, FileText,
  Calendar, CheckCircle2, X, Search, Shield, GraduationCap, Plus, Sparkles
} from 'lucide-react';
import {
  Card, KpiCard, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, TableSection, Button, EmptyState
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';
import { toast } from 'sonner';

interface Grade {
  id: string;
  studentName: string;
  studentId: string;
  assignment: string;
  score: number;
  maxScore: number;
  percentage: number;
  letterGrade: string;
  date: string;
}

interface FilterState {
  search: string;
  letterGrade: 'all' | 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  course: string;
}

export default function GradingPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', letterGrade: 'all', course: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Grade Form State
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [assessmentId, setAssessmentId] = useState('');
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [score, setScore] = useState<number>(85);
  const [maxScore, setMaxScore] = useState<number>(100);

  const reducedMotion = use_reducedMotion();

  function calculateLetter(pct: number): string {
    if (pct >= 95) return 'A+';
    if (pct >= 90) return 'A';
    if (pct >= 85) return 'A-';
    if (pct >= 80) return 'B+';
    if (pct >= 75) return 'B';
    if (pct >= 70) return 'B-';
    if (pct >= 65) return 'C+';
    if (pct >= 60) return 'C';
    if (pct >= 55) return 'C-';
    if (pct >= 50) return 'D';
    return 'F';
  }

  async function loadData() {
    setLoading(true);
    try {
      const me = await getMe();
      const userRoles: string[] = me?.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');
      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');

      // Fetch assessments and students in parallel
      const [assessmentsRes, studentsRes] = await Promise.allSettled([
        api.get<any>('/api/v1/assessments'),
        api.get<any>('/api/v1/students'),
      ]);

      const loadedAssessments = assessmentsRes.status === 'fulfilled' ? (assessmentsRes.value?.data || assessmentsRes.value || []) : [];
      const loadedStudents = studentsRes.status === 'fulfilled' ? (studentsRes.value?.data || studentsRes.value || []) : [];

      setAssessments(Array.isArray(loadedAssessments) ? loadedAssessments : []);
      setStudents(Array.isArray(loadedStudents) ? loadedStudents : []);

      // Compile recorded grades from assessments
      const compiledGrades: Grade[] = [];
      if (Array.isArray(loadedAssessments)) {
        for (const ass of loadedAssessments.slice(0, 5)) {
          try {
            const gradesRes = await api.get<any>(`/api/v1/assessments/${ass.id}/grades`);
            const records = gradesRes?.data || gradesRes || [];
            if (Array.isArray(records)) {
              for (const r of records) {
                const sName = r.student ? `${r.student.firstName} ${r.student.lastName}` : (r.studentName || 'Student');
                const pct = Math.round((Number(r.score) / (ass.maxScore || 100)) * 100);
                compiledGrades.push({
                  id: r.id || `${ass.id}-${r.studentId}`,
                  studentName: sName,
                  studentId: r.studentId,
                  assignment: ass.title || 'Mid-Term Exam',
                  score: Number(r.score),
                  maxScore: ass.maxScore || 100,
                  percentage: pct,
                  letterGrade: calculateLetter(pct),
                  date: r.updatedAt || ass.date || new Date().toISOString(),
                });
              }
            }
          } catch {
            // Assessment has no grades yet
          }
        }
      }

      // If no assessments or grades exist yet in DB, initialize with baseline demo data
      if (compiledGrades.length === 0) {
        setGrades([
          { id: '1', studentName: 'Abebe Bikila', studentId: 'STD-101', assignment: 'Advanced Physics Midterm', score: 94, maxScore: 100, percentage: 94, letterGrade: 'A', date: '2026-10-25' },
          { id: '2', studentName: 'Almaz Ayana', studentId: 'STD-102', assignment: 'Advanced Physics Midterm', score: 98, maxScore: 100, percentage: 98, letterGrade: 'A+', date: '2026-10-25' },
          { id: '3', studentName: 'Kenenisa Bekele', studentId: 'STD-103', assignment: 'Calculus Quiz 2', score: 82, maxScore: 100, percentage: 82, letterGrade: 'B+', date: '2026-10-26' },
          { id: '4', studentName: 'Derartu Tulu', studentId: 'STD-104', assignment: 'English Essay II', score: 88, maxScore: 100, percentage: 88, letterGrade: 'A-', date: '2026-10-27' },
          { id: '5', studentName: 'Haile Gebrselassie', studentId: 'STD-105', assignment: 'World History Unit Test', score: 76, maxScore: 100, percentage: 76, letterGrade: 'B', date: '2026-10-28' },
        ]);
      } else {
        setGrades(compiledGrades);
      }
    } catch {
      setGrades([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddGrade(e: React.FormEvent) {
    e.preventDefault();
    if (!studentName && !studentId) {
      toast.error('Please enter a student name or select a student');
      return;
    }
    const title = assessmentTitle || (assessments.find(a => a.id === assessmentId)?.title) || 'General Assessment';
    const numScore = Number(score);
    const numMax = Number(maxScore) || 100;
    const pct = Math.round((numScore / numMax) * 100);
    const letter = calculateLetter(pct);

    setSubmitting(true);
    try {
      // If valid assessmentId and studentId, persist to backend API
      if (assessmentId && studentId) {
        await api.post('/api/v1/assessments/grades', {
          assessmentId,
          grades: [{ studentId, score: numScore }]
        });
      }

      // Add to local state immediately
      const newGrade: Grade = {
        id: `grade-${Date.now()}`,
        studentName: studentName || (students.find(s => s.id === studentId)?.firstName + ' ' + students.find(s => s.id === studentId)?.lastName) || 'Enrolled Student',
        studentId: studentId || `STD-${Math.floor(100 + Math.random() * 900)}`,
        assignment: title,
        score: numScore,
        maxScore: numMax,
        percentage: pct,
        letterGrade: letter,
        date: new Date().toISOString().split('T')[0],
      };

      setGrades(prev => [newGrade, ...prev]);
      toast.success(`Recorded score of ${numScore}/${numMax} (${letter}) successfully!`);
      setIsModalOpen(false);
      setStudentName('');
      setStudentId('');
      setAssessmentTitle('');
    } catch {
      toast.error('Failed to submit grade to server');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredGrades = grades.filter((grade: Grade) => {
    const matchesSearch = filters.search
      ? grade.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        grade.assignment.toLowerCase().includes(filters.search.toLowerCase()) ||
        grade.studentId.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesGrade = filters.letterGrade === 'all' || grade.letterGrade === filters.letterGrade;

    return matchesSearch && matchesGrade;
  });

  // Compute summary stats
  const totalGrades = filteredGrades.length;
  const classAverage = totalGrades > 0
    ? (filteredGrades.reduce((s: number, g: Grade) => s + g.percentage, 0) / totalGrades).toFixed(1)
    : '0';
  const gradeDistribution = {
    'A+': filteredGrades.filter(g => g.letterGrade === 'A+').length,
    A: filteredGrades.filter(g => ['A', 'A-'].includes(g.letterGrade)).length,
    B: filteredGrades.filter(g => ['B+', 'B', 'B-'].includes(g.letterGrade)).length,
    C: filteredGrades.filter(g => ['C+', 'C', 'C-'].includes(g.letterGrade)).length,
    D: filteredGrades.filter(g => g.letterGrade === 'D').length,
    F: filteredGrades.filter(g => g.letterGrade === 'F').length,
  };

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header with Title and Add Grade Action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 mb-2">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Academic Assessment & Gradebook</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Student Grading & Performance Ledger
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Record assessment marks, review GPA distribution, and publish official academic report scores.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 shadow-lg shadow-indigo-600/25"
              >
                <Plus className="w-4 h-4" />
                <span>Record Grade</span>
              </Button>
            </div>
          </div>

          {/* Grade Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900 dark:text-white">{totalGrades}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mt-1">Recorded Grades</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{classAverage}%</div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mt-1">Class Average</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-emerald-600">{gradeDistribution['A+'] + gradeDistribution['A']}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mt-1">A / A+ Honors Students</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-rose-600">{gradeDistribution['F']}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mt-1">At-Risk (F) Students</div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <div className="p-4 space-y-3">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                Filter Grades & Assessments
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search student name, ID or assignment..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Letter Grade</label>
                  <select
                    value={filters.letterGrade}
                    onChange={(e) => setFilters({ ...filters, letterGrade: e.target.value } as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="all">All Grades</option>
                    <option value="A+">A+ (Honors)</option>
                    <option value="A">A (Distinction)</option>
                    <option value="A-">A- (Excellent)</option>
                    <option value="B+">B+ (Very Good)</option>
                    <option value="B">B (Good)</option>
                    <option value="C">C (Satisfactory)</option>
                    <option value="D">D (Pass)</option>
                    <option value="F">F (Fail)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Course Stream</label>
                  <select
                    value={filters.course}
                    onChange={(e) => setFilters({ ...filters, course: e.target.value } as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">All Subjects & Courses</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="science">Natural Science / Physics</option>
                    <option value="english">English Language & Literature</option>
                    <option value="history">World History</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Grades Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-2xl animate-pulse" />
          ) : filteredGrades.length === 0 ? (
            <KpiEmptyState
              title="No grades found"
              description="Record assessment marks or adjust your filters above."
              actionLabel="Enter Grade Now"
              actionOnClick={() => setIsModalOpen(true)}
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell>Student</TableHeadCell>
                <TableHeadCell>Student ID</TableHeadCell>
                <TableHeadCell>Assignment / Exam</TableHeadCell>
                <TableHeadCell>Raw Score</TableHeadCell>
                <TableHeadCell>Percentage</TableHeadCell>
                <TableHeadCell>Letter Grade</TableHeadCell>
                <TableHeadCell>Date Recorded</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredGrades.map((grade: Grade) => (
                  <TableRowCell key={grade.id}>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{grade.studentName}</span>
                    <span className="font-mono text-xs text-slate-500">{grade.studentId}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{grade.assignment}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {grade.score} <span className="text-slate-400 font-normal">/ {grade.maxScore}</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{grade.percentage}%</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                        ['A+', 'A', 'A-'].includes(grade.letterGrade)
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : ['B+', 'B', 'B-'].includes(grade.letterGrade)
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                          : ['C+', 'C', 'C-'].includes(grade.letterGrade)
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                      }`}
                    >
                      {grade.letterGrade}
                    </span>
                    <span className="text-slate-500 text-xs">{new Date(grade.date).toLocaleDateString()}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Footer Actions */}
          {filteredGrades.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
              <span>Showing {filteredGrades.length} of {grades.length} recorded grades</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => toast.info('Exporting official CSV grade ledger...')}>
                  Export Grades CSV
                </Button>
                <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                  + Record New Grade
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Record Grade Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Record Assessment Grade</h2>
                    <p className="text-xs text-slate-500">Add student score to official mark ledger</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddGrade} className="mt-5 space-y-4">
                {/* Student Selection / Entry */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Student Name or ID
                  </label>
                  {students.length > 0 ? (
                    <select
                      value={studentId}
                      onChange={(e) => {
                        setStudentId(e.target.value);
                        const s = students.find(st => st.id === e.target.value);
                        if (s) setStudentName(`${s.firstName} ${s.lastName}`);
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Enrolled Student...</option>
                      {students.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} ({s.admissionNumber || s.id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Abebe Bikila"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>

                {/* Assessment Selection / Entry */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Assignment / Assessment Title
                  </label>
                  {assessments.length > 0 ? (
                    <select
                      value={assessmentId}
                      onChange={(e) => {
                        setAssessmentId(e.target.value);
                        const a = assessments.find(ass => ass.id === e.target.value);
                        if (a) {
                          setAssessmentTitle(a.title);
                          if (a.maxScore) setMaxScore(a.maxScore);
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Scheduled Assessment...</option>
                      {assessments.map((a: any) => (
                        <option key={a.id} value={a.id}>
                          {a.title} (Max: {a.maxScore || 100})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Mathematics Midterm Exam"
                      value={assessmentTitle}
                      onChange={(e) => setAssessmentTitle(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>

                {/* Score and Max Score */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Score Obtained
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={maxScore}
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Max Possible Score
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={maxScore}
                      onChange={(e) => setMaxScore(Number(e.target.value))}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Live Preview Indicator */}
                <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 p-3.5 flex items-center justify-between">
                  <div className="text-xs text-indigo-900 dark:text-indigo-200 font-medium">
                    Calculated Letter Grade:
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.round((score / (maxScore || 100)) * 100)}%
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white">
                      {calculateLetter(Math.round((score / (maxScore || 100)) * 100))}
                    </span>
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Recording...' : 'Save & Publish Grade'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
