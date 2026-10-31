'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Calendar, Shield, TrendingUp, FileText,
  Archive, Eye, X, Search
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface Substitute {
  id: string;
  teacherName: string;
  subject: string;
  date: string;
  class: string;
  coverageType: 'planned' | 'emergency';
  status: 'assigned' | 'completed' | 'cancelled';
}

interface FilterState {
  search: string;
  status: 'all' | 'assigned' | 'completed' | 'cancelled';
  coverageType: 'all' | 'planned' | 'emergency';
}

export default function SubstitutesPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', status: 'all', coverageType: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load substitutes
    async function loadSubstitutes() {
      try {
        const data = await api.get<any[]>('/api/v1/substitutes');
        setSubstitutes(data || []);
      } catch (err) {
        setSubstitutes([]);
      } finally {
        setLoading(false);
      }
    }

    loadSubstitutes();
  }, []);

  const filteredSubstitutes = substitutes.filter((sub: Substitute) => {
    const matchesSearch = filters.search
      ? sub.teacherName.toLowerCase().includes(filters.search.toLowerCase()) ||
        sub.subject.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesStatus = filters.status === 'all' || sub.status === filters.status;
    const matchesType = filters.coverageType === 'all' || sub.coverageType === filters.coverageType;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Compute summary stats
  const totalSubs = filteredSubstitutes.length;
  const assignedCount = filteredSubstitutes.filter(s => s.status === 'assigned').length;
  const completedCount = filteredSubstitutes.filter(s => s.status === 'completed').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Substitute Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalSubs}</div>
                <div className="text-sm text-neutral-500">Substitutes</div>
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
                <div className="text-3xl font-extrabold text-amber-600">{assignedCount}</div>
                <div className="text-sm text-neutral-500">Assigned</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Cancelled</div>
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
                    placeholder="Search teacher name or subject..."
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
                    <option value="assigned">Assigned</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Type</label>
                  <select
                    value={filters.coverageType}
                    onChange={(e) => setFilters({ ...filters, coverageType: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Types</option>
                    <option value="planned">Planned</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Substitutes Table */}
          {loading ? (
            <Skeleton className="h-64 rounded-md animate-bounce" />
          ) : filteredSubstitutes.length === 0 ? (
            <KpiEmptyStateComponent
              icon="UsersOff"
              title="No substitutes found"
              description="Assign substitutes to get started"
              actionLabel="Assign Substitute"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Teacher</TableHeadCell>
                <TableHeadCell style="primary">Subject</TableHeadCell>
                <TableHeadCell style="primary">Date</TableHeadCell>
                <TableHeadCell style="primary">Class</TableHeadCell>
                <TableHeadCell style="primary">Type</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredSubstitutes.slice(0, 15).map((sub: Substitute, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{sub.teacherName}</span>
                    <span className="text-neutral-500 text-xs">{sub.subject}</span>
                    <span className="text-neutral-500 text-xs">{new Date(sub.date).toLocaleDateString()}</span>
                    <span className="text-neutral-500 text-xs">{sub.class}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${sub.coverageType}`}
                    >
                      {sub.coverageType}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${sub.status}`}
                    >
                      {sub.status}
                    </span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reporting */}
          {filteredSubstitutes.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredSubstitutes.length} of {substitutes.length} substitutes</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export Report</Button>
                <Button variant="primary" size="sm">Generate Coverage Report</Button>
              </div>
            </div>
          )}
                </div>
      </motion.div>
    </div>
  );
}