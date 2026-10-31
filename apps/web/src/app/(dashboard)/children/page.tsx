'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, User, Search,
  CheckCircle2, X, UsersAdd, Calendar
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

interface ChildRecord {
  id: string;
  name: string;
  grade: string;
  section: string;
  parentName: string;
  contact: string;
  status: 'active' | 'inactive' | 'transferred';
  admissionDate: string;
  dateOfBirth: string;
  bloodGroup: string | null;
  allergies: string | null;
  medicalConditions: string | null;
}

interface FilterState {
  search: string;
  status: 'all' | 'active' | 'inactive' | 'transferred';
  grade: 'all' | 'grade-1' | 'grade-2' | 'grade-3' | 'grade-4' | 'grade-5' | 'grade-6' | 'grade-7' | 'grade-8' | 'grade-9' | 'grade-10' | 'grade-11' | 'grade-12';
}

export default function ChildrenPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'PARENT' | 'REGISTRAR'>('ADMIN');
  const [records, setRecords] = useState<ChildRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', status: 'all', grade: 'all' });
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

    // Load children records
    async function loadRecords() {
      try {
        const data = await api.get<any[]>('/api/v1/children');
        setRecords(data || []);
      } catch (err) {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
  }, []);

  const filteredRecords = records.filter((record: ChildRecord) => {
    const matchesSearch = filters.search
      ? record.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.parentName.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesStatus = filters.status === 'all' || record.status === filters.status;
    const matchesGrade = filters.grade === 'all' || record.grade === filters.grade;

    return matchesSearch && matchesStatus && matchesGrade;
  });

  // Compute summary stats
  const totalRecords = filteredRecords.length;
  const activeCount = filteredRecords.filter(r => r.status === 'active').length;
  const inactiveCount = filteredRecords.filter(r => r.status === 'inactive').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Children Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalRecords}</div>
                <div className="text-sm text-neutral-500">Children</div>
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
                <div className="text-sm text-neutral-500">Transferred</div>
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
                    placeholder="Search child name or parent..."
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
                    <option value="transferred">Transferred</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Grade</label>
                  <select
                    value={filters.grade}
                    onChange={(e) => setFilters({ ...filters, grade: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Grades</option>
                    <option value="grade-1">Grade 1</option>
                    <option value="grade-2">Grade 2</option>
                    <option value="grade-3">Grade 3</option>
                    <option value="grade-4">Grade 4</option>
                    <option value="grade-5">Grade 5</option>
                    <option value="grade-6">Grade 6</option>
                    <option value="grade-7">Grade 7</option>
                    <option value="grade-8">Grade 8</option>
                    <option value="grade-9">Grade 9</option>
                    <option value="grade-10">Grade 10</option>
                    <option value="grade-11">Grade 11</option>
                    <option value="grade-12">Grade 12</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Children Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredRecords.length === 0 ? (
            <KpiEmptyStateComponent
              icon="User"
              title="No children records found"
              description="Add children records to get started"
              actionLabel="Add Child"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Name</TableHeadCell>
                <TableHeadCell style="primary">Grade</TableHeadCell>
                <TableHeadCell style="primary">Section</TableHeadCell>
                <TableHeadCell style="primary">Parent</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">DOB</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredRecords.slice(0, 15).map((record: ChildRecord, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{record.name}</span>
                    <span className="text-neutral-500 text-xs">{record.grade}</span>
                    <span className="text-neutral-500 text-xs">{record.section}</span>
                    <span className="text-neutral-500 text-xs">{record.parentName}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${record.status}`}>{record.status}</span>
                    <span className="text-neutral-500 text-xs">{new Date(record.dateOfBirth).toLocaleDateString()}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredRecords.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredRecords.length} of {records.length} children</span>
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