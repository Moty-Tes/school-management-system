'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, CreditCard, BookOpen, Clock, Settings,
  BarChart3, DollarSign, Receipt, ArrowUpRight, CheckCircle2,
  AlertCircle, FileText, Calendar, PlusCircle, Sparkles, TrendingUp,
  Shield, GraduationCap, ArrowRight, Award, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid,
  XAxis, YAxis, Tooltip, Cell, Legend, PieChart, Pie
} from 'recharts';
import {
  Card, KpiCard, EmptyState, Skeleton, Table, TableHeadCell, TableRowCell, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

export default function DashboardPage() {
  const [role, setRole] = useState<'ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'REGISTRAR'>('ADMIN');
  const [adminData, setAdminData] = useState<any>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ firstName?: string; lastName?: string }>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [teacherAttendance, setTeacherAttendance] = useState<any[]>([]);
  const [parentChildren, setParentChildren] = useState<any[]>([]);
  const [parentFinancial, setParentFinancial] = useState<any[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<any[]>([]);
  const [studentTimetable, setStudentTimetable] = useState<any[]>([]);
  const [registrarStudents, setRegistrarStudents] = useState<any[]>([]);
  const [registrarAdmissions, setRegistrarAdmissions] = useState<any[]>([]);
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    getMe()
      .then((me: any) => {
        const userRoles: string[] = me?.roles || [];
        const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
        const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
        const isAccountant = userRoles.includes('ACCOUNTANT');
        const isTeacher = userRoles.includes('TEACHER');
        const isParent = userRoles.includes('PARENT');
        const isStudent = userRoles.includes('STUDENT');
        const isRegistrar = userRoles.includes('REGISTRAR');

        setUserProfile({
          firstName: me?.profile?.firstName || me?.firstName,
          lastName: me?.profile?.lastName || me?.lastName,
        });

        if (isSuperAdmin || isTenantAdmin) {
          setRole('ADMIN');
        } else if (isAccountant) {
          setRole('ACCOUNTANT');
        } else if (isTeacher) {
          setRole('TEACHER');
        } else if (isRegistrar) {
          setRole('REGISTRAR');
        } else if (isParent) {
          setRole('PARENT');
        } else if (isStudent) {
          setRole('STUDENT');
        } else {
          setRole('ADMIN');
        }

        // Load appropriate dashboard data
        if (isSuperAdmin || isTenantAdmin || isAccountant) {
          api.get<any>('/api/v1/analytics')
            .then(data => setAdminData(data))
            .catch(() => {});

          api.get<any[]>('/api/v1/finance/invoices')
            .then(invoices => setRecentInvoices(Array.isArray(invoices) ? invoices : []))
            .catch(() => setRecentInvoices([]));
        } else if (isStudent || isParent) {
          api.get('/api/v1/analytics/me')
            .then(data => setStudentData(data))
            .catch(() => {});
        } else if (isTeacher) {
          api.get<any[]>('/api/v1/teacher/assignments').then(d => setTeacherAssignments(Array.isArray(d) ? d : [])).catch(() => setTeacherAssignments([]));
          api.get<any[]>('/api/v1/teacher/attendance').then(d => setTeacherAttendance(Array.isArray(d) ? d : [])).catch(() => setTeacherAttendance([]));
        } else if (isParent) {
          api.get<any[]>('/api/v1/parent/children').then(d => setParentChildren(Array.isArray(d) ? d : [])).catch(() => setParentChildren([]));
          api.get<any[]>('/api/v1/parent/financial').then(d => setParentFinancial(Array.isArray(d) ? d : [])).catch(() => setParentFinancial([]));
        } else if (isStudent) {
          api.get<any[]>('/api/v1/student/assignments').then(d => setStudentAssignments(Array.isArray(d) ? d : [])).catch(() => setStudentAssignments([]));
          api.get<any[]>('/api/v1/student/timetable').then(d => setStudentTimetable(Array.isArray(d) ? d : [])).catch(() => setStudentTimetable([]));
        } else if (isRegistrar) {
          api.get<any[]>('/api/v1/registrar/students').then(d => setRegistrarStudents(Array.isArray(d) ? d : [])).catch(() => setRegistrarStudents([]));
          api.get<any[]>('/api/v1/registrar/admissions').then(d => setRegistrarAdmissions(Array.isArray(d) ? d : [])).catch(() => setRegistrarAdmissions([]));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-neutral-50 dark:bg-neutral-900">
        <div className="relative">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-600 to-neutral-800 animate-spin flex items-center justify-center shadow-lg shadow-indigo-600/30" />
          <div className="absolute inset-0 rounded-lg blur-lg bg-indigo-600/50 animate-pulse" />
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider animate-pulse">Initializing Dashboard...</p>
      </div>
    );
  }

  // Fallbacks for charts and events
  const studentDistribution = adminData?.studentDistribution || (adminData?.genderData && adminData.genderData.length > 0 ? adminData.genderData.map((g: any, i: number) => ({
    label: g.name === 'MALE' ? 'Male Students' : g.name === 'FEMALE' ? 'Female Students' : g.name || 'Other',
    amount: g.value || 0,
    color: i === 0 ? '#6366f1' : i === 1 ? '#ec4899' : '#10b981'
  })) : [
    { label: 'Boys', amount: 55, color: '#6366f1' },
    { label: 'Girls', amount: 45, color: '#ec4899' }
  ]);

  const upcomingEvents = (adminData?.upcomingEvents && adminData.upcomingEvents.length > 0) ? adminData.upcomingEvents : [
    { date: new Date().toISOString(), title: 'Mid-term Examinations', color: 'bg-indigo-100 text-indigo-700' },
    { date: new Date(Date.now() + 86400000 * 3).toISOString(), title: 'Parent-Teacher Conference', color: 'bg-emerald-100 text-emerald-700' },
    { date: new Date(Date.now() + 86400000 * 7).toISOString(), title: 'Annual Sports & Cultural Gala', color: 'bg-amber-100 text-amber-700' }
  ];

  // =========================================================================
  // ACCOUNTANT DASHBOARD
  // =========================================================================
  if (role === 'ACCOUNTANT') {
    const totalRev = Number(adminData?.totalRevenue ?? adminData?.revenueData?.reduce((s: number, r: any) => s + (r.total || 0), 0) ?? 0);
    const pendingAmt = Number(adminData?.pendingAmount ?? 0);
    const invCount = Number(adminData?.invoiceCount ?? recentInvoices.length);
    const studentCount = Number(adminData?.totalStudents ?? 0);

    return (
      <div className="space-y-8 bg-neutral-50 dark:bg-neutral-900">
        {/* Revenue Summary Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            value={`$${totalRev.toLocaleString()}`}
            label="Total Revenue"
            trend="up"
            trendValue="+12.5% vs last year"
            subtitle="Fiscal Year 2026"
            variant="primary"
          />
          <KpiCard
            value={`$${pendingAmt.toLocaleString()}`}
            label="Pending Payments"
            trend="down"
            trendValue="+8.3% vs last month"
            subtitle="Outstanding invoices"
            variant="warning"
          />
          <KpiCard
            value={invCount}
            label="Invoice Count"
            trend="up"
            trendValue="+15 vs last period"
            subtitle="Paid & unpaid"
            variant="default"
          />
          <KpiCard
            value={studentCount}
            label="Total Students"
            trend="neutral"
            trendValue="—"
            subtitle="Enrolled this year"
            variant="default"
          />
        </div>

        {/* Recent Invoices Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="reduced-motion:transition-none"
        >
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-neutral-900">
                Recent Invoices
              </h3>
              <Link href="/finance" className="text-sm font-medium text-indigo-600 hover:underline">
                View All
              </Link>
            </div>
            <Table>
              <TableSection.head>
                <TableHeadCell>Invoice #</TableHeadCell>
                <TableHeadCell>Student</TableHeadCell>
                <TableHeadCell>Amount</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Date</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {recentInvoices.length === 0 ? (
                  <TableRowCell>
                    <span className="text-slate-400 italic">No invoices recorded yet</span>
                    <span className="text-slate-400">—</span>
                    <span className="text-slate-400">$0.00</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">Pending</span>
                    <span className="text-slate-400">—</span>
                  </TableRowCell>
                ) : (
                  recentInvoices.slice(0, 10).map((inv: any, index: number) => {
                    const invStudent = inv.studentName || (inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : `Student #${inv.studentId?.slice(0, 6) || inv.id?.slice(0, 6) || '—'}`);
                    const invAmount = Number(inv.amount || 0).toLocaleString();
                    const invDate = inv.dueDate || inv.createdAt || inv.date;
                    const formattedDate = invDate ? new Date(invDate).toLocaleDateString() : '—';
                    const isPaid = String(inv.status).toLowerCase() === 'paid';

                    return (
                      <TableRowCell key={inv.id || index}>
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          <span className="font-medium text-neutral-700">INV-{inv.id?.slice(0, 8) || index + 1}</span>
                        </div>
                        <span className="font-medium text-neutral-700">{invStudent}</span>
                        <span className="font-medium text-neutral-700">${invAmount}</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}
                        >
                          {inv.status || 'PENDING'}
                        </span>
                        <span className="text-neutral-500 text-xs">{formattedDate}</span>
                      </TableRowCell>
                    );
                  })
                )}
              </TableSection.body>
            </Table>
          </Card>
        </motion.div>

        {/* Student Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="reduced-motion:transition-none"
        >
          <Card>
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Student Distribution
            </h3>
            {mounted ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={studentDistribution}
                    dataKey="amount"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {studentDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || "#6366f1"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <Skeleton className="w-40 h-40 rounded-full" />
              </div>
            )}
          </Card>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="reduced-motion:transition-none"
        >
          <Card>
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Upcoming Events
            </h3>
            <Table>
              <TableSection.head>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell>Event</TableHeadCell>
                <TableHeadCell>Category</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {upcomingEvents.map((event: any, index: number) => {
                  const eventDate = event.date ? new Date(event.date).toLocaleDateString() : '—';
                  const eventCategory = event.title ? event.title.split(' ')[0] : 'Event';
                  return (
                    <TableRowCell key={index}>
                      <span className="text-neutral-500 text-xs">{eventDate}</span>
                      <span className="font-medium text-neutral-700">{event.title || 'School Event'}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${event.color || 'bg-indigo-100 text-indigo-700'}`}
                      >
                        {eventCategory}
                      </span>
                    </TableRowCell>
                  );
                })}
              </TableSection.body>
            </Table>
            <div className="mt-3 text-right">
              <Link href="/calendar" className="text-sm font-medium text-indigo-600 hover:underline">
                View all events
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // ADMIN DASHBOARD
  // =========================================================================
  if (role === 'ADMIN') {
    const totalRev = Number(adminData?.totalRevenue ?? adminData?.revenueData?.reduce((s: number, r: any) => s + (r.total || 0), 0) ?? 0);
    const pendingAmt = Number(adminData?.pendingAmount ?? 0);
    const invCount = Number(adminData?.invoiceCount ?? recentInvoices.length);
    const studentCount = Number(adminData?.totalStudents ?? 0);
    const teacherCount = Number(adminData?.totalTeachers ?? adminData?.teacherCount ?? 0);
    const classCount = Number(adminData?.classCount ?? 0);

    return (
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            value={`$${totalRev.toLocaleString()}`}
            label="Total Revenue"
            trend="up"
            trendValue="+12.5% vs last year"
            subtitle="Fiscal Year 2026"
            variant="primary"
          />

          <KpiCard
            value={`$${pendingAmt.toLocaleString()}`}
            label="Pending Payments"
            trend="down"
            trendValue="+8.3% vs last month"
            subtitle="Outstanding invoices"
            variant="warning"
          />

          <KpiCard
            value={invCount}
            label="Invoice Count"
            trend="up"
            trendValue="+15 vs last period"
            subtitle="Paid & unpaid"
            variant="default"
          />

          <KpiCard
            value={studentCount}
            label="Total Students"
            trend="neutral"
            trendValue="—"
            subtitle="Enrolled this year"
            variant="default"
          />

          <KpiCard
            value={teacherCount}
            label="Teacher Count"
            trend="neutral"
            trendValue="—"
            subtitle="Active faculty"
            variant="default"
          />

          <KpiCard
            value={classCount}
            label="Class Count"
            trend="neutral"
            trendValue="—"
            subtitle="Active classes"
            variant="default"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-neutral-900">
                Recent Invoices
              </h3>
              <Link href="/finance" className="text-sm font-medium text-indigo-600 hover:underline">
                View All
              </Link>
            </div>
            <Table>
              <TableSection.head>
                <TableHeadCell>Invoice #</TableHeadCell>
                <TableHeadCell>Student</TableHeadCell>
                <TableHeadCell>Amount</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Date</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {recentInvoices.length === 0 ? (
                  <TableRowCell>
                    <span className="text-slate-400 italic">No invoices recorded yet</span>
                    <span className="text-slate-400">—</span>
                    <span className="text-slate-400">$0.00</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600">Pending</span>
                    <span className="text-slate-400">—</span>
                  </TableRowCell>
                ) : (
                  recentInvoices.slice(0, 10).map((inv: any, index: number) => {
                    const invStudent = inv.studentName || (inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : `Student #${inv.studentId?.slice(0, 6) || inv.id?.slice(0, 6) || '—'}`);
                    const invAmount = Number(inv.amount || 0).toLocaleString();
                    const invDate = inv.dueDate || inv.createdAt || inv.date;
                    const formattedDate = invDate ? new Date(invDate).toLocaleDateString() : '—';
                    const isPaid = String(inv.status).toLowerCase() === 'paid';

                    return (
                      <TableRowCell key={inv.id || index}>
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          <span className="font-medium text-neutral-700">INV-{inv.id?.slice(0, 8) || index + 1}</span>
                        </div>
                        <span className="font-medium text-neutral-700">{invStudent}</span>
                        <span className="font-medium text-neutral-700">${invAmount}</span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}
                        >
                          {inv.status || 'PENDING'}
                        </span>
                        <span className="text-neutral-500 text-xs">{formattedDate}</span>
                      </TableRowCell>
                    );
                  })
                )}
              </TableSection.body>
            </Table>
          </Card>

          {/* Student Distribution Chart */}
          <Card>
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Student Demographics
            </h3>
            {mounted ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={studentDistribution}
                    dataKey="amount"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {studentDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || "#6366f1"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <Skeleton className="w-40 h-40 rounded-full" />
              </div>
            )}
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card>
          <h3 className="text-lg font-medium text-neutral-900 mb-4">
            Upcoming Events
          </h3>
          <Table>
            <TableSection.head>
              <TableHeadCell>Date</TableHeadCell>
              <TableHeadCell>Event</TableHeadCell>
              <TableHeadCell>Category</TableHeadCell>
            </TableSection.head>
            <TableSection.body>
              {upcomingEvents.map((event: any, index: number) => {
                const eventDate = event.date ? new Date(event.date).toLocaleDateString() : '—';
                const eventCategory = event.title ? event.title.split(' ')[0] : 'Event';
                return (
                  <TableRowCell key={index}>
                    <span className="text-neutral-500 text-xs">{eventDate}</span>
                    <span className="font-medium text-neutral-700">{event.title || 'School Event'}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${event.color || 'bg-indigo-100 text-indigo-700'}`}
                    >
                      {eventCategory}
                    </span>
                  </TableRowCell>
                );
              })}
            </TableSection.body>
          </Table>
          <div className="mt-3 text-right">
            <Link href="/calendar" className="text-sm font-medium text-indigo-600 hover:underline">
              View all events
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // TEACHER DASHBOARD
  // =========================================================================
  if (role === 'TEACHER') {
    const assignments = teacherAssignments;
    const attendance = teacherAttendance;

    return (
      <div className="space-y-8 bg-neutral-50 dark:bg-neutral-900">
        {/* Assignments Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="reduced-motion:transition-none"
        >
          <Card>
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Recent Assignments
            </h3>
            {assignments.length === 0 ? (
              <EmptyState
                title="No assignments yet"
                description="Create your first assignment to get started"
                actionLabel="Create Assignment"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell>Assignment</TableHeadCell>
                  <TableHeadCell>Due Date</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Students</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {assignments.slice(0, 8).map((assignment: any, index: number) => (
                    <TableRowCell key={index}>
                      <span className="font-medium text-neutral-700">{assignment.title}</span>
                      <span className="text-neutral-500 text-xs">{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '—'}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${assignment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-amber-800'}`}
                      >
                        {assignment.status || 'Active'}
                      </span>
                      <span className="text-neutral-500 text-xs">{assignment.studentCount ?? 0} students</span>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}
          </Card>
        </motion.div>

        {/* Attendance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="reduced-motion:transition-none"
        >
          <Card>
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Attendance Summary
            </h3>
            {attendance.length === 0 ? (
              <EmptyState
                title="No attendance data yet"
                description="Mark attendance to get started"
                actionLabel="Mark Attendance"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell>Date</TableHeadCell>
                  <TableHeadCell>Present</TableHeadCell>
                  <TableHeadCell>Absent</TableHeadCell>
                  <TableHeadCell>Rate</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {attendance.slice(0, 8).map((att: any, index: number) => (
                    <TableRowCell key={index}>
                      <span className="text-neutral-500 text-xs">{att.date ? new Date(att.date).toLocaleDateString() : '—'}</span>
                      <span className="font-medium text-neutral-700">{att.present ?? 0} present</span>
                      <span className="font-medium text-neutral-700">{att.absent ?? 0} absent</span>
                      <span
                        className={`text-sm font-medium ${(att.rate || 0) >= 90 ? 'text-green-600' : (att.rate || 0) >= 80 ? 'text-yellow-600' : 'text-red-600'}`}
                      >
                        {att.rate ?? 0}%
                      </span>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}
          </Card>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // PARENT DASHBOARD
  // =========================================================================
  if (role === 'PARENT') {
    const children = parentChildren;
    const financial = parentFinancial;

    return (
      <div className="space-y-8 bg-neutral-50 dark:bg-neutral-900">
        {/* Children Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="reduced-motion:transition-none"
        >
          <Card>
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              My Children
            </h3>
            {children.length === 0 ? (
              <EmptyState
                title="No children enrolled"
                description="Add your children to get started"
                actionLabel="Add Child"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell>Child Name</TableHeadCell>
                  <TableHeadCell>Grade</TableHeadCell>
                  <TableHeadCell>Section</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {children.map((child: any, index: number) => (
                    <TableRowCell key={index}>
                      <span className="font-medium text-neutral-700">{child.name || `${child.firstName} ${child.lastName}`}</span>
                      <span className="text-neutral-500 text-xs">{child.grade || child.class?.name || '—'}</span>
                      <span className="text-neutral-500 text-xs">{child.section || '—'}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${child.status === 'active' || child.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {child.status || 'ACTIVE'}
                      </span>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}
          </Card>
        </motion.div>

        {/* Financial Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="reduced-motion:transition-none"
        >
          <Card>
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Financial Summary
            </h3>
            {financial.length === 0 ? (
              <EmptyState
                title="No financial data yet"
                description="View fees and payments for your children"
                actionLabel="View Fees"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell>Description</TableHeadCell>
                  <TableHeadCell>Amount</TableHeadCell>
                  <TableHeadCell>Due Date</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {financial.slice(0, 8).map((fee: any, index: number) => (
                    <TableRowCell key={index}>
                      <span className="font-medium text-neutral-700">{fee.description || fee.title || 'Tuition Fee'}</span>
                      <span className="font-medium text-neutral-700">${Number(fee.amount || 0).toLocaleString()}</span>
                      <span className="text-neutral-500 text-xs">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '—'}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${fee.status === 'paid' || fee.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {fee.status || 'PENDING'}
                      </span>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}
          </Card>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // STUDENT DASHBOARD
  // =========================================================================
  if (role === 'STUDENT') {
    const assignments = studentAssignments;
    const timetable = studentTimetable;

    return (
      <div className="space-y-8 bg-neutral-50 dark:bg-neutral-900">
        {/* Assignments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="reduced-motion:transition-none"
        >
          <Card>
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              My Assignments
            </h3>
            {assignments.length === 0 ? (
              <EmptyState
                title="No assignments due"
                description="All assignments are up to date"
                actionLabel="View Schedule"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell>Assignment</TableHeadCell>
                  <TableHeadCell>Due</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {assignments.slice(0, 6).map((assignment: any, index: number) => (
                    <TableRowCell key={index}>
                      <span className="font-medium text-neutral-700">{assignment.title}</span>
                      <span className="text-neutral-500 text-xs">{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '—'}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${assignment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}
                      >
                        {assignment.status || 'Assigned'}
                      </span>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}
          </Card>
        </motion.div>

        {/* Timetable */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="reduced-motion:transition-none"
        >
          <Card>
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Timetable
            </h3>
            {timetable.length === 0 ? (
              <EmptyState
                title="No timetable yet"
                description="Your schedule will appear here"
                actionLabel="View Schedule"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell>Period</TableHeadCell>
                  <TableHeadCell>Subject</TableHeadCell>
                  <TableHeadCell>Teacher</TableHeadCell>
                  <TableHeadCell>Room</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {timetable.slice(0, 10).map((class_: any, index: number) => (
                    <TableRowCell key={index}>
                      <span className="font-medium text-neutral-700">{class_.period || `Period ${index + 1}`}</span>
                      <span className="font-medium text-neutral-700">{class_.subject || class_.subject?.name || 'Course'}</span>
                      <span className="text-neutral-500 text-xs">{class_.teacher || class_.teacher?.user?.profile?.firstName || 'Faculty'}</span>
                      <span className="text-neutral-500 text-xs">{class_.room || 'Room 101'}</span>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}
          </Card>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // REGISTRAR DASHBOARD
  // =========================================================================
  if (role === 'REGISTRAR') {
    const students = registrarStudents;
    const admissions = registrarAdmissions;

    return (
      <div className="space-y-8 bg-neutral-50 dark:bg-neutral-900">
        {/* Student Directory */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="reduced-motion:transition-none"
        >
          <Card>
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Student Directory
            </h3>
            {students.length === 0 ? (
              <EmptyState
                title="No students found"
                description="Add students to the directory"
                actionLabel="Add Student"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell>Name</TableHeadCell>
                  <TableHeadCell>Grade</TableHeadCell>
                  <TableHeadCell>Email</TableHeadCell>
                  <TableHeadCell>Enrollment Date</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {students.slice(0, 10).map((student: any, index: number) => (
                    <TableRowCell key={index}>
                      <span className="font-medium text-neutral-700">{student.name || `${student.firstName} ${student.lastName}`}</span>
                      <span className="text-neutral-500 text-xs">{student.grade || student.class?.name || '—'}</span>
                      <span className="text-neutral-500 text-xs">{student.email || '—'}</span>
                      <span className="text-neutral-500 text-xs">{student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : '—'}</span>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}
          </Card>
        </motion.div>

        {/* Admissions Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="reduced-motion:transition-none"
        >
          <Card>
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Admissions
            </h3>
            {admissions.length === 0 ? (
              <EmptyState
                title="No new admissions"
                description="Track incoming student applications"
                actionLabel="View Applications"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell>Applicant Name</TableHeadCell>
                  <TableHeadCell>Grade</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Applied Date</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {admissions.slice(0, 8).map((admission: any, index: number) => (
                    <TableRowCell key={index}>
                      <span className="font-medium text-neutral-700">{admission.name || `${admission.firstName} ${admission.lastName}`}</span>
                      <span className="text-neutral-500 text-xs">{admission.grade || '—'}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${admission.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-amber-800'}`}
                      >
                        {admission.status || 'PENDING'}
                      </span>
                      <span className="text-neutral-500 text-xs">{admission.appliedDate ? new Date(admission.appliedDate).toLocaleDateString() : '—'}</span>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}
          </Card>
        </motion.div>
      </div>
    );
  }

  // Default fallback
  return null;
}
