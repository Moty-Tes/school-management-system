'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, BarChart3, Clipboard, TrendingUp, AlertCircle, FileText,
  Calendar, CheckCircle2, X, Search, Shield, GraduationCap
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

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
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', letterGrade: 'all', course: '' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load grades
    async function loadGrades() {
      try {
        const data = await api.get<any[]>('/api/v1/grades');
        setGrades(data || []);
      } catch (err) {
        setGrades([]);
      } finally {
        setLoading(false);
      }
    }

    loadGrades();
  }, []);

  const filteredGrades = grades.filter((grade: Grade) => {
    const matchesSearch = filters.search
      ? grade.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        grade.assignment.toLowerCase().includes(filters.search.toLowerCase())
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
    A: filteredGrades.filter(g => g.letterGrade === 'A').length,
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
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Grade Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalGrades}</div>
                <div className="text-sm text-neutral-500">Total Grades</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-brand-primary">{classAverage}%</div>
                <div className="text-sm text-neutral-500">Class Average</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-green-600">A+</div>
                <div className="text-sm text-neutral-500">{gradeDistribution['A+']} students</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-red-600">F</div>
                <div className="text-sm text-neutral-500">{gradeDistribution['F']} students</div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-neutral-600 uppercase tracking-wider mb-2">
                Filters
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search student name or assignment..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                    defaultValue=""
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Grade</label>
                  <select
                    value={filters.letterGrade}
                    onChange={(e) => setFilters({ ...filters, letterGrade: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Grades</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="B-">B-</option>
                    <option value="C+">C+</option>
                    <option value="C">C</option>
                    <option value="C-">C-</option>
                    <option value="D">D</option>
                    <option value="F">F</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Course</label>
                  <select
                    value={filters.course}
                    onChange={(e) => setFilters({ ...filters, course: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="">All Courses</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="science">Science</option>
                    <option value="english">English</option>
                    <option value="history">History</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Grades Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredGrades.length === 0 ? (
            <KpiEmptyStateComponent
              icon="FileText"
              title="No grades found"
              description="Enter grades for assignments to get started"
              actionLabel="Enter Grades"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Student</TableHeadCell>
                <TableHeadCell style="primary">Assignment</TableHeadCell>
                <TableHeadCell style="primary">Score</TableHeadCell>
                <TableHeadCell style="primary">Max Score</TableHeadCell>
                <TableHeadCell style="primary">%</TableHeadCell>
                <TableHeadCell style="primary">Letter Grade</TableHeadCell>
                <TableHeadCell style="primary">Date</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredGrades.slice(0, 20).map((grade: Grade, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{grade.studentName}</span>
                    <span className="font-medium text-neutral-700">{grade.assignment}</span>
                    <span className="font-medium text-neutral-700">${grade.score.toLocaleString()}</span>
                    <span className="font-medium text-neutral-700">${grade.maxScore.toLocaleString()}</span>
                    <span className="text-neutral-500 text-xs">{grade.percentage}%</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${grade.letterGrade}`}
                    >
                      {grade.letterGrade}
                    </span>
                    <span className="text-neutral-500 text-xs">{new Date(grade.date).toLocaleDateString()}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Distribution & Export */}
          {filteredGrades.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredGrades.length} of {grades.length} grades</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export Grades</Button>
                <Button variant="primary" size="sm">View Distribution</Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}