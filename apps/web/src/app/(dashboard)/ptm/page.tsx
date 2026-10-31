'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar, Users, Search,
  CheckCircle2, X, Clock
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface PtmRecord {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  teacherName: string;
  class: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  capacity: number;
  enrolledCount: number;
  mode: 'online' | 'offline' | 'hybrid';
}

interface FilterState {
  search: string;
  status: 'all' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export default function PtmPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'PARENT' | 'REGISTRAR'>('ADMIN');
  const [records, setRecords] = useState<PtmRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', status: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me?.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');
      const isParent = userRoles.includes('PARENT');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : isParent ? 'PARENT' : 'ADMIN');
    });

    // Load PTM records
    async function loadRecords() {
      try {
        const data = await api.get<any[]>('/api/v1/ptm');
        setRecords(data || []);
      } catch (err) {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
  }, []);

  const filteredRecords = records.filter((record: PtmRecord) => {
    const matchesSearch = filters.search
      ? record.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.teacherName.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesStatus = filters.status === 'all' || record.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  // Compute summary stats
  const totalRecords = filteredRecords.length;
  const scheduledCount = filteredRecords.filter(r => r.status === 'scheduled').length;
  const completedCount = filteredRecords.filter(r => r.status === 'completed').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* PTM Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalRecords}</div>
                <div className="text-sm text-neutral-500">PTM Sessions</div>
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
                <div className="text-3xl font-extrabold text-brand-primary">{scheduledCount}</div>
                <div className="text-sm text-neutral-500">Scheduled</div>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search session title or teacher..."
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
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* PTM Table */}
          {loading ? (
            <Skeleton className="h-64 rounded-md animate-bounce" />
          ) : filteredRecords.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Calendar"
              title="No PTM sessions found"
              description="Schedule parent-teacher meetings to get started"
              actionLabel="Schedule PTM"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Session</TableHeadCell>
                <TableHeadCell style="primary">Teacher</TableHeadCell>
                <TableHeadCell style="primary">Class</TableHeadCell>
                <TableHeadCell style="primary">Date</TableHeadCell>
                <TableHeadCell style="primary">Time</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">Enrollment</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredRecords.slice(0, 15).map((record: PtmRecord, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{record.title}</span>
                    <span className="text-neutral-500 text-xs">{record.teacherName}</span>
                    <span className="text-neutral-500 text-xs">{record.class}</span>
                    <span className="text-neutral-500 text-xs">{new Date(record.date).toLocaleDateString()}</span>
                    <span className="text-neutral-500 text-xs">{record.startTime} - {record.endTime}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${record.status}`}>{record.status}</span>
                    <span className="text-neutral-500 text-xs">{record.enrolledCount}/{record.capacity}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredRecords.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredRecords.length} of {records.length} sessions</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export List</Button>
                <Button variant="primary" size="sm">Generate Report</Button>
              </div>
            </div>
          )}
                </div>
      </motion.div>
    </div>
  );
}