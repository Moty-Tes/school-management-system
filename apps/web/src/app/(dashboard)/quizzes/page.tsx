'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Sparkles, Clipboard, TrendingUp, AlertCircle, FileText,
  Calendar, CheckCircle2, X, Search, Shield, GraduationCap
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

interface Quiz {
  id: string;
  title: string;
  subject: string;
  class: string;
  totalQuestions: number;
  timeLimit: number;
  attemptsAllowed: number;
  date: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
}

interface FilterState {
  search: string;
  status: 'all' | 'draft' | 'active' | 'completed' | 'archived';
  class: string;
}

export default function QuizzesPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', status: 'all', class: '' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load quizzes
    async function loadQuizzes() {
      try {
        const data = await api.get<any[]>('/api/v1/quizzes');
        setQuizzes(data || []);
      } catch (err) {
        setQuizzes([]);
      } finally {
        setLoading(false);
      }
    }

    loadQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter((quiz: Quiz) => {
    const matchesSearch = filters.search
      ? quiz.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        quiz.subject.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesStatus = filters.status === 'all' || quiz.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  // Compute summary stats
  const totalQuizzes = filteredQuizzes.length;
  const totalAttempts = filteredQuizzes.reduce((s: number, q: Quiz) => s + (q.attemptsAllowed || 0), 0);
  const activeQuizzes = filteredQuizzes.filter(q => q.status === 'active').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Quiz Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalQuizzes}</div>
                <div className="text-sm text-neutral-500">Quizzes</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-brand-primary">{activeQuizzes}</div>
                <div className="text-sm text-neutral-500">Active</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-700">{totalAttempts}</div>
                <div className="text-sm text-neutral-500">Total Attempts</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Archived</div>
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
                    placeholder="Search quiz title or subject..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                    defaultValue=""
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Class</label>
                  <select
                    value={filters.class}
                    onChange={(e) => setFilters({ ...filters, class: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="">All Classes</option>
                    <option value="grade-9">Grade 9</option>
                    <option value="grade-10">Grade 10</option>
                    <option value="grade-11">Grade 11</option>
                    <option value="grade-12">Grade 12</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Quizzes Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredQuizzes.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Sparkles"
              title="No quizzes found"
              description="Create your first quiz to get started"
              actionLabel="Create Quiz"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Quiz</TableHeadCell>
                <TableHeadCell style="primary">Subject</TableHeadCell>
                <TableHeadCell style="primary">Class</TableHeadCell>
                <TableHeadCell style="primary">Questions</TableHeadCell>
                <TableHeadCell style="primary">Time Limit</TableHeadCell>
                <TableHeadCell style="primary">Attempts</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">Actions</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredQuizzes.slice(0, 15).map((quiz: Quiz, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{quiz.title}</span>
                    <span className="text-neutral-500 text-xs">{quiz.subject}</span>
                    <span className="text-neutral-500 text-xs">{quiz.class}</span>
                    <span className="font-medium text-neutral-700">{quiz.totalQuestions}</span>
                    <span className="text-neutral-500 text-xs">{quiz.timeLimit} min</span>
                    <span className="font-medium text-neutral-700">{quiz.attemptsAllowed}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${quiz.status}`}
                    >
                      {quiz.status}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-neutral-700">
                        View
                      </Button>
                      <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-neutral-700">
                        Edit
                      </Button>
                    </div>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Analytics */}
          {filteredQuizzes.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredQuizzes.length} of {quizzes.length} quizzes</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export Results</Button>
                <Button variant="primary" size="sm">View Analytics</Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}