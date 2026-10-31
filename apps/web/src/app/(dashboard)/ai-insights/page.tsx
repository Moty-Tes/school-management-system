'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp, BarChart2, Zap, Search,
  CheckCircle2, X, UsersAdd
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

interface AiInsight {
  id: string;
  title: string;
  category: 'performance' | 'attendance' | 'engagement' | 'risk' | 'prediction';
  description: string;
  metric: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  riskLevel: 'low' | 'medium' | 'high';
  affectedCount: number;
  recommendedAction: string;
}

interface FilterState {
  search: string;
  category: 'all' | 'performance' | 'attendance' | 'engagement' | 'risk' | 'prediction';
  riskLevel: 'all' | 'low' | 'medium' | 'high';
}

export default function AiInsightsPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', category: 'all', riskLevel: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load AI insights
    async function loadInsights() {
      try {
        const data = await api.get<any[]>('/api/v1/ai-insights');
        setInsights(data || []);
      } catch (err) {
        setInsights([]);
      } finally {
        setLoading(false);
      }
    }

    loadInsights();
  }, []);

  const filteredInsights = insights.filter((insight: AiInsight) => {
    const matchesSearch = filters.search
      ? insight.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        insight.description.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesCategory = filters.category === 'all' || insight.category === filters.category;
    const matchesRisk = filters.riskLevel === 'all' || insight.riskLevel === filters.riskLevel;

    return matchesSearch && matchesCategory && matchesRisk;
  });

  // Compute summary stats
  const totalInsights = filteredInsights.length;
  const highRisk = filteredInsights.filter(i => i.riskLevel === 'high').length;
  const performanceInsights = filteredInsights.filter(i => i.category === 'performance').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* AI Insights Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalInsights}</div>
                <div className="text-sm text-neutral-500">Insights</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-red-600">{highRisk}</div>
                <div className="text-sm text-neutral-500">High Risk</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">{performanceInsights}</div>
                <div className="text-sm text-neutral-500">Performance</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Predictions</div>
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
                    placeholder="Search insight title or description..."
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
                    <option value="attendance">Attendance</option>
                    <option value="engagement">Engagement</option>
                    <option value="risk">Risk</option>
                    <option value="prediction">Prediction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Risk Level</label>
                  <select
                    value={filters.riskLevel}
                    onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* AI Insights Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredInsights.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Zap"
              title="No AI insights found"
              description="AI analysis will appear here"
              actionLabel="View Analysis"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Title</TableHeadCell>
                <TableHeadCell style="primary">Category</TableHeadCell>
                <TableHeadCell style="primary">Risk</TableHeadCell>
                <TableHeadCell style="primary">Affected</TableHeadCell>
                <TableHeadCell style="primary">Trend</TableHeadCell>
                <TableHeadCell style="primary">Recommended Action</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredInsights.slice(0, 15).map((insight: AiInsight, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{insight.title}</span>
                    <span className="text-neutral-500 text-xs">{insight.category}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${insight.riskLevel}`}>{insight.riskLevel}</span>
                    <span className="text-neutral-500 text-xs">{insight.affectedCount}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${insight.trend}`}>{insight.trend}</span>
                    <span className="text-neutral-500 text-xs line-clamp-2">{insight.recommendedAction}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredInsights.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredInsights.length} of {insights.length} insights</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export Insights</Button>
                <Button variant="primary" size="sm">Generate Report</Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}