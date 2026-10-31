'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, Search,
  CheckCircle2, X, Calendar
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface Form {
  id: string;
  name: string;
  type: 'admission' | 'withdrawal' | 'transfer' | 'permission' | 'general';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  submittedAt: string | null;
  targetAudience: 'all' | 'students' | 'parents' | 'teachers';
}

interface FilterState {
  search: string;
  type: 'all' | 'admission' | 'withdrawal' | 'transfer' | 'permission' | 'general';
  status: 'all' | 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';
}

export default function FormsPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', type: 'all', status: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me?.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load forms
    async function loadForms() {
      try {
        const data = await api.get<any[]>('/api/v1/forms');
        setForms(data || []);
      } catch (err) {
        setForms([]);
      } finally {
        setLoading(false);
      }
    }

    loadForms();
  }, []);

  const filteredForms = forms.filter((form: Form) => {
    const matchesSearch = filters.search
      ? form.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        form.type.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesType = filters.type === 'all' || form.type === filters.type;
    const matchesStatus = filters.status === 'all' || form.status === filters.status;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Compute summary stats
  const totalForms = filteredForms.length;
  const submittedCount = filteredForms.filter(f => f.status === 'submitted').length;
  const approvedCount = filteredForms.filter(f => f.status === 'approved').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Forms Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalForms}</div>
                <div className="text-sm text-neutral-500">Forms</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-brand-primary">{submittedCount}</div>
                <div className="text-sm text-neutral-500">Submitted</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-green-600">{approvedCount}</div>
                <div className="text-sm text-neutral-500">Approved</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Rejected</div>
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
                    placeholder="Search form name or type..."
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
                    <option value="admission">Admission</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="transfer">Transfer</option>
                    <option value="permission">Permission</option>
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
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Forms Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredForms.length === 0 ? (
            <KpiEmptyStateComponent
              icon="FileText"
              title="No forms found"
              description="Create forms to get started"
              actionLabel="Create Form"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Name</TableHeadCell>
                <TableHeadCell style="primary">Type</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">Created</TableHeadCell>
                <TableHeadCell style="primary">Submitted</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredForms.slice(0, 15).map((form: Form, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{form.name}</span>
                    <span className="text-neutral-500 text-xs">{form.type}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${form.status}`}>{form.status}</span>
                    <span className="text-neutral-500 text-xs">{new Date(form.createdAt).toLocaleDateString()}</span>
                    <span className="text-neutral-500 text-xs">{form.submittedAt ? new Date(form.submittedAt).toLocaleDateString() : '—'}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredForms.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredForms.length} of {forms.length} forms</span>
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