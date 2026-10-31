'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Building, Search, Grid, Eye, X,
  Info, UsersOff, Shield, Calendar, UsersAdd
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

interface Class {
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
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', grade: 'all', status: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'ADMIN');
    });

    // Load classes
    async function loadClasses() {
      try {
        const data = await api.get<any[]>/api/v1/classes>;
        setClasses(data || []);
      } catch (err) {
        setClasses([]);
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, []);

  const filteredClasses = classes.filter((cls: Class) => {
    const matchesSearch = filters.search
      ? cls.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        cls.teacher.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesGrade = filters.grade === 'all' || cls.grade === filters.grade;
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-neutral-900">
                  Classes & Sections
                </h2>
                <p className="text-neutral-500 text-sm">
                  {filteredClasses.length} of {classes.length} classes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-8 w-8 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search classes..."
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
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Classes Table */}
            {loading ? (
              <Skeleton className="h-64 rounded-md animate-bounce" />
            ) : filteredClasses.length === 0 ? (
              <KpiEmptyStateComponent
                icon="UsersOff"
                title="No classes found"
                description="Add classes to get started"
                actionLabel="Add Class"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell style="primary">Class Name</TableHeadCell>
                  <TableHeadCell style="primary">Grade</TableHeadCell>
                  <TableHeadCell style="primary">Teacher</TableHeadCell>
                  <TableHeadCell style="primary">Students</TableHeadCell>
                  <TableHeadCell style="primary">Capacity</TableHeadCell>
                  <TableHeadCell style="primary">Status</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {filteredClasses.map((cls: Class, index: number) => (
                    <TableRowCell key={index} style="primary">
                      <span className="font-medium text-neutral-700">{cls.name}</span>
                      <span className="text-neutral-500 text-xs">{cls.grade} {cls.section}</span>
                      <span className="font-medium text-neutral-700">{cls.teacher}</span>
                      <span className="font-medium text-neutral-700">{cls.studentCount}</span>
                      <span className="font-medium text-neutral-700">{cls.capacity}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${cls.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {cls.status}
                      </span>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}

            {/* Pagination */}
            {filteredClasses.length > 0 && (
              <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
                <span>Showing {filteredClasses.length} of {classes.length} classes</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">Previous</Button>
                  <Button variant="primary" size="sm">Next</Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}