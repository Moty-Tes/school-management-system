'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Search, Grid, Eye, X,
  Info, Shield, Calendar
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  section: string;
  status: 'active' | 'inactive' | 'graduated';
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
        setStudents(data || []);
      } catch (err) {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, []);

  const filteredStudents = students.filter((student: Student) => {
    const matchesSearch = filters.search
      ? student.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.email.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesGrade = filters.grade === 'all' || student.grade === filters.grade;
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-neutral-900">
                  Student Directory
                </h2>
                <p className="text-neutral-500 text-sm">
                  {students.length} students enrolled
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-8 w-8 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search students..."
                  className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  defaultValue=""
                />
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Grade</label>
                <select
                  value={filters.grade}
                  onChange={(e) => setFilters({ ...filters, grade: e.target.value } as any)}
                  className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                >
                  <option value="all">All Grades</option>
                  <option value="grade-9">Grade 9</option>
                  <option value="grade-10">Grade 10</option>
                  <option value="grade-11">Grade 11</option>
                  <option value="grade-12">Grade 12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value } as any)}
                  className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
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
              <Skeleton className="h-64 rounded-md animate-bounce" />
            ) : filteredStudents.length === 0 ? (
              <KpiEmptyStateComponent
                icon="UsersOff"
                title="No students found"
                description="Try adjusting your filters or add new students"
                actionLabel="Add Student"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell style="primary">Name</TableHeadCell>
                  <TableHeadCell style="primary">Grade</TableHeadCell>
                  <TableHeadCell style="primary">Email</TableHeadCell>
                  <TableHeadCell style="primary">Status</TableHeadCell>
                  <TableHeadCell style="primary">Enrolled</TableHeadCell>
                  <TableHeadCell style="primary">Actions</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {filteredStudents.map((student: Student, index: number) => (
                    <TableRowCell key={index} style="primary">
                      <span className="font-medium text-neutral-700">{student.name}</span>
                      <span className="text-neutral-500 text-xs">{student.grade}</span>
                      <span className="text-neutral-500 text-xs">{student.email}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {student.status}
                      </span>
                      <span className="text-neutral-500 text-xs">
                        {new Date(student.enrollmentDate).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-neutral-500 hover:text-neutral-700"
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-neutral-500 hover:text-neutral-700"
                        >
                          Edit
                        </Button>
                      </div>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}

            {/* Pagination */}
            {filteredStudents.length > 0 && (
              <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
                <span>Showing {filteredStudents.length} of {students.length} students</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">Previous</Button>
                  <Button variant="primary" size="sm">Next</Button>
                </div>
              </div>
            )}
          </Card>
                </div>
      </motion.div>
    </div>
  );
}