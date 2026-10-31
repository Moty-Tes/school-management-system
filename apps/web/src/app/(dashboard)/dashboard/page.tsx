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
  XAxis, YAxis, Tooltip, Cell, Legend, PieChart, Pie,
  AreaChart, Area, Line, Cell as LineCell, XAxis as LineXAxis, YAxis as LineYAxis
} from 'recharts';
import {
  Card, KpiCard, EmptyState, Skeleton, Table, TableHeadCell, TableRowCell, KpiEmptyState, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

export default function DashboardPage() {
  const [role, setRole] = useState<'ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'REGISTRAR'>('ADMIN');
  const [adminData, setAdminData] = useState<any>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ firstName?: string; lastName?: string }>({});
  const [loading, setLoading] = useState(true);
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
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
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
          .then(invoices => setRecentInvoices(invoices || []))
          .catch(() => setRecentInvoices([]));
      } else if (isStudent || isParent) {
        api.get('/api/v1/analytics/me')
          .then(data => setStudentData(data))
          .catch(() => {});
      } else if (isTeacher) {
        api.get<any[]>('/api/v1/teacher/assignments').then(d => setTeacherAssignments(d || [])).catch(() => setTeacherAssignments([]));
        api.get<any[]>('/api/v1/teacher/attendance').then(d => setTeacherAttendance(d || [])).catch(() => setTeacherAttendance([]));
      } else if (isParent) {
        api.get<any[]>('/api/v1/parent/children').then(d => setParentChildren(d || [])).catch(() => setParentChildren([]));
        api.get<any[]>('/api/v1/parent/financial').then(d => setParentFinancial(d || [])).catch(() => setParentFinancial([]));
      } else if (isStudent) {
        api.get<any[]>('/api/v1/student/assignments').then(d => setStudentAssignments(d || [])).catch(() => setStudentAssignments([]));
        api.get<any[]>('/api/v1/student/timetable').then(d => setStudentTimetable(d || [])).catch(() => setStudentTimetable([]));
      } else if (isRegistrar) {
        api.get<any[]>('/api/v1/registrar/students').then(d => setRegistrarStudents(d || [])).catch(() => setRegistrarStudents([]));
        api.get<any[]>('/api/v1/registrar/admissions').then(d => setRegistrarAdmissions(d || [])).catch(() => setRegistrarAdmissions([]));
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-neutral-50 dark:bg-neutral-900">
        <div className="relative">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-brand-primary to-neutral-800 animate-spin flex items-center justify-center shadow-lg shadow-brand-primary/30" />
          <div className="absolute inset-0 rounded-lg blur-lg bg-brand-primary/50 animate-pulse" />
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider animate-pulse">Initializing Dashboard...</p>
      </div>
    );
  }

  // =========================================================================
  // ACCOUNTANT DASHBOARD
  // =========================================================================
  if (role === 'ACCOUNTANT') {
    const totalRev = adminData?.totalRevenue ?? adminData?.revenueData?.reduce((s: number, r: any) => s + (r.total || 0), 0) ?? 0;
    const pendingAmt = adminData?.pendingAmount ?? 0;
    const invCount = adminData?.invoiceCount ?? recentInvoices.length;
    const studentCount = adminData?.totalStudents ?? 0;

    return (
      <div className="space-y-8 bg-neutral-50 dark:bg-neutral-900">
        {/* Revenue Summary Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            value={totalRev.toLocaleString()}
            label="Total Revenue"
            trend="up"
            trendValue="+12.5% vs last year"
            subtitle="Fiscal Year 2026"
            variant="primary"
          />
          <KpiCard
            value={pendingAmt.toLocaleString()}
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
              <button
                className="text-sm font-medium text-brand-primary hover:underline"
              >
                View All
              </button>
            </div>
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Invoice #</TableHeadCell>
                <TableHeadCell style="primary">Student</TableHeadCell>
                <TableHeadCell style="primary">Amount</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">Date</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {recentInvoices.slice(0, 10).map((inv: any, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-brand-primary" />
                      <span className="font-medium text-neutral-700">INV-{inv.id}</span>
                    </div>
                    <span className="font-medium text-neutral-700">{inv.studentName}</span>
                    <span className="font-medium text-neutral-700">${inv.amount.toLocaleString()}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {inv.status}
                    </span>
                    <span className="text-neutral-500 text-xs">{new Date(inv.date).toLocaleDateString()}</span>
                  </TableRowCell>
                ))}
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
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={adminData?.studentDistribution || []}
                  dataKey="amount"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {(adminData?.studentDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || "#6366f1"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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
                <TableHeadCell style="primary">Date</TableHeadCell>
                <TableHeadCell style="primary">Event</TableHeadCell>
                <TableHeadCell style="primary">Category</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {adminData?.upcomingEvents?.map((event: any, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="text-neutral-500 text-xs">{new Date(event.date).toLocaleDateString()}</span>
                    <span className="font-medium text-neutral-700">{event.title}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${event.color}`}
                    >
                      {event.title.split(' ')[0]}
                    </span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
            <div className="mt-3 text-right">
              <a href="/calendar" className="text-sm font-medium text-brand-primary hover:underline">
                View all events
              </a>
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
    const totalRev = adminData?.totalRevenue ?? adminData?.revenueData?.reduce((s: number, r: any) => s + (r.total || 0), 0) ?? 0;
    const pendingAmt = adminData?.pendingAmount ?? 0;
    const invCount = adminData?.invoiceCount ?? recentInvoices.length;
    const studentCount = adminData?.totalStudents ?? 0;
    const teacherCount = adminData?.teacherCount ?? 0;
    const classCount = adminData?.classCount ?? 0;

    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Revenue KPI */}
        <Card>
          <KpiCard
            value={totalRev.toLocaleString()}
            label="Total Revenue"
            trend="up"
            trendValue="+12.5% vs last year"
            subtitle="Fiscal Year 2026"
            variant="primary"
          />
        </Card>

        {/* Pending Payments KPI */}
        <Card>
          <KpiCard
            value={pendingAmt.toLocaleString()}
            label="Pending Payments"
            trend="down"
            trendValue="+8.3% vs last month"
            subtitle="Outstanding invoices"
            variant="warning"
          />
        </Card>

        {/* Invoice Count KPI */}
        <Card>
          <KpiCard
            value={invCount}
            label="Invoice Count"
            trend="up"
            trendValue="+15 vs last period"
            subtitle="Paid & unpaid"
            variant="default"
          />
        </Card>

        {/* Student Count KPI */}
        <Card>
          <KpiCard
            value={studentCount}
            label="Total Students"
            trend="neutral"
            trendValue="—"
            subtitle="Enrolled this year"
            variant="default"
          />
        </Card>

        {/* Teacher Count KPI */}
        <Card>
          <KpiCard
            value={teacherCount}
            label="Teacher Count"
            trend="neutral"
            trendValue="—"
            subtitle="Active faculty"
            variant="default"
          />
        </Card>

        {/* Class Count KPI */}
        <Card>
          <KpiCard
            value={classCount}
            label="Class Count"
            trend="neutral"
            trendValue="—"
            subtitle="Active classes"
            variant="default"
          />
        </Card>

        {/* Recent Invoices Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-neutral-900">
              Recent Invoices
            </h3>
            <button className="text-sm font-medium text-brand-primary hover:underline">
              View All
            </button>
          </div>
          <Table>
            <TableSection.head>
              <TableHeadCell style="primary">Invoice #</TableHeadCell>
              <TableHeadCell style="primary">Student</TableHeadCell>
              <TableHeadCell style="primary">Amount</TableHeadCell>
              <TableHeadCell style="primary">Status</TableHeadCell>
              <TableHeadCell style="primary">Date</TableHeadCell>
            </TableSection.head>
            <TableSection.body>
              {recentInvoices.slice(0, 10).map((inv: any, index: number) => (
                <TableRowCell key={index} style="primary">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-brand-primary" />
                    <span className="font-medium text-neutral-700">INV-{inv.id}</span>
                  </div>
                  <span className="font-medium text-neutral-700">{inv.studentName}</span>
                  <span className="font-medium text-neutral-700">${inv.amount.toLocaleString()}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {inv.status}
                  </span>
                  <span className="text-neutral-500 text-xs">{new Date(inv.date).toLocaleDateString()}</span>
                </TableRowCell>
              ))}
            </TableSection.body>
          </Table>
        </Card>

        {/* Student Distribution Chart */}
        <Card>
          <h3 className="text-lg font-medium text-neutral-900 mb-4">
            Student Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                  data={adminData?.studentDistribution || []}
                  dataKey="amount"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {(adminData?.studentDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || "#6366f1"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <h3 className="text-lg font-medium text-neutral-900 mb-4">
            Upcoming Events
          </h3>
          <Table>
            <TableSection.head>
              <TableHeadCell style="primary">Date</TableHeadCell>
              <TableHeadCell style="primary">Event</TableHeadCell>
              <TableHeadCell style="primary">Category</TableHeadCell>
            </TableSection.head>
            <TableSection.body>
              {adminData?.upcomingEvents?.map((event: any, index: number) => (
                <TableRowCell key={index} style="primary">
                  <span className="text-neutral-500 text-xs">{new Date(event.date).toLocaleDateString()}</span>
                  <span className="font-medium text-neutral-700">{event.title}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${event.color}`}
                  >
                    {event.title.split(' ')[0]}
                  </span>
                </TableRowCell>
              ))}
            </TableSection.body>
          </Table>
          <div className="mt-3 text-right">
            <a href="/calendar" className="text-sm font-medium text-brand-primary hover:underline">
              View all events
            </a>
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
                  <TableHeadCell style="primary">Assignment</TableHeadCell>
                  <TableHeadCell style="primary">Due Date</TableHeadCell>
                  <TableHeadCell style="primary">Status</TableHeadCell>
                  <TableHeadCell style="primary">Students</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {assignments.slice(0, 8).map((assignment: any, index: number) => (
                    <TableRowCell key={index} style="primary">
                      <span className="font-medium text-neutral-700">{assignment.title}</span>
                      <span className="text-neutral-500 text-xs">{new Date(assignment.dueDate).toLocaleDateString()}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${assignment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-amber-800'}`}
                      >
                        {assignment.status}
                      </span>
                      <span className="text-neutral-500 text-xs">{assignment.studentCount} students</span>
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
                  <TableHeadCell style="primary">Date</TableHeadCell>
                  <TableHeadCell style="primary">Present</TableHeadCell>
                  <TableHeadCell style="primary">Absent</TableHeadCell>
                  <TableHeadCell style="primary">Rate</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {attendance.slice(0, 8).map((att: any, index: number) => (
                    <TableRowCell key={index} style="primary">
                      <span className="text-neutral-500 text-xs">{new Date(att.date).toLocaleDateString()}</span>
                      <span className="font-medium text-neutral-700">{att.present} present</span>
                      <span className="font-medium text-neutral-700">{att.absent} absent</span>
                      <span
                        className={`text-sm font-medium ${att.rate >= 90 ? 'text-green-600' : att.rate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}
                      >
                        {att.rate}%
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
                  <TableHeadCell style="primary">Child Name</TableHeadCell>
                  <TableHeadCell style="primary">Grade</TableHeadCell>
                  <TableHeadCell style="primary">Section</TableHeadCell>
                  <TableHeadCell style="primary">Status</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {children.map((child: any, index: number) => (
                    <TableRowCell key={index} style="primary">
                      <span className="font-medium text-neutral-700">{child.name}</span>
                      <span className="text-neutral-500 text-xs">{child.grade}</span>
                      <span className="text-neutral-500 text-xs">{child.section}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${child.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {child.status}
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
                  <TableHeadCell style="primary">Description</TableHeadCell>
                  <TableHeadCell style="primary">Amount</TableHeadCell>
                  <TableHeadCell style="primary">Due Date</TableHeadCell>
                  <TableHeadCell style="primary">Status</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {financial.slice(0, 8).map((fee: any, index: number) => (
                    <TableRowCell key={index} style="primary">
                      <span className="font-medium text-neutral-700">{fee.description}</span>
                      <span className="font-medium text-neutral-700">${fee.amount.toLocaleString()}</span>
                      <span className="text-neutral-500 text-xs">{new Date(fee.dueDate).toLocaleDateString()}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${fee.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {fee.status}
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
                  <TableHeadCell style="primary">Assignment</TableHeadCell>
                  <TableHeadCell style="primary">Due</TableHeadCell>
                  <TableHeadCell style="primary">Status</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {assignments.slice(0, 6).map((assignment: any, index: number) => (
                    <TableRowCell key={index} style="primary">
                      <span className="font-medium text-neutral-700">{assignment.title}</span>
                      <span className="text-neutral-500 text-xs">{new Date(assignment.dueDate).toLocaleDateString()}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${assignment.status === 'completed' ? 'bg-green-100 text-green-800' : ''}`}
                      >
                        {assignment.status}
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
                  <TableHeadCell style="primary">Period</TableHeadCell>
                  <TableHeadCell style="primary">Subject</TableHeadCell>
                  <TableHeadCell style="primary">Teacher</TableHeadCell>
                  <TableHeadCell style="primary">Room</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {timetable.slice(0, 10).map((class_: any, index: number) => (
                    <TableRowCell key={index} style="primary">
                      <span className="font-medium text-neutral-700">{class_.period}</span>
                      <span className="font-medium text-neutral-700">{class_.subject}</span>
                      <span className="text-neutral-500 text-xs">{class_.teacher}</span>
                      <span className="text-neutral-500 text-xs">{class_.room}</span>
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
                  <TableHeadCell style="primary">Name</TableHeadCell>
                  <TableHeadCell style="primary">Grade</TableHeadCell>
                  <TableHeadCell style="primary">Email</TableHeadCell>
                  <TableHeadCell style="primary">Enrollment Date</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {students.slice(0, 10).map((student: any, index: number) => (
                    <TableRowCell key={index} style="primary">
                      <span className="font-medium text-neutral-700">{student.name}</span>
                      <span className="text-neutral-500 text-xs">{student.grade}</span>
                      <span className="text-neutral-500 text-xs">{student.email}</span>
                      <span className="text-neutral-500 text-xs">{new Date(student.enrollmentDate).toLocaleDateString()}</span>
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
                  <TableHeadCell style="primary">Applicant Name</TableHeadCell>
                  <TableHeadCell style="primary">Grade</TableHeadCell>
                  <TableHeadCell style="primary">Status</TableHeadCell>
                  <TableHeadCell style="primary">Applied Date</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {admissions.slice(0, 8).map((admission: any, index: number) => (
                    <TableRowCell key={index} style="primary">
                      <span className="font-medium text-neutral-700">{admission.name}</span>
                      <span className="text-neutral-500 text-xs">{admission.grade}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${admission.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-amber-800'}`}
                      >
                        {admission.status}
                      </span>
                      <span className="text-neutral-500 text-xs">{new Date(admission.appliedDate).toLocaleDateString()}</span>
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