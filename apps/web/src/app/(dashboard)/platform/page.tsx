'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Layout, Search,
  CheckCircle2, X, UsersAdd
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

interface PlatformMetric {
  id: string;
  name: string;
  category: 'performance' | 'usage' | 'engagement' | 'reliability' | 'security';
  value: string;
  unit: string;
  target: string | null;
  trend: 'up' | 'down' | 'neutral';
  lastUpdated: string;
}

interface FilterState {
  search: string;
  category: 'all' | 'performance' | 'usage' | 'engagement' | 'reliability' | 'security';
}

export default function PlatformPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [metrics, setMetrics] = useState<PlatformMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', category: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load platform metrics
    async function loadMetrics() {
      try {
        const data = await api.get<any[]>('/api/v1/platform');
        setMetrics(data || []);
      } catch (err) {
        setMetrics([]);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, []);

  const filteredMetrics = metrics.filter((metric: PlatformMetric) => {
    const matchesSearch = filters.search
      ? metric.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        metric.value.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesCategory = filters.category === 'all' || metric.category === filters.category;

    return matchesSearch && matchesCategory;
  });

  // Compute summary stats
  const totalMetrics = filteredMetrics.length;
  const performanceMetrics = filteredMetrics.filter(m => m.category === 'performance').length;
  const engagementMetrics = filteredMetrics.filter(m => m.category === 'engagement').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Platform Metrics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalMetrics}</div>
                <div className="text-sm text-neutral-500">Metrics</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">{performanceMetrics}</div>
                <div className="text-sm text-neutral-500">Performance</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">{engagementMetrics}</div>
                <div className="text-sm text-neutral-500">Engagement</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Security</div>
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
                    placeholder="Search metric name or value..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                    defaultValue=""
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Categories</option>
                    <option value="performance">Performance</option>
                    <option value="usage">Usage</option>
                    <option value="engagement">Engagement</option>
                    <option value="reliability">Reliability</option>
                    <option value="security">Security</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Platform Metrics Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredMetrics.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Layout"
              title="No platform metrics found"
              description="Platform metrics will appear here"
              actionLabel="View Analytics"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Metric</TableHeadCell>
                <TableHeadCell style="primary">Value</TableHeadCell>
                <TableHeadCell style="primary">Category</TableHeadCell>
                <TableHeadCell style="primary">Trend</TableHeadCell>
                <TableHeadCell style="primary">Last Updated</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredMetrics.slice(0, 15).map((metric: PlatformMetric, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{metric.name}</span>
                    <span className="font-medium text-neutral-700">{metric.value} {metric.unit}</span>
                    <span className="text-neutral-500 text-xs">{metric.category}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${metric.trend}`}>{metric.trend}</span>
                    <span className="text-neutral-500 text-xs">{new Date(metric.lastUpdated).toLocaleDateString()}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredMetrics.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredMetrics.length} of {metrics.length} metrics</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export Data</Button>
                <Button variant="primary" size="sm">Generate Report</Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}