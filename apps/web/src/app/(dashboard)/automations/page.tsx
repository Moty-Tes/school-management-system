'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap, Search,
  CheckCircle2, X, UsersAdd, Clock
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

interface Automation {
  id: string;
  name: string;
  type: 'attendance-notification' | 'grade-release' | 'fee-reminder' | 'absence-alert' | 'schedule-change' | 'general';
  status: 'active' | 'inactive' | 'paused';
  trigger: string;
  schedule: string;
  lastRun: string | null;
  nextRun: string;
  successCount: number;
  failureCount: number;
}

interface FilterState {
  search: string;
  type: 'all' | 'attendance-notification' | 'grade-release' | 'fee-reminder' | 'absence-alert' | 'schedule-change' | 'general';
  status: 'all' | 'active' | 'inactive' | 'paused';
}

export default function AutomationsPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', type: 'all', status: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load automations
    async function loadAutomations() {
      try {
        const data = await api.get<any[]>('/api/v1/automations');
        setAutomations(data || []);
      } catch (err) {
        setAutomations([]);
      } finally {
        setLoading(false);
      }
    }

    loadAutomations();
  }, []);

  const filteredAutomations = automations.filter((aut: Automation) => {
    const matchesSearch = filters.search
      ? aut.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        aut.type.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesType = filters.type === 'all' || aut.type === filters.type;
    const matchesStatus = filters.status === 'all' || aut.status === filters.status;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Compute summary stats
  const totalAutomations = filteredAutomations.length;
  const activeCount = filteredAutomations.filter(a => a.status === 'active').length;
  const pausedCount = filteredAutomations.filter(a => a.status === 'paused').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Automations Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalAutomations}</div>
                <div className="text-sm text-neutral-500">Automations</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-green-600">{activeCount}</div>
                <div className="text-sm text-neutral-500">Active</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-amber-600">{pausedCount}</div>
                <div className="text-sm text-neutral-500">Paused</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Inactive</div>
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
                    placeholder="Search automation name or type..."
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
                    <option value="attendance-notification">Attendance Notification</option>
                    <option value="grade-release">Grade Release</option>
                    <option value="fee-reminder">Fee Reminder</option>
                    <option value="absence-alert">Absence Alert</option>
                    <option value="schedule-change">Schedule Change</option>
                    <option value="general">General</option>
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Automations Table */}
          {loading ? (
            <Skeleton className="h-64 rounded-md animate-bounce" />
          ) : filteredAutomations.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Zap"
              title="No automations found"
              description="Set up automations to get started"
              actionLabel="Create Automation"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Name</TableHeadCell>
                <TableHeadCell style="primary">Type</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">Trigger</TableHeadCell>
                <TableHeadCell style="primary">Schedule</TableHeadCell>
                <TableHeadCell style="primary">Success/Failure</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredAutomations.slice(0, 15).map((aut: Automation, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{aut.name}</span>
                    <span className="text-neutral-500 text-xs">{aut.type}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${aut.status}`}>{aut.status}</span>
                    <span className="text-neutral-500 text-xs">{aut.trigger}</span>
                    <span className="text-neutral-500 text-xs">{aut.schedule}</span>
                    <span className="text-neutral-500 text-xs">{aut.successCount}/{aut.failureCount}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredAutomations.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredAutomations.length} of {automations.length} automations</span>
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