'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield, Search,
  CheckCircle2, X, Clock
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface AuditLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'export' | 'import';
  entity: 'student' | 'teacher' | 'class' | 'grade' | 'attendance' | 'fee' | 'report';
  entityId: string;
  performedBy: string;
  performedAt: string;
  ipAddress: string;
  details: string;
  status: 'success' | 'failed';
}

interface FilterState {
  search: string;
  action: 'all' | 'create' | 'update' | 'delete' | 'login' | 'export' | 'import';
  entity: 'all' | 'student' | 'teacher' | 'class' | 'grade' | 'attendance' | 'fee' | 'report';
  status: 'all' | 'success' | 'failed';
}

export default function AuditLogsPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', action: 'all', entity: 'all', status: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load audit logs
    async function loadLogs() {
      try {
        const data = await api.get<any[]>('/api/v1/audit-logs');
        setLogs(data || []);
      } catch (err) {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log: AuditLog) => {
    const matchesSearch = filters.search
      ? log.action.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.entity.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.performedBy.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesAction = filters.action === 'all' || log.action === filters.action;
    const matchesEntity = filters.entity === 'all' || log.entity === filters.entity;
    const matchesStatus = filters.status === 'all' || log.status === filters.status;

    return matchesSearch && matchesAction && matchesEntity && matchesStatus;
  });

  // Compute summary stats
  const totalLogs = filteredLogs.length;
  const successCount = filteredLogs.filter(l => l.status === 'success').length;
  const failedCount = filteredLogs.filter(l => l.status === 'failed').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Audit Logs Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalLogs}</div>
                <div className="text-sm text-neutral-500">Audit Logs</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-green-600">{successCount}</div>
                <div className="text-sm text-neutral-500">Success</div>
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
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search action, entity, or user..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                    defaultValue=""
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Action</label>
                  <select
                    value={filters.action}
                    onChange={(e) => setFilters({ ...filters, action: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Actions</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="login">Login</option>
                    <option value="export">Export</option>
                    <option value="import">Import</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Entity</label>
                  <select
                    value={filters.entity}
                    onChange={(e) => setFilters({ ...filters, entity: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Entities</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="class">Class</option>
                    <option value="grade">Grade</option>
                    <option value="attendance">Attendance</option>
                    <option value="fee">Fee</option>
                    <option value="report">Report</option>
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
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Audit Logs Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredLogs.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Shield"
              title="No audit logs found"
              description="Audit logs will appear here"
              actionLabel="View Activity"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Action</TableHeadCell>
                <TableHeadCell style="primary">Entity</TableHeadCell>
                <TableHeadCell style="primary">Entity ID</TableHeadCell>
                <TableHeadCell style="primary">Performed By</TableHeadCell>
                <TableHeadCell style="primary">Date</TableHeadCell>
                <TableHeadCell style="primary">IP Address</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredLogs.slice(0, 15).map((log: AuditLog, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="text-neutral-500 text-xs">{log.action}</span>
                    <span className="text-neutral-500 text-xs">{log.entity}</span>
                    <span className="text-neutral-500 text-xs">{log.entityId}</span>
                    <span className="text-neutral-500 text-xs">{log.performedBy}</span>
                    <span className="text-neutral-500 text-xs">{new Date(log.performedAt).toLocaleDateString()}</span>
                    <span className="text-neutral-500 text-xs">{log.ipAddress}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredLogs.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredLogs.length} of {logs.length} logs</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export Logs</Button>
                <Button variant="primary" size="sm">Generate Report</Button>
              </div>
            </div>
          )}
                </div>
      </motion.div>
    </div>
  );
}