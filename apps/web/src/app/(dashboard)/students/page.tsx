'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Search, Grid, Eye, X,
  Info, Shield, Calendar, GraduationCap
} from 'lucide-react';
import {
  Card, Skeleton, Table, TableHeadCell, TableRowCell, KpiEmptyStateComponent, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  section: string;
  status: 'active' | 'inactive' | 'graduated';
  admissionNumber?: string;
  enrollmentDate: string;
  lastAttendance: string;
}

interface FilterState {
  search: string;
  grade: string;
  status: 'all' | 'active' | 'inactive' | 'graduated';
}

export default function StudentsPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR' | 'PARENT'>('ADMIN');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', grade: 'all', status: 'all' });
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

    // Load students
    async function loadStudents() {
      try {
        const data = await api.get<any[]>('/api/v1/students');
        const mapped: Student[] = (Array.isArray(data) ? data : []).map((s: any) => ({
          id: s.id,
          name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Enrolled Student',
          email: s.email || `${(s.firstName || 'student').toLowerCase()}.${(s.lastName || 'sms').toLowerCase()}@demo-school.local`,
          grade: s.class ? `${s.class.name} (${s.class.section})` : (s.grade || 'Grade 10'),
          section: s.class?.section || s.section || 'A',
          status: (s.status || 'active').toLowerCase() as any,
          admissionNumber: s.admissionNumber || `SMS-${s.id?.slice(0, 4)}`,
          enrollmentDate: s.createdAt || s.enrollmentDate || new Date().toISOString(),
          lastAttendance: s.lastAttendance || 'Present',
        }));
        setStudents(mapped);
      } catch (err) {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, []);

  const filteredStudents = students.filter((student: Student) => {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch = filters.search
      ? student.name.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.grade.toLowerCase().includes(searchLower)
      : true;
    const filterGradeClean = filters.grade.replace('grade-', 'Grade ');
    const matchesGrade = filters.grade === 'all' || student.grade.toLowerCase().includes(filterGradeClean.toLowerCase());
    const matchesStatus = filters.status === 'all' || student.status === filters.status;

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
                  Student Directory
                </h2>
                <p className="text-neutral-500 text-sm mt-0.5">
                  {students.length} students enrolled across all academic cohorts
                </p>
              </div>
              <div className="flex items-center gap-2 max-w-sm w-full">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search by name, grade, or email..."
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
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            {loading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : filteredStudents.length === 0 ? (
              <KpiEmptyStateComponent
                icon="UsersOff"
                title="No students found"
                description="Try adjusting your filters or search terms"
                actionLabel="Reset Filters"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell style="primary">Student Name</TableHeadCell>
                  <TableHeadCell style="primary">Grade & Section</TableHeadCell>
                  <TableHeadCell style="primary">Institutional Email</TableHeadCell>
                  <TableHeadCell style="primary">Status</TableHeadCell>
                  <TableHeadCell style="primary">Enrolled Date</TableHeadCell>
                  <TableHeadCell style="primary">Actions</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {filteredStudents.map((student: Student, index: number) => (
                    <TableRowCell key={student.id || index} style="primary">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#1B4F8C]/10 text-[#1B4F8C] dark:bg-[#1B4F8C]/30 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-neutral-900 dark:text-white">{student.name}</span>
                      </div>
                      <span className="text-neutral-600 dark:text-neutral-400 text-xs font-medium">{student.grade}</span>
                      <span className="text-neutral-500 font-mono text-xs">{student.email}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          student.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {student.status}
                      </span>
                      <span className="text-neutral-500 text-xs font-mono">
                        {new Date(student.enrollmentDate).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <Link href={`/students/${student.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#1B4F8C] hover:text-[#E86524] font-medium"
                          >
                            View
                          </Button>
                        </Link>
                      </div>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}

            {/* Pagination & Footer */}
            {filteredStudents.length > 0 && (
              <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
                <span>Showing {filteredStudents.length} of {students.length} students</span>
              </div>
            )}
          </Card>
        </div>
      </motion.div>
    </div>
  );
}