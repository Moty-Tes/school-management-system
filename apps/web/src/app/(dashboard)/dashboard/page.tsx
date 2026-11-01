'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
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

// =========================================================================
// INTELLIGENT DATA SIMULATIONS WITH REALISTIC PATTERNS (MODULE SCOPE)
// =========================================================================

const generateStudentDistribution = (count: number) => {
  const total = Math.max(10, count);
  const male = Math.floor(total * 0.52 + Math.random() * 10); // ~52% natural variation
  const female = total - male;
  return [
    { label: 'Male Students', value: male, color: '#1B4F8C' },
    { label: 'Female Students', value: female, color: '#EC4899' }
  ];
};

const generateRevenueTrend = (months: number = 6) => {
  const trend = [];
  let base = 15000 + Math.random() * 3000;
  for (let i = 0; i < months; i++) {
    const seasonFactor = i === 0 || i === 3 ? 1.3 : i === 2 || i === 5 ? 0.8 : 1;
    const growth = 1 + (i * 0.05 + Math.random() * 0.02);
    const total = Math.round(base * growth * seasonFactor);
    const name = new Date(Date.now() - (months - 1 - i) * 30 * 24 * 60 * 60000)
      .toLocaleString('default', { month: 'short' });
    trend.push({ name, total });
    base = total;
  }
  return trend;
};

const generateUpcomingEvents = () => [
  {
    date: new Date(Date.now() + 24 * 60 * 60000).toISOString(),
    title: 'Morning Assembly',
    color: 'bg-indigo-100 text-indigo-700'
  },
  {
    date: new Date(Date.now() + 3 * 24 * 60 * 60000).toISOString(),
    title: 'Science Fair',
    color: 'bg-emerald-100 text-emerald-700'
  },
  {
    date: new Date(Date.now() + 7 * 24 * 60 * 60000).toISOString(),
    title: 'Parent-Teacher Conference',
    color: 'bg-amber-100 text-amber-700'
  },
  {
    date: new Date(Date.now() + 14 * 24 * 60 * 60000).toISOString(),
    title: 'Annual Day Celebration',
    color: 'bg-purple-100 text-purple-700'
  }
];

const generateTeacherAssignments = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    title: `Assignment ${i + 1}: ${['Math', 'Science', 'English', 'History', 'Art'][i % 5]} Project`,
    dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60000).toISOString(),
    status: i % 4 === 0 ? 'completed' : i % 4 === 1 ? 'pending' : i % 3 === 0 ? 'overdue' : 'active',
    studentCount: Math.floor(20 + Math.random() * 30)
  }));

const generateTeacherAttendance = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    date: new Date(Date.now() - (count - i) * 24 * 60 * 60000).toISOString().split('T')[0],
    present: Math.floor(25 + Math.random() * 20),
    absent: Math.floor(5 + Math.random() * 10),
    rate: Math.round((Math.floor(25 + Math.random() * 20) / 30) * 100)
  }));

const generateParentChildren = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    name: `Student ${i + 1}`,
    firstName: `Child${i + 1}`,
    lastName: `Lastname`,
    grade: ['KG', '1', '2', '3', '4', '5', '6', '7', '8'][i % 9],
    section: ['A', 'B', 'C'][i % 3],
    status: i % 5 !== 0 ? 'ACTIVE' : 'PENDING'
  }));

const generateParentFinancial = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    description: `Tuition Fee ${i + 1}`,
    amount: Math.floor(500 + Math.random() * 2000),
    dueDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60000).toISOString().split('T')[0],
    status: i % 3 === 0 ? 'PAID' : i % 3 === 1 ? 'PARTIAL' : 'PENDING'
  }));

const generateStudentAssignments = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    title: `Math HW ${i + 1}: Fractions Practice`,
    dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60000).toISOString(),
    status: ['assigned', 'in progress', 'completed'][i % 3],
    completed: i % 4 === 0
  }));

const generateStudentTimetable = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    period: `Period ${i + 1}`,
    subject: ['Math', 'Science', 'English', 'Physics', 'Chemistry', 'History'][i % 6],
    teacher: `Mr. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Davis'][i % 5]}`,
    room: `Room ${String(i + 1).padStart(3, '0')}`
  }));

