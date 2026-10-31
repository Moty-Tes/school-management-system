'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Award, Shield, Clipboard, TrendingUp, FileText,
  Calendar, CheckCircle2, X, Search
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface Promotion {
  id: string;
  studentName: string;
  studentId: string;
  fromGrade: string;
  toGrade: string;
  effectiveDate: string;
  status: 'pending' | 'completed' | 'failed';
}

interface FilterState {
  search: string;
  status: 'all' | 'pending' | 'completed' | 'failed';
  grade: 'all' | 'grade-9' | 'grade-10' | 'grade-11' | 'grade-12';
}

export default function PromotionsPage() {
  const [role, setRole] = useState<'ADMIN' | 'REGISTRAR'>('ADMIN');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', status: 'all', grade: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'ADMIN');
    });

    // Load promotions
    async function loadPromotions() {
      try {
        const data = await api.get<any[]>('/api/v1/promotions');
        setPromotions(data || []);
      } catch (err) {
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    }

    loadPromotions();
  }, []);

  const filteredPromotions = promotions.filter((promotion: Promotion) => {
    const matchesSearch = filters.search
      ? promotion.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        promotion.studentId.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesStatus = filters.status === 'all' || promotion.status === filters.status;
    const matchesGrade = filters.grade === 'all' || promotion.fromGrade === filters.grade;

    return matchesSearch && matchesStatus && matchesGrade;
  });

  // Compute summary stats
  const totalPromotions = filteredPromotions.length;
  const completedCount = filteredPromotions.filter(p => p.status === 'completed').length;
  const pendingCount = filteredPromotions.filter(p => p.status === 'pending').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Promotion Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalPromotions}</div>
                <div className="text-sm text-neutral-500">Promotions</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-green-600">{completedCount}</div>
                <div className="text-sm text-neutral-500">Completed</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-amber-600">{pendingCount}</div>
                <div className="text-sm text-neutral-500">Pending</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Failed</div>
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
                    placeholder="Search student name or ID..."
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
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Grade</label>
                  <select
                    value={filters.grade}
                    onChange={(e) => setFilters({ ...filters, grade: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Grades</option>
                    <option value="grade-9">Grade 9</option>
                    <option value="grade-10">Grade 10</option>
                    <option value="grade-11">Grade 11</option>
                    <option value="grade-12">Grade 12</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Promotions Table */}
          {loading ? (
            <Skeleton className="h-64 rounded-md animate-bounce" />
          ) : filteredPromotions.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Award"
              title="No promotions found"
              description="Record student promotions to get started"
              actionLabel="Record Promotion"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Student</TableHeadCell>
                <TableHeadCell style="primary">From Grade</TableHeadCell>
                <TableHeadCell style="primary">To Grade</TableHeadCell>
                <TableHeadCell style="primary">Effective Date</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredPromotions.slice(0, 15).map((promotion: Promotion, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{promotion.studentName}</span>
                    <span className="text-neutral-500 text-xs">{promotion.fromGrade}</span>
                    <span className="text-neutral-500 text-xs">{promotion.toGrade}</span>
                    <span className="text-neutral-500 text-xs">{new Date(promotion.effectiveDate).toLocaleDateString()}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${promotion.status}`}
                    >
                      {promotion.status}
                    </span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reporting */}
          {filteredPromotions.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredPromotions.length} of {promotions.length} promotions</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export Report</Button>
                <Button variant="primary" size="sm">Generate Report Card</Button>
              </div>
            </div>
          )}
                </div>
      </motion.div>
    </div>
  );
}