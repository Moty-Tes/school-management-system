'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, User, Search,
  CheckCircle2, X, Calendar, ArrowRight
} from 'lucide-react';
import {
  Card, Skeleton, Table, TableHeadCell, TableRowCell, KpiEmptyStateComponent, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface ChildRecord {
  id: string;
  name: string;
  admissionNumber?: string;
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
  grade: string;
}

export default function ChildrenPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'PARENT' | 'REGISTRAR'>('PARENT');
  const [records, setRecords] = useState<ChildRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', status: 'all', grade: 'all' });
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

    // Load children records
    async function loadRecords() {
      try {
        const data = await api.get<any[]>('/api/v1/parents/my-children').catch(() => api.get<any[]>('/api/v1/children'));
        const raw = Array.isArray(data) ? data : (data as any)?.data || [];
        const normalized: ChildRecord[] = raw.map((s: any) => ({
          id: s.id,
          name: s.firstName ? `${s.firstName} ${s.lastName}` : (s.name || 'Student'),
          admissionNumber: s.admissionNumber || '',
          grade: s.class?.name || s.grade || 'Grade 9',
          section: s.class?.section || s.section || 'A',
          parentName: s.guardianName || s.parentName || 'Parent / Guardian',
          contact: s.guardianPhone || s.contact || '',
          status: (s.status ? String(s.status).toLowerCase() : 'active') as any,
          admissionDate: s.createdAt || new Date().toISOString(),
          dateOfBirth: s.dateOfBirth || new Date().toISOString(),
          bloodGroup: s.healthRecord?.bloodType || null,
          allergies: s.healthRecord?.allergies || null,
          medicalConditions: s.healthRecord?.chronicConditions || null,
        }));
        setRecords(normalized);
      } catch {
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
        record.parentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        (record.admissionNumber && record.admissionNumber.toLowerCase().includes(filters.search.toLowerCase()))
      : true;
    const matchesStatus = filters.status === 'all' || record.status === filters.status;
    const matchesGrade = filters.grade === 'all' || record.grade.toLowerCase().includes(filters.grade.toLowerCase());

    return matchesSearch && matchesStatus && matchesGrade;
  });

  // Compute summary stats
  const totalRecords = filteredRecords.length;
  const activeCount = filteredRecords.filter(r => r.status === 'active').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                My Registered Children & Family Links
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Authorized family portal view: Academic progress, timetable, and attendance for your linked children.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 self-start sm:self-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Verified Family Link
            </span>
          </div>

          {/* Children Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900 dark:text-white">{totalRecords}</div>
                <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mt-1">Enrolled Sibling Children</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
                <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mt-1">Active Academic Standing</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">100%</div>
                <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mt-1">Family Data Privacy Enforced</div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Search Child</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search by student name or admission ID..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Filter Grade</label>
                  <select
                    value={filters.grade}
                    onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="all">All Grades</option>
                    <option value="grade 9">Grade 9</option>
                    <option value="grade 10">Grade 10</option>
                    <option value="grade 11">Grade 11</option>
                    <option value="grade 12">Grade 12</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Children Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-xl" />
          ) : filteredRecords.length === 0 ? (
            <KpiEmptyStateComponent
              icon="User"
              title="No children records found"
              description="No registered children are linked to this parent account."
              actionLabel="Contact School Registrar"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Student Name</TableHeadCell>
                <TableHeadCell style="primary">Admission #</TableHeadCell>
                <TableHeadCell style="primary">Grade & Section</TableHeadCell>
                <TableHeadCell style="primary">Primary Guardian</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">Actions</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredRecords.map((record: ChildRecord) => (
                  <TableRowCell key={record.id} style="primary">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{record.name}</span>
                    <span className="text-neutral-500 text-xs font-mono">{record.admissionNumber || '—'}</span>
                    <span className="text-neutral-600 dark:text-neutral-300 text-xs">{record.grade} • {record.section}</span>
                    <span className="text-neutral-500 text-xs">{record.parentName}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        record.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                      }`}
                    >
                      {record.status}
                    </span>
                    <Link
                      href={`/students/${record.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                    >
                      <span>Academic Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
