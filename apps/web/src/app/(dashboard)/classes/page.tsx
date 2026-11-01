'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Building, Search, Grid, Eye, X,
  Info, Shield, Calendar, BookOpen
} from 'lucide-react';
import {
  Card, Skeleton, Table, TableHeadCell, TableRowCell, KpiEmptyStateComponent, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface ClassItem {
  id: string;
  name: string;
  grade: string;
  section: string;
  teacher: string;
  studentCount: number;
  capacity: number;
  status: 'active' | 'archived';
}

interface FilterState {
  search: string;
  grade: string;
  status: 'all' | 'active' | 'archived';
}

export default function ClassesPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', grade: 'all', status: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me?.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'ADMIN');
    });

    // Load classes
    async function loadClasses() {
      try {
        const data = await api.get<any[]>('/api/v1/classes');
        const mapped: ClassItem[] = (Array.isArray(data) ? data : []).map((c: any) => ({
          id: c.id,
          name: c.name || 'Cohort',
          grade: c.grade || c.name || 'Grade 10',
          section: c.section || 'A',
          teacher: c.teacher || 'Faculty Advisor',
          studentCount: Number(c.studentCount ?? c._count?.students ?? 0),
          capacity: Number(c.capacity || 35),
          status: (c.status || 'active').toLowerCase() as any,
        }));
        setClasses(mapped);
      } catch (err) {
        setClasses([]);
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, []);

  const filteredClasses = classes.filter((cls: ClassItem) => {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch = filters.search
      ? (cls.name || '').toLowerCase().includes(searchLower) ||
        (cls.section || '').toLowerCase().includes(searchLower) ||
        (cls.teacher || '').toLowerCase().includes(searchLower)
      : true;
    const filterGradeClean = filters.grade.replace('grade-', 'Grade ');
    const matchesGrade = filters.grade === 'all' || (cls.grade || '').toLowerCase().includes(filterGradeClean.toLowerCase());
    const matchesStatus = filters.status === 'all' || cls.status === filters.status;

    return matchesSearch && matchesGrade && matchesStatus;
  });

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                  Academic Classes & Cohorts
                </h2>
                <p className="text-neutral-500 text-sm mt-0.5">
                  {filteredClasses.length} of {classes.length} active class streams
                </p>
              </div>
              <div className="flex items-center gap-2 max-w-sm w-full">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search classes or sections..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#E86524]/20 transition-all"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Academic Grade</label>
                <select
                  value={filters.grade}
                  onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E86524]/20 transition-all"
                >
                  <option value="all">All Grades</option>
                  <option value="grade-9">Grade 9</option>
                  <option value="grade-10">Grade 10</option>
                  <option value="grade-11">Grade 11</option>
                  <option value="grade-12">Grade 12</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E86524]/20 transition-all"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Classes Table */}
            {loading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : filteredClasses.length === 0 ? (
              <KpiEmptyStateComponent
                icon="UsersOff"
                title="No classes found"
                description="Adjust your search criteria or add new classes"
                actionLabel="Add Class"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell style="primary">Class Name</TableHeadCell>
                  <TableHeadCell style="primary">Section / Stream</TableHeadCell>
                  <TableHeadCell style="primary">Faculty Lead</TableHeadCell>
                  <TableHeadCell style="primary">Enrolled Students</TableHeadCell>
                  <TableHeadCell style="primary">Classroom Capacity</TableHeadCell>
                  <TableHeadCell style="primary">Status</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {filteredClasses.map((cls: ClassItem, index: number) => {
                    const occupancy = Math.round((cls.studentCount / cls.capacity) * 100);
                    return (
                      <TableRowCell key={cls.id || index} style="primary">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#1B4F8C]/10 text-[#1B4F8C] dark:bg-[#1B4F8C]/30 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-neutral-900 dark:text-white">{cls.name}</span>
                        </div>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300 text-xs">
                          Section {cls.section}
                        </span>
                        <span className="text-neutral-600 dark:text-neutral-400 text-xs">{cls.teacher}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-neutral-900 dark:text-white text-xs">{cls.studentCount}</span>
                          <span className="text-[10px] text-neutral-400">({occupancy}%)</span>
                        </div>
                        <span className="font-mono text-neutral-500 text-xs">{cls.capacity} seats</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            cls.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}
                        >
                          {cls.status}
                        </span>
                      </TableRowCell>
                    );
                  })}
                </TableSection.body>
              </Table>
            )}

            {/* Footer */}
            {filteredClasses.length > 0 && (
              <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
                <span>Showing {filteredClasses.length} of {classes.length} classes</span>
              </div>
            )}
          </Card>
        </div>
      </motion.div>
    </div>
  );
}