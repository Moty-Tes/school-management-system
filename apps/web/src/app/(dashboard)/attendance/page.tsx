'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Calendar, CheckCircle2, AlertCircle, FileText,
  TrendingUp, Archive, Eye, X, Search, Shield
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  period: string;
  className: string;
}

interface FilterState {
  search: string;
  status: 'all' | 'present' | 'absent' | 'late' | 'excused';
  dateRange: 'today' | 'this-week' | 'this-month' | 'custom';
}

export default function AttendancePage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR' | 'PARENT'>('ADMIN');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', status: 'all', dateRange: 'this-week' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');
      const isParent = userRoles.includes('PARENT');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : isParent ? 'PARENT' : 'TEACHER');
    });

    // Load attendance records
    async function loadAttendance() {
      try {
        const data = await api.get<any[]>('/api/v1/attendance');
        setAttendanceRecords(data || []);
      } catch (err) {
        setAttendanceRecords([]);
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, []);

  const filteredRecords = attendanceRecords.filter((record: AttendanceRecord) => {
    const matchesSearch = filters.search
      ? record.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.studentId.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesStatus = filters.status === 'all' || record.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  // Compute summary stats
  const totalRecords = filteredRecords.length;
  const presentCount = filteredRecords.filter(r => r.status === 'present').length;
  const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
  const lateCount = filteredRecords.filter(r => r.status === 'late').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalRecords}</div>
                <div className="text-sm text-neutral-500">Total Records</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-green-600">{presentCount}</div>
                <div className="text-sm text-neutral-500">Present</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-red-600">{absentCount}</div>
                <div className="text-sm text-neutral-500">Absent</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-amber-600">{lateCount}</div>
                <div className="text-sm text-neutral-500">Late</div>
              </div>
            </Card>
          </div>

          {/* Attendance Filters */}
          <Card>
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-neutral-600 uppercase tracking-wider mb-2">
                Filters
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="today">Today</option>
                    <option value="this-week">This Week</option>
                    <option value="this-month">This Month</option>
                    <option value="custom">Custom Range</option>
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
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>
              </div>
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
            </div>
          </Card>

          {/* Attendance Table */}
          {loading ? (
            <Skeleton className="h-96 rounded-md animate-bounce" />
          ) : filteredRecords.length === 0 ? (
            <KpiEmptyStateComponent
              icon="CalendarX"
              title="No attendance records found"
              description="Mark attendance to get started"
              actionLabel="Mark Attendance"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Student</TableHeadCell>
                <TableHeadCell style="primary">Date</TableHeadCell>
                <TableHeadCell style="primary">Period</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">Class</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredRecords.slice(0, 20).map((record: AttendanceRecord, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{record.studentName}</span>
                    <span className="text-neutral-500 text-xs">{new Date(record.date).toLocaleDateString()}</span>
                    <span className="text-neutral-500 text-xs">{record.period}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${record.status}`}
                    >
                      {record.status}
                    </span>
                    <span className="text-neutral-500 text-xs">{record.className}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Actions */}
          {filteredRecords.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredRecords.length} of {attendanceRecords.length} records</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export CSV</Button>
                <Button variant="primary" size="sm">Generate Report</Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}