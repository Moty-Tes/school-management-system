'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Clipboard, TrendingUp, AlertCircle, FileText,
  Calendar, CheckCircle2, X, Search, Shield, GraduationCap
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface Assessment {
  id: string;
  name: string;
  type: 'quiz' | 'test' | 'exam' | 'project';
  course: string;
  grade: string;
  totalStudents: number;
  studentsCompleted: number;
  averageScore: number;
  date: string;
  maxScore: number;
}

interface FilterState {
  search: string;
  type: 'all' | 'quiz' | 'test' | 'exam' | 'project';
  course: string;
}

export default function AssessmentsPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', type: 'all', course: '' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load assessments
    async function loadAssessments() {
      try {
        const data = await api.get<any[]>('/api/v1/assessments');
        setAssessments(data || []);
      } catch (err) {
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    }

    loadAssessments();
  }, []);

  const filteredAssessments = assessments.filter((assessment: Assessment) => {
    const matchesSearch = filters.search
      ? assessment.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        assessment.course.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesType = filters.type === 'all' || assessment.type === filters.type;

    return matchesSearch && matchesType;
  });

  // Compute summary stats
  const totalAssessments = filteredAssessments.length;
  const totalStudentsAssessed = filteredAssessments.reduce((s: number, a: Assessment) => s + a.studentsCompleted, 0);
  const overallAverage = totalAssessments > 0
    ? (filteredAssessments.reduce((s: number, a: Assessment) => s + a.averageScore, 0) / totalAssessments).toFixed(1)
    : '0';

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Summary Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalAssessments}</div>
                <div className="text-sm text-neutral-500">Assessments</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-700">{totalStudentsAssessed}</div>
                <div className="text-sm text-neutral-500">Students Assessed</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-brand-primary">{overallAverage}</div>
                <div className="text-sm text-neutral-500">Avg Score</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-700">0</div>
                <div className="text-sm text-neutral-500">Max Score</div>
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
                    placeholder="Search assessment name or course..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                    defaultValue=""
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Types</option>
                    <option value="quiz">Quiz</option>
                    <option value="test">Test</option>
                    <option value="exam">Exam</option>
                    <option value="project">Project</option>
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

          {/* Assessments Table */}
          {loading ? (
            <Skeleton className="h-80 rounded-md animate-bounce" />
          ) : filteredAssessments.length === 0 ? (
            <KpiEmptyStateComponent
              icon="FileText"
              title="No assessments found"
              description="Create your first assessment to get started"
              actionLabel="Create Assessment"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Assessment</TableHeadCell>
                <TableHeadCell style="primary">Type</TableHeadCell>
                <TableHeadCell style="primary">Course</TableHeadCell>
                <TableHeadCell style="primary">Students</TableHeadCell>
                <TableHeadCell style="primary">Average Score</TableHeadCell>
                <TableHeadCell style="primary">Date</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredAssessments.slice(0, 15).map((assessment: Assessment, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{assessment.name}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${assessment.type}`}
                    >
                      {assessment.type}
                    </span>
                    <span className="text-neutral-500 text-xs">{assessment.course}</span>
                    <span className="font-medium text-neutral-700">{assessment.studentsCompleted}</span>
                    <span className="text-neutral-500 text-xs">{assessment.averageScore}%</span>
                    <span className="text-neutral-500 text-xs">{new Date(assessment.date).toLocaleDateString()}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Analytics */}
          {filteredAssessments.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredAssessments.length} of {assessments.length} assessments</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export Data</Button>
                <Button variant="primary" size="sm">View Analytics</Button>
              </div>
            </div>
          )}
                </div>
      </motion.div>
    </div>
  );
}