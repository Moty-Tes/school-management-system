'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import {
  Users, CreditCard, BookOpen, Clock, Settings,
  BarChart3, DollarSign, Receipt, ArrowUpRight, CheckCircle2,
  AlertCircle, FileText, Calendar, PlusCircle, Sparkles, TrendingUp,
  Shield, GraduationCap, ArrowRight, Award, Layers, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid,
  XAxis, YAxis, Tooltip, Cell, Legend, PieChart, Pie
} from 'recharts';
import {
  Card, KpiCard, EmptyState, Skeleton, Table, TableHeadCell, TableRowCell, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';
import { SchoolPulseCard, type SchoolPulseData } from '@/components/SchoolPulseCard';

export default function DashboardPage() {
  const [role, setRole] = useState<'ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'PARENT' | 'REGISTRAR' | 'STUDENT'>('ADMIN');
  const [userProfile, setUserProfile] = useState<{ firstName?: string; lastName?: string }>({});
  const [pulseData, setPulseData] = useState<SchoolPulseData | null>(null);
  const [pulseLoading, setPulseLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Genuine Data States (backed by real API endpoints)
  const [adminData, setAdminData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [parentChildren, setParentChildren] = useState<any[]>([]);
  const [parentInvoices, setParentInvoices] = useState<any[]>([]);
  const [timetablePeriods, setTimetablePeriods] = useState<any[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [admissionApplications, setAdmissionApplications] = useState<any[]>([]);

  const reducedMotion = use_reducedMotion();

  // Motion variants that respect prefers-reduced-motion
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.25,
        staggerChildren: reducedMotion ? 0 : 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 8 },
    visible: { opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.2 } },
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // School operations briefing loader
  const fetchPulse = useCallback(async () => {
    try {
      setPulseLoading(true);
      const res = await api.get<SchoolPulseData>('/api/v1/dashboard/pulse');
      if (res) {
        setPulseData(res);
      }
    } catch {
      // Graceful non-blocking if offline or initializing
    } finally {
      setPulseLoading(false);
    }
  }, []);

  // Centralized real data loader
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    // Concurrently trigger pulse briefing
    fetchPulse();

    try {
      // 1. Identify active persona and permissions
      const me = await getMe();
      if (!me) {
        setFetchError('Session not detected. Please sign in again.');
        setLoading(false);
        return;
      }

      const userRoles: string[] = me?.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isAccountant = userRoles.includes('ACCOUNTANT');
      const isTeacher = userRoles.includes('TEACHER');
      const isParent = userRoles.includes('PARENT');
      const isStudent = userRoles.includes('STUDENT');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setUserProfile({
        firstName: me?.firstName || undefined,
        lastName: me?.lastName || undefined,
      });

      let detectedRole: 'ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'PARENT' | 'REGISTRAR' | 'STUDENT' = 'ADMIN';
      if (isSuperAdmin || (isTenantAdmin && !isAccountant && !isTeacher && !isParent && !isStudent && !isRegistrar)) {
        detectedRole = 'ADMIN';
      } else if (isAccountant) {
        detectedRole = 'ACCOUNTANT';
      } else if (isTeacher) {
        detectedRole = 'TEACHER';
      } else if (isParent) {
        detectedRole = 'PARENT';
      } else if (isStudent) {
        detectedRole = 'STUDENT';
      } else if (isRegistrar) {
        detectedRole = 'REGISTRAR';
      }
      setRole(detectedRole);

      // 2. Fetch genuine data corresponding to authorized role
      if (detectedRole === 'ADMIN' || detectedRole === 'ACCOUNTANT') {
        const [analyticsRes, invoicesRes] = await Promise.allSettled([
          api.get<any>('/api/v1/analytics'),
          api.get<any[]>('/api/v1/finance/invoices'),
        ]);

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
          setAdminData(analyticsRes.value);
        } else {
          setAdminData(null);
        }

        if (invoicesRes.status === 'fulfilled' && Array.isArray(invoicesRes.value)) {
          setInvoices(invoicesRes.value);
        } else {
          setInvoices([]);
        }
      } else if (detectedRole === 'TEACHER') {
        const [assignmentsRes, attendanceRes] = await Promise.allSettled([
          api.get<any[]>('/api/v1/assignments'),
          api.get<any>('/api/v1/attendance'),
        ]);

        if (assignmentsRes.status === 'fulfilled' && Array.isArray(assignmentsRes.value)) {
          setAssignments(assignmentsRes.value);
        } else {
          setAssignments([]);
        }

        if (attendanceRes.status === 'fulfilled') {
          const val = attendanceRes.value;
          setAttendanceRecords(Array.isArray(val) ? val : Array.isArray(val?.records) ? val.records : []);
        } else {
          setAttendanceRecords([]);
        }
      } else if (detectedRole === 'PARENT') {
        const [childrenRes, invoicesRes] = await Promise.allSettled([
          api.get<any[]>('/api/v1/parents/my-children'),
          api.get<any[]>('/api/v1/finance/invoices'),
        ]);

        if (childrenRes.status === 'fulfilled' && Array.isArray(childrenRes.value)) {
          setParentChildren(childrenRes.value);
        } else {
          setParentChildren([]);
        }

        if (invoicesRes.status === 'fulfilled' && Array.isArray(invoicesRes.value)) {
          setParentInvoices(invoicesRes.value);
        } else {
          setParentInvoices([]);
        }
      } else if (detectedRole === 'STUDENT') {
        const [assignmentsRes, timetableRes] = await Promise.allSettled([
          api.get<any[]>('/api/v1/assignments'),
          api.get<any[]>('/api/v1/timetable'),
        ]);

        if (assignmentsRes.status === 'fulfilled' && Array.isArray(assignmentsRes.value)) {
          setAssignments(assignmentsRes.value);
        } else {
          setAssignments([]);
        }

        if (timetableRes.status === 'fulfilled' && Array.isArray(timetableRes.value)) {
          setTimetablePeriods(timetableRes.value);
        } else {
          setTimetablePeriods([]);
        }
      } else if (detectedRole === 'REGISTRAR') {
        const [studentsRes, admissionsRes] = await Promise.allSettled([
          api.get<any[]>('/api/v1/students'),
          api.get<any[]>('/api/v1/admissions'),
        ]);

        if (studentsRes.status === 'fulfilled' && Array.isArray(studentsRes.value)) {
          setRegisteredStudents(studentsRes.value);
        } else {
          setRegisteredStudents([]);
        }

        if (admissionsRes.status === 'fulfilled' && Array.isArray(admissionsRes.value)) {
          setAdmissionApplications(admissionsRes.value);
        } else {
          setAdmissionApplications([]);
        }
      }
    } catch (err: any) {
      setFetchError(err instanceof ApiError ? err.message : 'Unable to synchronize dashboard records from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Loading Skeleton State
  if (loading) {
    return (
      <section className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading workspace dashboard">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white dark:bg-neutral-800/60 border border-slate-200 dark:border-slate-800 p-4" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-white dark:bg-neutral-800/60 border border-slate-200 dark:border-slate-800 p-6" />
        <div className="h-64 rounded-2xl bg-white dark:bg-neutral-800/60 border border-slate-200 dark:border-slate-800 p-6" />
      </section>
    );
  }

  // Error Recovery State
  if (fetchError) {
    return (
      <section className="p-6">
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 max-w-xl mx-auto space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">Dashboard Synchronisation Notice</h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">{fetchError}</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1B4F8C] text-white text-xs font-semibold hover:bg-[#143E6E] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Synchronisation</span>
          </button>
        </div>
      </section>
    );
  }

  // =========================================================================
  // ADMIN & ACCOUNTANT DASHBOARD
  // =========================================================================
  if (role === 'ADMIN' || role === 'ACCOUNTANT') {
    const totalRev = Number(adminData?.totalRevenue ?? 0);
    const pendingAmt = Number(adminData?.pendingAmount ?? 0);
    const invCount = Number(adminData?.invoiceCount ?? invoices.length);
    const studentCount = Number(adminData?.totalStudents ?? 0);
    const teacherCount = Number(adminData?.totalTeachers ?? 0);
    const revenueData: Array<{ name: string; total: number }> = adminData?.revenueData || [];
    const genderData: Array<{ name: string; value: number }> = adminData?.genderData || [];

    const hasRevenueRecords = revenueData.some((r) => r.total > 0);
    const hasDemographicRecords = genderData.some((g) => g.value > 0);

    const setupMilestones = [
      {
        id: 'classes',
        name: 'Classes & Sections',
        desc: 'Classrooms and grade streams for student placement.',
        completed: true,
        metric: 'Grade streams active',
        action: 'Configure Classes',
        href: '/classes',
      },
      {
        id: 'faculty',
        name: 'Faculty Registry',
        desc: 'Active teaching roster assigned to subject curriculums.',
        completed: teacherCount > 0,
        metric: `${teacherCount} faculty assigned`,
        action: 'Add Teachers',
        href: '/teachers',
      },
      {
        id: 'students',
        name: 'Student Enrollment',
        desc: 'Enrolled learner body in classes and sections.',
        completed: studentCount > 0,
        metric: `${studentCount} learners enrolled`,
        action: 'Enroll Students',
        href: '/students',
      },
      {
        id: 'billing',
        name: 'Tuition & Invoicing',
        desc: 'Term fee structures and student balance ledger.',
        completed: invCount > 0 || totalRev > 0,
        metric: `${invCount} invoices issued`,
        action: 'Set Up Fees',
        href: '/finance',
      },
    ];

    return (
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Daily School Operations Pulse Briefing */}
        <motion.div variants={itemVariants}>
          <SchoolPulseCard
            pulse={pulseData}
            loading={pulseLoading}
            onRefresh={fetchPulse}
          />
        </motion.div>

        {/* KPI Cards Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            value={`$${totalRev.toLocaleString()}`}
            label="Total Revenue"
            subtitle="Actual collected payments"
            variant="primary"
          />
          <KpiCard
            value={`$${pendingAmt.toLocaleString()}`}
            label="Outstanding Invoices"
            subtitle="Unpaid student balances"
            variant={pendingAmt > 0 ? "warning" : "default"}
          />
          <KpiCard
            value={invCount}
            label="Invoices Generated"
            subtitle="Total student billing ledger"
            variant="default"
          />
          <KpiCard
            value={studentCount}
            label="Enrolled Students"
            subtitle={`${teacherCount} registered faculty staff`}
            variant="default"
          />
        </motion.div>

        {/* Institutional Operational Readiness Checklist (Admin-only) */}
        {role === 'ADMIN' && (
          <motion.div variants={itemVariants}>
            <Card className="border-l-4 border-l-[#1B4F8C]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100 dark:border-neutral-800">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#1B4F8C]" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Institutional Operational Readiness
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Persisted configuration status for core academic operations
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1B4F8C] bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
                    {Math.round((setupMilestones.filter((m) => m.completed).length / setupMilestones.length) * 100)}% Configured
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {setupMilestones.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border text-xs transition-colors flex flex-col justify-between ${
                      m.completed
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/30'
                        : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-neutral-900 dark:text-white">{m.name}</span>
                        {m.completed ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Action Needed
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed mb-2.5">
                        {m.desc}
                      </p>
                    </div>
                    {!m.completed ? (
                      <Link
                        href={m.href}
                        className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#1B4F8C] hover:bg-[#153f70] text-white text-[11px] font-semibold transition-colors mt-auto shadow-xs"
                      >
                        <span>{m.action}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400/80 mt-auto">
                        ✓ {m.metric}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Charts & Analytical Summaries */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trajectory Chart */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#E86524]" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Fee Collection History (Last 6 Months)
                </h3>
              </div>
              <Link href="/finance" className="text-xs font-semibold text-[#1B4F8C] hover:underline">
                View Ledger &rarr;
              </Link>
            </div>

            {hasRevenueRecords && mounted ? (
              <div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `$${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                    />
                    <Tooltip
                      formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Total Collected']}
                      contentStyle={{
                        backgroundColor: '#071324',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="total" name="Tuition Collected" fill="#1B4F8C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {/* Tabular summary for accessibility & low-bandwidth */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                  {revenueData.map((d) => (
                    <span key={d.name}>
                      <strong className="text-neutral-700 dark:text-neutral-300">{d.name}:</strong> ${d.total.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No Fee Collection Records"
                description="When student tuition or invoices are recorded, collection trends will appear here."
                actionLabel="Create Invoice"
                actionHref="/finance"
              />
            )}
          </Card>

          {/* Student Demographics Chart */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1B4F8C]" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Student Demographics
                </h3>
              </div>
              <Link href="/students" className="text-xs font-semibold text-[#1B4F8C] hover:underline">
                Student Directory &rarr;
              </Link>
            </div>

            {hasDemographicRecords && mounted ? (
              <div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#1B4F8C' : '#E86524'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="No Demographics Data"
                description="Student gender and demographic distribution will appear as students are enrolled."
                actionLabel="Enroll Student"
                actionHref="/students"
              />
            )}
          </Card>
        </motion.div>

        {/* Real Invoices Table */}
        <motion.div variants={itemVariants}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Recent Invoices Ledger
                </h3>
                <p className="text-xs text-slate-500">Live records from student billing accounts</p>
              </div>
              <Link href="/finance" className="text-xs font-semibold text-[#1B4F8C] hover:underline">
                View All Invoices &rarr;
              </Link>
            </div>

            {invoices.length === 0 ? (
              <EmptyState
                title="No Invoices Recorded"
                description="Generate class-wide or individual student invoices to begin billing."
                actionLabel="Create First Invoice"
                actionHref="/finance"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell>Invoice ID</TableHeadCell>
                  <TableHeadCell>Student</TableHeadCell>
                  <TableHeadCell>Amount</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Due Date</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {invoices.slice(0, 8).map((inv: any, idx: number) => {
                    const studentLabel = inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : (inv.studentName || 'Student');
                    const isPaid = String(inv.status).toUpperCase() === 'PAID';
                    const amountFormatted = Number(inv.amount || 0).toLocaleString();
                    const dueDate = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—';

                    return (
                      <TableRowCell key={inv.id || idx}>
                        <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                          INV-{inv.id ? inv.id.slice(-6).toUpperCase() : idx + 1}
                        </span>
                        <span className="font-medium text-neutral-900 dark:text-white">{studentLabel}</span>
                        <span className="font-semibold text-neutral-900 dark:text-white">${amountFormatted}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isPaid
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {inv.status || 'PENDING'}
                        </span>
                        <span className="text-xs text-slate-500">{dueDate}</span>
                      </TableRowCell>
                    );
                  })}
                </TableSection.body>
              </Table>
            )}
          </Card>
        </motion.div>
      </motion.section>
    );
  }

  // =========================================================================
  // TEACHER DASHBOARD
  // =========================================================================
  if (role === 'TEACHER') {
    return (
      <motion.section variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Daily Operations Briefing */}
        <motion.div variants={itemVariants}>
          <SchoolPulseCard
            pulse={pulseData}
            loading={pulseLoading}
            onRefresh={fetchPulse}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            value={assignments.length}
            label="Active Assignments"
            subtitle="Class coursework posted"
            variant="primary"
          />
          <KpiCard
            value={attendanceRecords.length}
            label="Attendance Logs"
            subtitle="Recent session records"
            variant="default"
          />
          <KpiCard
            value="Class Portal"
            label="Gradebook & Daily Logs"
            subtitle="Direct teacher workflows"
            variant="default"
          />
        </motion.div>

        {/* Real Teacher Assignments */}
        <motion.div variants={itemVariants}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Assignments & Coursework
                </h3>
                <p className="text-xs text-slate-500">Live submissions and homework tracking</p>
              </div>
              <Link href="/assignments" className="text-xs font-semibold text-[#1B4F8C] hover:underline">
                Create Assignment &rarr;
              </Link>
            </div>

            {assignments.length === 0 ? (
              <EmptyState
                title="No Assignments Posted Yet"
                description="Publish homework, projects, or reading assignments for your classes."
                actionLabel="Create Assignment"
                actionHref="/assignments"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell>Title</TableHeadCell>
                  <TableHeadCell>Subject / Class</TableHeadCell>
                  <TableHeadCell>Due Date</TableHeadCell>
                  <TableHeadCell>Submissions</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {assignments.slice(0, 8).map((a: any, idx: number) => (
                    <TableRowCell key={a.id || idx}>
                      <span className="font-semibold text-neutral-900 dark:text-white">{a.title}</span>
                      <span className="text-xs text-slate-500">{a.subject?.name || a.class?.name || 'Classwork'}</span>
                      <span className="text-xs text-slate-500">
                        {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}
                      </span>
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                        {a._count?.submissions ?? a.submissions?.length ?? 0} submitted
                      </span>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}
          </Card>
        </motion.div>
      </motion.section>
    );
  }

  // =========================================================================
  // PARENT DASHBOARD
  // =========================================================================
  if (role === 'PARENT') {
    return (
      <motion.section variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            value={parentChildren.length}
            label="Enrolled Children"
            subtitle="Linked student accounts"
            variant="primary"
          />
          <KpiCard
            value={parentInvoices.length}
            label="Fee Invoices"
            subtitle="Tuition & operational dues"
            variant="default"
          />
        </motion.div>

        {/* Children List */}
        <motion.div variants={itemVariants}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                My Enrolled Children
              </h3>
              <Link href="/children" className="text-xs font-semibold text-[#1B4F8C] hover:underline">
                Detailed Profile &rarr;
              </Link>
            </div>

            {parentChildren.length === 0 ? (
              <EmptyState
                title="No Children Linked to Account"
                description="Contact the school registrar to associate your student's admission record."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {parentChildren.map((c: any, idx: number) => (
                  <div key={c.id || idx} className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-neutral-900 dark:text-white">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-slate-500">Grade: {c.class?.name || 'Assigned'} &bull; Adm #{c.admissionNumber || '—'}</p>
                    </div>
                    <Link
                      href={`/students/${c.id}`}
                      className="px-3 py-1.5 rounded-lg bg-[#1B4F8C] text-white text-xs font-semibold hover:bg-[#143E6E] transition-colors"
                    >
                      View Report
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </motion.section>
    );
  }

  // =========================================================================
  // STUDENT DASHBOARD
  // =========================================================================
  if (role === 'STUDENT') {
    return (
      <motion.section variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            value={assignments.length}
            label="Assigned Homework"
            subtitle="Due coursework"
            variant="primary"
          />
          <KpiCard
            value={timetablePeriods.length}
            label="Timetable Periods"
            subtitle="Active daily schedule"
            variant="default"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
              My Current Assignments
            </h3>
            {assignments.length === 0 ? (
              <EmptyState
                title="No Pending Assignments"
                description="All your coursework is up to date."
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell>Assignment</TableHeadCell>
                  <TableHeadCell>Due Date</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {assignments.slice(0, 8).map((a: any, idx: number) => (
                    <TableRowCell key={a.id || idx}>
                      <span className="font-semibold text-neutral-900 dark:text-white">{a.title}</span>
                      <span className="text-xs text-slate-500">
                        {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300">
                        Active
                      </span>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}
          </Card>
        </motion.div>
      </motion.section>
    );
  }

  // =========================================================================
  // REGISTRAR DASHBOARD
  // =========================================================================
  if (role === 'REGISTRAR') {
    return (
      <motion.section variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Registrar Operations Briefing */}
        <motion.div variants={itemVariants}>
          <SchoolPulseCard
            pulse={pulseData}
            loading={pulseLoading}
            onRefresh={fetchPulse}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            value={registeredStudents.length}
            label="Registered Students"
            subtitle="Current active directory"
            variant="primary"
          />
          <KpiCard
            value={admissionApplications.length}
            label="Pending Admissions"
            subtitle="Applications under review"
            variant="default"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Incoming Admission Applications
              </h3>
              <Link href="/admissions" className="text-xs font-semibold text-[#1B4F8C] hover:underline">
                Review Applications &rarr;
              </Link>
            </div>

            {admissionApplications.length === 0 ? (
              <EmptyState
                title="No Pending Admissions"
                description="New online student admissions will appear here for review and enrollment."
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell>Applicant Name</TableHeadCell>
                  <TableHeadCell>Applying Grade</TableHeadCell>
                  <TableHeadCell>Submission Date</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {admissionApplications.slice(0, 8).map((app: any, idx: number) => (
                    <TableRowCell key={app.id || idx}>
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {app.firstName} {app.lastName}
                      </span>
                      <span className="text-xs text-slate-500">{app.gradeApplying || app.grade || '—'}</span>
                      <span className="text-xs text-slate-500">
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                        {app.status || 'PENDING'}
                      </span>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}
          </Card>
        </motion.div>
      </motion.section>
    );
  }

  return null;
}
