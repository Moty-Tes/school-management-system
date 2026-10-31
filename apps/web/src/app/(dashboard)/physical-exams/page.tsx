'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Heart, Shield, Clipboard, TrendingUp, FileText,
  Calendar, CheckCircle2, X, Search, UsersAdd
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

interface HealthRecord {
  id: string;
  studentName: string;
  studentId: string;
  examinationType: 'physical' | 'vision' | 'hearing' | 'dental' | 'general';
  date: string;
  result: 'pass' | 'fail' | 'pending';
  notes: string;
  referredTo: string | null;
}

interface FilterState {
  search: string;
  examinationType: 'all' | 'physical' | 'vision' | 'hearing' | 'dental' | 'general';
  result: 'all' | 'pass' | 'fail' | 'pending';
}

export default function PhysicalExamsPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', examinationType: 'all', result: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load health records
    async function loadHealthRecords() {
      try {
        const data = await api.get<any[]>('/api/v1/health-records');
        setHealthRecords(data || []);
      } catch (err) {
        setHealthRecords([]);
      } finally {
        setLoading(false);
      }
    }

    loadHealthRecords();
  }, []);

  const filteredRecords = healthRecords.filter((record: HealthRecord) => {
    const matchesSearch = filters.search
      ? record.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.studentId.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesType = filters.examinationType === 'all' || record.examinationType === filters.examinationType;
    const matchesResult = filters.result === 'all' || record.result === filters.result;

    return matchesSearch && matchesType && matchesResult;
  });

  // Compute summary stats
  const totalRecords = filteredRecords.length;
  const passedCount = filteredRecords.filter(r => r.result === 'pass').length;
  const failedCount = filteredRecords.filter(r => r.result === 'fail').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Health Records Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalRecords}</div>
                <div className="text-sm text-neutral-500">Health Records</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-green-600">{passedCount}</div>
                <div className="text-sm text-neutral-500">Passed</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-red-600">{failedCount}</div>
                <div className="text-sm text-neutral-500">Failed</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Pending</div>
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
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Type</label>
                  <select
                    value={filters.examinationType}
                    onChange={(e) => setFilters({ ...filters, examinationType: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Types</option>
                    <option value="physical">Physical</option>
                    <option value="vision">Vision</option>
                    <option value="hearing">Hearing</option>
                    <option value="dental">Dental</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Result</label>
                  <select
                    value={filters.result}
                    onChange={(e) => setFilters({ ...filters, result: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Results</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Health Records Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredRecords.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Heart"
              title="No health records found"
              description="Record health examinations to get started"
              actionLabel="Record Examination"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Student</TableHeadCell>
                <TableHeadCell style="primary">Type</TableHeadCell>
                <TableHeadCell style="primary">Result</TableHeadCell>
                <TableHeadCell style="primary">Date</TableHeadCell>
                <TableHeadCell style="primary">Referred To</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredRecords.slice(0, 15).map((record: HealthRecord, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{record.studentName}</span>
                    <span className="text-neutral-500 text-xs">{record.examinationType}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${record.result}`}
                    >
                      {record.result}
                    </span>
                    <span className="text-neutral-500 text-xs">{new Date(record.date).toLocaleDateString()}</span>
                    <span className="text-neutral-500 text-xs">{record.referredTo || '—'}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredRecords.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredRecords.length} of {healthRecords.length} records</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export Records</Button>
                <Button variant="primary" size="sm">Generate Health Report</Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}