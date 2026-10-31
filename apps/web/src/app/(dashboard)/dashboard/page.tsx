'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Users, CreditCard, BookOpen, Clock, Settings, 
  BarChart3, DollarSign, Receipt, ArrowUpRight, CheckCircle2,
  AlertCircle, FileText, Calendar, PlusCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, CartesianGrid, 
  XAxis, YAxis, Tooltip, Cell, Legend, PieChart, Pie 
} from 'recharts';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const [role, setRole] = useState<'ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'REGISTRAR'>('ADMIN');
  const [adminData, setAdminData] = useState<any>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          .catch(console.error);

        // If accountant or admin, also load recent invoices
        api.get<any[]>('/api/v1/finance/invoices')
          .then(invoices => setRecentInvoices(invoices || []))
          .catch(() => setRecentInvoices([]));
      } else if (isStudent || isParent) {
        api.get('/api/v1/analytics/me')
          .then(data => setStudentData(data))
          .catch(console.error);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/30 text-indigo-200 rounded-full text-xs font-semibold mb-3">
                <Receipt className="w-3.5 h-3.5" />
                <span>Finance & Accounting Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Financial Overview</h1>
              <p className="text-indigo-200 text-sm mt-1">Manage school revenues, invoices, expenses, and staff payroll.</p>
            </div>

            <div className="flex items-center gap-2">
              <Link 
                href="/finance" 
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Invoice</span>
              </Link>
              <Link 
                href="/exports" 
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Export Report</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected</span>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-4">
              {Number(totalRev).toLocaleString()} <span className="text-sm font-semibold text-slate-500">ETB</span>
            </p>
            <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Payments successfully recorded
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Balance</span>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-4">
              {Number(pendingAmt).toLocaleString()} <span className="text-sm font-semibold text-slate-500">ETB</span>
            </p>
            <p className="text-xs text-amber-600 font-semibold mt-2 flex items-center gap-1">
              Unpaid and partially paid fees
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Invoices</span>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-4">{invCount}</p>
            <p className="text-xs text-slate-500 font-medium mt-2">Active fee items issued</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Students Enrolled</span>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-4">{studentCount}</p>
            <p className="text-xs text-slate-500 font-medium mt-2">Potential fee-paying students</p>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Quick Financial Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link 
              href="/finance" 
              className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">Student Invoices</p>
              <p className="text-xs text-slate-500 mt-0.5">Issue & record fees</p>
            </Link>

            <Link 
              href="/expenses" 
              className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">School Expenses</p>
              <p className="text-xs text-slate-500 mt-0.5">Track expenditures</p>
            </Link>

            <Link 
              href="/payroll" 
              className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">Staff Payroll</p>
              <p className="text-xs text-slate-500 mt-0.5">Wages & payslips</p>
            </Link>

            <Link 
              href="/exports" 
              className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors group text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">Financial Reports</p>
              <p className="text-xs text-slate-500 mt-0.5">Audit-ready export</p>
            </Link>
          </div>
        </div>

        {/* Charts & Recent Invoices Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Revenue Collection Trend</h3>
                <p className="text-xs text-slate-500">Monthly fees collected over past 6 months</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">ETB</span>
            </div>

            <div className="h-64 w-full">
              {adminData?.revenueData && adminData.revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip 
                      formatter={(val: any) => [`${Number(val).toLocaleString()} ETB`, 'Collected']} 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  No revenue records to display yet.
                </div>
              )}
            </div>
          </div>

          {/* Recent Invoices List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Recent Invoices</h3>
              <Link href="/finance" className="text-xs font-semibold text-indigo-600 hover:underline">
                View All →
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto max-h-64 space-y-3">
              {recentInvoices.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No invoices created yet.</p>
              ) : (
                recentInvoices.slice(0, 5).map((inv: any) => (
                  <div key={inv.id} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{inv.student?.firstName} {inv.student?.lastName}</p>
                      <p className="text-[11px] text-slate-500">{inv.title || 'Tuition Fee'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">{Number(inv.amount).toLocaleString()} ETB</p>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ADMIN DASHBOARD
  // =========================================================================
  if (role === 'ADMIN' && adminData) {
    const totalRev = adminData?.totalRevenue ?? adminData?.revenueData?.reduce((s: number, r: any) => s + (r.total || 0), 0) ?? 0;
    const studentCount = adminData?.totalStudents ?? 0;
    const attendanceRate = adminData?.attendance?.rate ?? 0;

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">School Overview</h1>
              <p className="text-slate-500 text-sm mt-1">Real-time indicators across academics, operations, and finance.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                href="/settings" 
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4" />
                <span>School Settings</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Main Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
                <p className="text-4xl font-extrabold text-slate-900 mt-2">{attendanceRate}%</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Overall daily attendance average</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
                <p className="text-4xl font-extrabold text-slate-900 mt-2">{Number(totalRev).toLocaleString()} ETB</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Academic year fees collected</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students Enrolled</p>
                <p className="text-4xl font-extrabold text-slate-900 mt-2">{studentCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Active student registrations</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" /> Revenue Collection Trend
              </h3>
              <p className="text-xs text-slate-500">Monthly fees collected</p>
            </div>
            <div className="h-64 w-full">
              {adminData.revenueData && adminData.revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} ETB`, 'Revenue']} />
                    <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  No revenue data yet.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">Demographics</h3>
              <p className="text-xs text-slate-500">Student gender distribution</p>
            </div>
            <div className="h-64 w-full">
              {adminData.genderData && adminData.genderData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={adminData.genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {adminData.genderData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  No demographic records yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TEACHER DASHBOARD
  // =========================================================================
  if (role === 'TEACHER') {
    return (
      <div className="space-y-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Teacher Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back. Select an academic quick action below.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/attendance"
            className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-center"
          >
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
              <Clock className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600">Mark Attendance</h2>
            <p className="text-xs text-slate-500">Record daily classroom attendance for your classes.</p>
          </Link>

          <Link
            href="/grading"
            className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-center"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
              <BookOpen className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-emerald-600">Enter Grades</h2>
            <p className="text-xs text-slate-500">Score assignments, quizzes, and term exam papers.</p>
          </Link>

          <Link
            href="/timetable"
            className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-center"
          >
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
              <Calendar className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600">My Schedule</h2>
            <p className="text-xs text-slate-500">View your weekly teaching timetable and periods.</p>
          </Link>

          <Link
            href="/assignments"
            className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-center"
          >
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
              <FileText className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-amber-600">Assignments</h2>
            <p className="text-xs text-slate-500">Create new homework and review student submissions.</p>
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // FALLBACK / STUDENT / PARENT DASHBOARD
  // =========================================================================
  return (
    <div className="space-y-8">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Portal Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome to your student and parent academic workspace.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link href="/timetable" className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all text-center">
          <Calendar className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900">Schedule & Timetable</h3>
          <p className="text-xs text-slate-500 mt-1">View class periods and subjects</p>
        </Link>
        <Link href="/finance" className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all text-center">
          <Receipt className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900">Fee Invoices</h3>
          <p className="text-xs text-slate-500 mt-1">Review fees and payment receipts</p>
        </Link>
        <Link href="/library" className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all text-center">
          <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900">School Library</h3>
          <p className="text-xs text-slate-500 mt-1">Search and borrow library books</p>
        </Link>
      </div>
    </div>
  );
}