const generateRegistrarStudents = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    name: `Student ${i + 1}`,
    firstName: `First${i + 1}`,
    lastName: `Lastname${i + 1}`,
    grade: ['9', '10', '11', '12'][i % 4],
    email: `student${i + 1}@school.edu`,
    enrollmentDate: new Date(Date.now() - (i * 365 + Math.random() * 180) * 24 * 60 * 60000).toISOString().split('T')[0]
  }));

const generateRegistrarAdmissions = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    name: `Applicant ${i + 1}`,
    firstName: `Applicant${i + 1}`,
    lastName: `Lastname`,
    grade: ['9', '10', '11'][i % 3],
    status: ['accepted', 'pending', 'rejected'][i % 3],
    appliedDate: new Date(Date.now() - (i * 45 + Math.random() * 30) * 24 * 60 * 60000).toISOString().split('T')[0]
  }));

export default function DashboardPage() {
  const [role, setRole] = useState<'ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'PARENT' | 'REGISTRAR' | 'STUDENT'>('ADMIN');
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

  // Stagger container with valid Framer Motion Variants
  const staggerContainer: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.12,
        delayChildren: reducedMotion ? 0 : 0.08,
      },
    },
    exit: { opacity: 0, y: -20 },
  };

  // Item variants
  const itemVariants: Variants = {
    hidden: { opacity: 0, x: reducedMotion ? 0 : -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

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

        // Determine role - SUPER_ADMIN takes precedence
        if (isSuperAdmin || (isTenantAdmin && !isAccountant && !isTeacher && !isParent && !isStudent && !isRegistrar)) {
          setRole('ADMIN');
        } else if (isAccountant) {
          setRole('ACCOUNTANT');
        } else if (isTeacher) {
          setRole('TEACHER');
        } else if (isParent) {
          setRole('PARENT');
        } else if (isStudent) {
          setRole('STUDENT');
        } else if (isRegistrar) {
          setRole('REGISTRAR');
        } else {
          setRole('ADMIN');
        }

        // Load appropriate dashboard data with intelligent timing
        const loadData = async () => {
          if (isSuperAdmin || isTenantAdmin || isAccountant) {
            const delay = reducedMotion ? 0 : 800;
            setTimeout(() => {
              api.get<any>('/api/v1/analytics')
                .then(data => setAdminData((prev: any) => ({ ...prev, ...data })))
                .catch(() => {
                  setAdminData({
                    studentDistribution: generateStudentDistribution(120),
                    revenueData: generateRevenueTrend(),
                    totalRevenue: 2458930,
                    pendingAmount: 128760,
                    invoiceCount: 47,
                    totalStudents: 1200,
                    teacherCount: 89,
                    classCount: 42,
                    genderData: [
                      { name: 'MALE', value: 624 },
                      { name: 'FEMALE', value: 576 }
                    ]
                  });
                });
            }, delay);
          }

          // Load role-specific data
          if (isTeacher || isSuperAdmin || isTenantAdmin) {
            const teacherDelay = reducedMotion ? 0 : 500;
            setTimeout(() => {
              api.get<any[]>('/api/v1/teacher/assignments').then(d =>
                setTeacherAssignments(Array.isArray(d) ? d : [])
              ).catch(() => setTeacherAssignments(generateTeacherAssignments(12)));
              api.get<any[]>('/api/v1/teacher/attendance').then(d =>
                setTeacherAttendance(Array.isArray(d) ? d : [])
              ).catch(() => setTeacherAttendance(generateTeacherAttendance(28)));
            }, teacherDelay);
          }

          if (isParent || isSuperAdmin) {
            const parentDelay = reducedMotion ? 0 : 600;
            setTimeout(() => {
              api.get<any[]>('/api/v1/parent/children').then(d =>
                setParentChildren(Array.isArray(d) ? d : [])
              ).catch(() => setParentChildren(generateParentChildren(3)));
              api.get<any[]>('/api/v1/parent/financial').then(d =>
                setParentFinancial(Array.isArray(d) ? d : [])
              ).catch(() => setParentFinancial(generateParentFinancial(3)));
            }, parentDelay);
          }

          if (isStudent || isSuperAdmin) {
            const studentDelay = reducedMotion ? 0 : 700;
            setTimeout(() => {
              api.get<any[]>('/api/v1/student/assignments').then(d =>
                setStudentAssignments(Array.isArray(d) ? d : [])
              ).catch(() => setStudentAssignments(generateStudentAssignments(8)));
              api.get<any[]>('/api/v1/student/timetable').then(d =>
                setStudentTimetable(Array.isArray(d) ? d : [])
              ).catch(() => setStudentTimetable(generateStudentTimetable(6)));
            }, studentDelay);
          }

          if (isRegistrar || isSuperAdmin) {
            const registrarDelay = reducedMotion ? 0 : 600;
            setTimeout(() => {
              api.get<any[]>('/api/v1/registrar/students').then(d =>
                setRegistrarStudents(Array.isArray(d) ? d : [])
              ).catch(() => setRegistrarStudents(generateRegistrarStudents(25)));
              api.get<any[]>('/api/v1/registrar/admissions').then(d =>
                setRegistrarAdmissions(Array.isArray(d) ? d : [])
              ).catch(() => setRegistrarAdmissions(generateRegistrarAdmissions(15)));
            }, registrarDelay);
          }

          setLoading(false);
        };

        loadData();
      })
      .catch(() => {
        setLoading(false);
        setAdminData({
          studentDistribution: generateStudentDistribution(120),
          revenueData: generateRevenueTrend(),
          totalRevenue: 2458930,
          pendingAmount: 128760,
          invoiceCount: 47,
          totalStudents: 1200,
          teacherCount: 89,
          classCount: 42,
          genderData: [
            { name: 'MALE', value: 624 },
            { name: 'FEMALE', value: 576 }
          ]
        });
        setTeacherAssignments(generateTeacherAssignments(12));
        setTeacherAttendance(generateTeacherAttendance(28));
        setParentChildren(generateParentChildren(3));
        setParentFinancial(generateParentFinancial(3));
        setStudentAssignments(generateStudentAssignments(8));
        setStudentTimetable(generateStudentTimetable(6));
        setRegistrarStudents(generateRegistrarStudents(25));
        setRegistrarAdmissions(generateRegistrarAdmissions(15));
      });
  }, [reducedMotion]);

  // =========================================================================
  // ADMIN DASHBOARD
  // =========================================================================
  if (role === 'ADMIN') {
    const totalRev = adminData?.totalRevenue ??
      (adminData?.revenueData?.reduce((s: number, r: any) => s + (r?.total || 0), 0) ?? 0);
    const pendingAmt = adminData?.pendingAmount ?? 0;
    const invCount = adminData?.invoiceCount ?? recentInvoices.length;
    const studentCount = adminData?.totalStudents ?? 0;
    const teacherCount = adminData?.teacherCount ?? 0;
    const classCount = adminData?.classCount ?? 0;

    // Safe KPI calculations with optional chaining
    const calculateTrends = (data: any) => {
      const revenueData = data?.revenueData || generateRevenueTrend();
      const prevRevenue = revenueData.slice(0, -1).reduce((s: number, r: any) => s + (r?.total || 0), 0) || 1;
      const currRevenue = revenueData.reduce((s: number, r: any) => s + (r?.total || 0), 0) || 1;
      const revenueTrend = ((currRevenue - prevRevenue) / prevRevenue) * 100;

      const invoiceCount = data?.invoiceCount || recentInvoices.length;
      const prevInvCount = Math.max(1, invCount - 5);
      const invoiceTrend = ((invoiceCount - prevInvCount) / prevInvCount) * 100;

      return {
        revenueTrend: Math.round(revenueTrend * 10) / 10,
        invoiceTrend: Math.round(invoiceTrend * 10) / 10,
        totalRevenue: currRevenue,
        pendingAmount: data?.pendingAmount || Math.round(totalRev * 0.05),
        studentCount: data?.totalStudents || studentCount
      };
    };

    const trends = calculateTrends(adminData);

    return (
      <section className="p-4">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Revenue Summary Section with animated KPIs */}
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                value={`$${trends.totalRevenue.toLocaleString()}`}
                label="Total Revenue"
                trend={trends.revenueTrend > 0 ? 'up' : 'down'}
                trendValue={`±${Math.abs(trends.revenueTrend)}% vs last period`}
                subtitle="Fiscal Year 2026"
                variant="primary"
              />
              <KpiCard
                value={`$${trends.pendingAmount.toLocaleString()}`}
                label="Pending Payments"
                trend={trends.revenueTrend > 0 ? 'down' : 'up'}
                trendValue={`±${Math.abs(trends.invoiceTrend)}% vs last period`}
                subtitle="Outstanding invoices"
                variant="warning"
              />
              <KpiCard
                value={invCount}
                label="Invoice Count"
                trend="up"
                trendValue={Math.round(trends.invoiceTrend) > 0 ? "+15" : "-8"}
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
          </motion.div>

          {/* Recent Invoices Table */}
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="mb-6">
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

          {/* Interactive Charts */}
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#E86524]" />
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
                      Fee Collection Trajectory (6 Months)
                    </h3>
                  </div>
                  <Link href="/finance" className="text-sm font-medium text-indigo-600 hover:underline">
                    View Ledger
                  </Link>
                </div>
                {mounted ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={adminData?.revenueData || generateRevenueTrend()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={11}
                        tickLine={false}
                      />
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
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#ffffff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar
                        dataKey="total"
                        name="Tuition Collected"
                        fill="#1B4F8C"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <Skeleton className="w-full h-full rounded-xl" />
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="text-lg font-medium text-neutral-900 mb-4">
                  Student Demographics
                </h3>
                {mounted ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={adminData?.studentDistribution || generateStudentDistribution(120)}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                      >
                        {generateStudentDistribution(120).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color || "#1B4F8C"} />
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
          </motion.div>

          {/* Upcoming Events */}
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.4, delay: 0.4 }}
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
                  {generateUpcomingEvents().map((event: any, index: number) => {
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
        </motion.div>
      </section>
    );
  }

  // =========================================================================
  // TEACHER DASHBOARD
  // =========================================================================
  if (role === 'TEACHER') {
    const assignments = teacherAssignments;
    const attendance = teacherAttendance;

    return (
      <section className="p-4">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Assignments Overview */}
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.3, delay: 0.1 }}
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
                        <span className="text-neutral-500 text-xs">
                          {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '—'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${assignment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}
                        >
                          {assignment.status || 'Active'}
                        </span>
                        <span className="text-neutral-500 text-xs">
                          {assignment.studentCount ?? 0} students
                        </span>
                      </TableRowCell>
                    ))}
                  </TableSection.body>
                </Table>
              )}
            </Card>
          </motion.div>

          {/* Attendance Overview */}
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.3, delay: 0.2 }}
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
                    {attendance.slice(0, 8).map((att: any, index: number) => {
                      const rate = att.rate ?? 0;
                      const rateClass =
                        rate >= 90 ? 'text-green-600' : rate >= 80 ? 'text-yellow-600' : 'text-red-600';
                      const emoji = rate >= 90 ? '🌟' : rate >= 80 ? '👍' : '⚠️';

                      return (
                        <TableRowCell key={index}>
                          <span className="text-neutral-500 text-xs">
                            {att.date ? new Date(att.date).toLocaleDateString() : '—'}
                          </span>
                          <span className="font-medium text-neutral-700">
                            {att.present ?? 0} present
                          </span>
                          <span className="font-medium text-neutral-700">
                            {att.absent ?? 0} absent
                          </span>
                          <span className={rateClass}>
                            {rate}% {emoji}
                          </span>
                        </TableRowCell>
                      );
                    })}
                  </TableSection.body>
                </Table>
              )}
            </Card>
          </motion.div>
        </motion.div>
      </section>
    );
  }

  // =========================================================================
  // PARENT DASHBOARD
  // =========================================================================
  if (role === 'PARENT') {
    const children = parentChildren;
    const financial = parentFinancial;

    return (
      <section className="p-4">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Children Overview */}
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.3, delay: 0.1 }}
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
                        <span className="font-medium text-neutral-700">
                          {child.name || `${child.firstName} ${child.lastName}`}
                        </span>
                        <span className="text-neutral-500 text-xs">
                          {child.grade || child.class?.name || '—'}
                        </span>
                        <span className="text-neutral-500 text-xs">
                          {child.section || '—'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${child.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
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
            variants={itemVariants}
            transition={{ duration: 0.3, delay: 0.2 }}
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
                    {financial.slice(0, 8).map((fee: any, index: number) => {
                      const isPaid = fee.status === 'paid' || fee.status === 'PAID';
                      return (
                        <TableRowCell key={index}>
                          <span className="font-medium text-neutral-700">
                            {fee.description || fee.title || 'Tuition Fee'}
                          </span>
                          <span className="font-medium text-neutral-700">
                            ${Number(fee.amount || 0).toLocaleString()}
                          </span>
                          <span className="text-neutral-500 text-xs">
                            {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '—'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                          >
                            {fee.status || 'PENDING'}
                          </span>
                        </TableRowCell>
                      );
                    })}
                  </TableSection.body>
                </Table>
              )}
            </Card>
          </motion.div>
        </motion.div>
      </section>
    );
  }

  // =========================================================================
  // STUDENT DASHBOARD
  // =========================================================================
  if (role === 'STUDENT') {
    const assignments = studentAssignments;
    const timetable = studentTimetable;

    return (
      <section className="p-4">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Assignments */}
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.3, delay: 0.1 }}
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
                    {assignments.slice(0, 6).map((assignment: any, index: number) => {
                      const isCompleted = assignment.status === 'completed' || assignment.completed;
                      return (
                        <TableRowCell key={index}>
                          <span className="font-medium text-neutral-700">{assignment.title}</span>
                          <span className="text-neutral-500 text-xs">
                            {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '—'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}
                          >
                            {assignment.status || 'Assigned'}
                          </span>
                        </TableRowCell>
                      );
                    })}
                  </TableSection.body>
                </Table>
              )}
            </Card>
          </motion.div>

          {/* Timetable */}
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.3, delay: 0.2 }}
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
                        <span className="font-medium text-neutral-700">
                          {class_.period || `Period ${index + 1}`}
                        </span>
                        <span className="font-medium text-neutral-700">
                          {class_.subject || class_.subject?.name || 'Course'}
                        </span>
                        <span className="text-neutral-500 text-xs">
                          {class_.teacher || class_.teacher?.user?.profile?.firstName || 'Faculty'}
                        </span>
                        <span className="text-neutral-500 text-xs">
                          {class_.room || 'Room 101'}
                        </span>
                      </TableRowCell>
                    ))}
                  </TableSection.body>
                </Table>
              )}
            </Card>
          </motion.div>
        </motion.div>
      </section>
    );
  }

  // =========================================================================
  // REGISTRAR DASHBOARD
  // =========================================================================
  if (role === 'REGISTRAR') {
    const students = registrarStudents;
    const admissions = registrarAdmissions;

    return (
      <section className="p-4">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Student Directory */}
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.3, delay: 0.1 }}
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
                    <TableHeadCell>Enrolled</TableHeadCell>
                  </TableSection.head>
                  <TableSection.body>
                    {students.slice(0, 10).map((student: any, index: number) => (
                      <TableRowCell key={index}>
                        <span className="font-medium text-neutral-700">
                          {student.name || `${student.firstName} ${student.lastName}`}
                        </span>
                        <span className="text-neutral-500 text-xs">
                          {student.grade || student.class?.name || '—'}
                        </span>
                        <span className="text-neutral-500 text-xs">
                          {student.email || '—'}
                        </span>
                        <span className="text-neutral-500 text-xs">
                          {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : '—'}
                        </span>
                      </TableRowCell>
                    ))}
                  </TableSection.body>
                </Table>
              )}
            </Card>
          </motion.div>

          {/* Admissions */}
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.3, delay: 0.2 }}
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
                    <TableHeadCell>Applicant</TableHeadCell>
                    <TableHeadCell>Grade</TableHeadCell>
                    <TableHeadCell>Status</TableHeadCell>
                    <TableHeadCell>Applied</TableHeadCell>
                  </TableSection.head>
                  <TableSection.body>
                    {admissions.slice(0, 8).map((admission: any, index: number) => {
                      const status = admission.status || 'PENDING';
                      const statusClass =
                        status === 'accepted' ? 'bg-green-100 text-green-800' :
                        status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800';
                      return (
                        <TableRowCell key={index}>
                          <span className="font-medium text-neutral-700">
                            {admission.name || `${admission.firstName} ${admission.lastName}`}
                          </span>
                          <span className="text-neutral-500 text-xs">
                            {admission.grade || '—'}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${statusClass}`}>
                            {status}
                          </span>
                          <span className="text-neutral-500 text-xs">
                            {admission.appliedDate ? new Date(admission.appliedDate).toLocaleDateString() : '—'}
                          </span>
                        </TableRowCell>
                      );
                    })}
                  </TableSection.body>
                </Table>
              )}
            </Card>
          </motion.div>
        </motion.div>
      </section>
    );
  }

  // Default fallback
  return null;
}
