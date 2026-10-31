'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Shield, Clipboard, TrendingUp, FileText,
  Calendar, CheckCircle2, X, Search
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface Visitor {
  id: string;
  name: string;
  purpose: string;
  contact: string;
  enteredAt: string;
  status: 'expected' | 'checked-in' | 'checked-out' | 'met';
}

interface FilterState {
  search: string;
  status: 'all' | 'expected' | 'checked-in' | 'checked-out' | 'met';
}

export default function FrontDeskPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR' | 'PARENT'>('ADMIN');
  const [visitors, setVisitors] = useState<Visitor[]>([]);
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

    // Load visitors
    async function loadVisitors() {
      try {
        const data = await api.get<any[]>('/api/v1/front-desk');
        setVisitors(data || []);
      } catch (err) {
        setVisitors([]);
      } finally {
        setLoading(false);
      }
    }

    loadVisitors();
  }, []);

  const filteredVisitors = visitors.filter((visitor: Visitor) => {
    const matchesSearch = filters.search
      ? visitor.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        visitor.purpose.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesStatus = filters.status === 'all' || visitor.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  // Compute summary stats
  const totalVisitors = filteredVisitors.length;
  const checkedInCount = filteredVisitors.filter(v => v.status === 'checked-in').length;
  const expectedCount = filteredVisitors.filter(v => v.status === 'expected').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Front Desk Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalVisitors}</div>
                <div className="text-sm text-neutral-500">Visitors</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-brand-primary">{checkedInCount}</div>
                <div className="text-sm text-neutral-500">Checked In</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-amber-600">{expectedCount}</div>
                <div className="text-sm text-neutral-500">Expected</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Met</div>
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
                    placeholder="Search visitor name or purpose..."
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
                    <option value="expected">Expected</option>
                    <option value="checked-in">Checked In</option>
                    <option value="checked-out">Checked Out</option>
                    <option value="met">Met</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Visitors Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredVisitors.length === 0 ? (
            <KpiEmptyStateComponent
              icon="UsersOff"
              title="No visitors found"
              description="Record visitor arrivals to get started"
              actionLabel="Record Visit"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Name</TableHeadCell>
                <TableHeadCell style="primary">Purpose</TableHeadCell>
                <TableHeadCell style="primary">Contact</TableHeadCell>
                <TableHeadCell style="primary">Entered At</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredVisitors.slice(0, 20).map((visitor: Visitor, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{visitor.name}</span>
                    <span className="font-medium text-neutral-700">{visitor.purpose}</span>
                    <span className="text-neutral-500 text-xs">{visitor.contact}</span>
                    <span className="text-neutral-500 text-xs">{new Date(visitor.enteredAt).toLocaleDateString()} {new Date(visitor.enteredAt).toLocaleTimeString()}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${visitor.status}`}
                    >
                      {visitor.status}
                    </span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Export Logs */}
          {filteredVisitors.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredVisitors.length} of {visitors.length} visitors</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export Log</Button>
                <Button variant="primary" size="sm">Generate Report</Button>
              </div>
            </div>
          )}
                </div>
      </motion.div>
    </div>
  );
}