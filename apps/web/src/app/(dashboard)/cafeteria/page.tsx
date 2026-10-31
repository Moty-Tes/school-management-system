'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Utensils, Coffee, Search,
  CheckCircle2, X, TrendingUp
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface CafeteriaRecord {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  totalMeals: number;
  vegetarianCount: number;
  veganCount: number;
  halalCount: number;
  kosherCount: number;
  status: 'serving' | 'completed' | 'closed';
  averageRating: number | null;
  costPerMeal: number;
}

interface FilterState {
  search: string;
  mealType: 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';
  status: 'all' | 'serving' | 'completed' | 'closed';
}

export default function CafeteriaPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'PARENT' | 'REGISTRAR'>('ADMIN');
  const [records, setRecords] = useState<CafeteriaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', mealType: 'all', status: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');
      const isParent = userRoles.includes('PARENT');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : isParent ? 'PARENT' : 'ADMIN');
    });

    // Load cafeteria records
    async function loadRecords() {
      try {
        const data = await api.get<any[]>('/api/v1/cafeteria');
        setRecords(data || []);
      } catch (err) {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
  }, []);

  const filteredRecords = records.filter((record: CafeteriaRecord) => {
    const matchesSearch = filters.search
      ? record.date.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesType = filters.mealType === 'all' || record.mealType === filters.mealType;
    const matchesStatus = filters.status === 'all' || record.status === filters.status;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Compute summary stats
  const totalRecords = filteredRecords.length;
  const servingCount = filteredRecords.filter(r => r.status === 'serving').length;
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
          {/* Cafeteria Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalRecords}</div>
                <div className="text-sm text-neutral-500">Meals Served</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-brand-primary">{servingCount}</div>
                <div className="text-sm text-neutral-500">Serving</div>
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
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Closed</div>
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
                    placeholder="Search date..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                    defaultValue=""
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Meal Type</label>
                  <select
                    value={filters.mealType}
                    onChange={(e) => setFilters({ ...filters, mealType: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Types</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
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
                    <option value="serving">Serving</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Cafeteria Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredRecords.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Utensils"
              title="No cafeteria records found"
              description="Meal records will appear here"
              actionLabel="View Menu"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Date</TableHeadCell>
                <TableHeadCell style="primary">Meal Type</TableHeadCell>
                <TableHeadCell style="primary">Total Meals</TableHeadCell>
                <TableHeadCell style="primary">Vegetarian</TableHeadCell>
                <TableHeadCell style="primary">Vegan</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredRecords.slice(0, 15).map((record: CafeteriaRecord, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="text-neutral-500 text-xs">{new Date(record.date).toLocaleDateString()}</span>
                    <span className="text-neutral-500 text-xs">{record.mealType}</span>
                    <span className="font-medium text-neutral-700">{record.totalMeals}</span>
                    <span className="text-neutral-500 text-xs">{record.vegetarianCount}</span>
                    <span className="text-neutral-500 text-xs">{record.veganCount}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${record.status}`}
                    >
                      {record.status}
                    </span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredRecords.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredRecords.length} of {records.length} records</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export Data</Button>
                <Button variant="primary" size="sm">Generate Report</Button>
              </div>
            </div>
          )}
                </div>
      </motion.div>
    </div>
  );
}