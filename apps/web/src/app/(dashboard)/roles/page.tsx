'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Shield, Search,
  CheckCircle2, X
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface Role {
  id: string;
  name: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'PARENT' | 'STUDENT' | 'REGISTRAR';
  displayName: string;
  description: string;
  permissions: string[];
  status: 'active' | 'inactive';
  createdAt: string;
}

interface FilterState {
  search: string;
  status: 'all' | 'active' | 'inactive';
}

export default function RolesPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', status: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me?.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load roles
    async function loadRoles() {
      try {
        const data = await api.get<any[]>('/api/v1/roles');
        setRoles(data || []);
      } catch (err) {
        setRoles([]);
      } finally {
        setLoading(false);
      }
    }

    loadRoles();
  }, []);

  const filteredRoles = roles.filter((r: Role) => {
    const matchesSearch = filters.search
      ? r.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.displayName.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesStatus = filters.status === 'all' || r.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  // Compute summary stats
  const totalRoles = filteredRoles.length;
  const activeCount = filteredRoles.filter(r => r.status === 'active').length;
  const inactiveCount = filteredRoles.filter(r => r.status === 'inactive').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Roles Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalRoles}</div>
                <div className="text-sm text-neutral-500">Roles</div>
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
                <div className="text-3xl font-extrabold text-amber-600">{inactiveCount}</div>
                <div className="text-sm text-neutral-500">Inactive</div>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search role name or display name..."
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Roles Table */}
          {loading ? (
            <Skeleton className="h-64 rounded-md animate-bounce" />
          ) : filteredRoles.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Users"
              title="No roles found"
              description="Roles will appear here"
              actionLabel="Manage Roles"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Role</TableHeadCell>
                <TableHeadCell style="primary">Display Name</TableHeadCell>
                <TableHeadCell style="primary">Permissions</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">Created</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredRoles.slice(0, 15).map((r: Role, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{r.name}</span>
                    <span className="text-neutral-500 text-xs">{r.displayName}</span>
                    <span className="text-neutral-500 text-xs line-clamp-2">{r.permissions.join(', ')}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${r.status}`}>{r.status}</span>
                    <span className="text-neutral-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredRoles.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredRoles.length} of {roles.length} roles</span>
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