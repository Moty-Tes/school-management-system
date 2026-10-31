'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, FileText, Search,
  CheckCircle2, X, UsersAdd
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

interface Application {
  id: string;
  studentName: string;
  studentId: string;
  appliedFor: 'preschool' | 'grade-1' | 'grade-2' | 'grade-3' | 'grade-4' | 'grade-5' | 'grade-6' | 'grade-7' | 'grade-8' | 'grade-9' | 'grade-10' | 'grade-11' | 'grade-12';
  status: 'pending' | 'under-review' | 'approved' | 'rejected' | 'withdrawn';
  appliedAt: string;
  documents: string[];
  notes: string;
}

interface FilterState {
  search: string;
  appliedFor: 'all' | 'preschool' | 'grade-1' | 'grade-2' | 'grade-3' | 'grade-4' | 'grade-5' | 'grade-6' | 'grade-7' | 'grade-8' | 'grade-9' | 'grade-10' | 'grade-11' | 'grade-12';
  status: 'all' | 'pending' | 'under-review' | 'approved' | 'rejected' | 'withdrawn';
}

export default function ApplyPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', appliedFor: 'all', status: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load applications
    async function loadApplications() {
      try {
        const data = await api.get<any[]>('/api/v1/apply');
        setApplications(data || []);
      } catch (err) {
        setApplications([]);
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, []);

  const filteredApplications = applications.filter((app: Application) => {
    const matchesSearch = filters.search
      ? app.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        app.studentId.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesAppliedFor = filters.appliedFor === 'all' || app.appliedFor === filters.appliedFor;
    const matchesStatus = filters.status === 'all' || app.status === filters.status;

    return matchesSearch && matchesAppliedFor && matchesStatus;
  });

  // Compute summary stats
  const totalApplications = filteredApplications.length;
  const pendingCount = filteredApplications.filter(a => a.status === 'pending').length;
  const underReviewCount = filteredApplications.filter(a => a.status === 'under-review').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Apply Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalApplications}</div>
                <div className="text-sm text-neutral-500">Applications</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-brand-primary">{pendingCount}</div>
                <div className="text-sm text-neutral-500">Pending</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">{underReviewCount}</div>
                <div className="text-sm text-neutral-500">Under Review</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Withdrawn</div>
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
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Applied For</label>
                  <select
                    value={filters.appliedFor}
                    onChange={(e) => setFilters({ ...filters, appliedFor: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Options</option>
                    <option value="preschool">Preschool</option>
                    <option value="grade-1">Grade 1</option>
                    <option value="grade-2">Grade 2</option>
                    <option value="grade-3">Grade 3</option>
                    <option value="grade-4">Grade 4</option>
                    <option value="grade-5">Grade 5</option>
                    <option value="grade-6">Grade 6</option>
                    <option value="grade-7">Grade 7</option>
                    <option value="grade-8">Grade 8</option>
                    <option value="grade-9">Grade 9</option>
                    <option value="grade-10">Grade 10</option>
                    <option value="grade-11">Grade 11</option>
                    <option value="grade-12">Grade 12</option>
                  </select>
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
                    <option value="under-review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Applications Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredApplications.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Users"
              title="No applications found"
              description="Students can apply to get started"
              actionLabel="View Applications"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Student</TableHeadCell>
                <TableHeadCell style="primary">Applied For</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">Applied At</TableHeadCell>
                <TableHeadCell style="primary">Documents</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredApplications.slice(0, 15).map((app: Application, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{app.studentName}</span>
                    <span className="text-neutral-500 text-xs">{app.appliedFor}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${app.status}`}>{app.status}</span>
                    <span className="text-neutral-500 text-xs">{new Date(app.appliedAt).toLocaleDateString()}</span>
                    <span className="text-neutral-500 text-xs">{app.documents.length} docs</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredApplications.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredApplications.length} of {applications.length} applications</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export List</Button>
                <Button variant="primary" size="sm">Generate Report</Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}