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

const LUXE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function DashboardPage() {
  const [role, setRole] = useState<'ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'REGISTRAR'>('ADMIN');
  const [adminData, setAdminData] = useState<any>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ firstName?: string; lastName?: string }>({});
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
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 animate-spin flex items-center justify-center shadow-xl shadow-indigo-500/30" />
          <div className="absolute inset-0 rounded-2xl blur-lg bg-indigo-500/50 animate-pulse" />
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Initializing Dashboard...</p>
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
      <div className="space-y-8 animate-fade-in">
        {/* Luxury Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 bg-gradient-to-r from-slate-950 via-[#13112c] to-[#1c1335] text-white">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 mb-4 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Financial Management & Accounting</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Welcome back, {userProfile.firstName || 'Accountant'}
              </h1>
              <p className="text-slate-300 text-sm mt-1.5 max-w-xl font-medium">
                Here is your live financial balance, revenue distribution, pending fees, and transaction overview.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link 
                href="/finance" 
                className="glass-button-primary inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider py-2.5 px-4 shadow-lg shadow-indigo-500/30"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Invoice</span>
              </Link>
              <Link 
                href="/exports" 
                className="glass-button-secondary inline-flex items-center gap-2 text-xs font-bold py-2.5 px-4 text-slate-800 bg-white/90 hover:bg-white"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Financial Audit</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Collected */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="glow-card-emerald rounded-3xl p-6 relative overflow-hidden transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">Total Collected</span>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900 tracking-tight">
                {Number(totalRev).toLocaleString()}
              </p>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">ETB</span>
            </div>
            <p className="text-xs text-emerald-700 font-semibold mt-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirmed deposits in ledger
            </p>
          </motion.div>

          {/* Pending Balance */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="glow-card-amber rounded-3xl p-6 relative overflow-hidden transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">Pending Balance</span>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900 tracking-tight">
                {Number(pendingAmt).toLocaleString()}
              </p>
              <span className="text-xs font-black text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">ETB</span>
            </div>
            <p className="text-xs text-amber-700 font-semibold mt-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Unsettled student fee items
            </p>
          </motion.div>

          {/* Invoices Issued */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="glow-card-indigo rounded-3xl p-6 relative overflow-hidden transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-800">Total Invoices</span>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-400 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{invCount}</p>
            <p className="text-xs text-indigo-700 font-semibold mt-3 flex items-center gap-1.5">
              Active billable records generated
            </p>
          </motion.div>

          {/* Enrolled Students */}
          <motion.div 
            whileHover={{ y: -4 }}
            className="glow-card-purple rounded-3xl p-6 relative overflow-hidden transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-800">Enrolled Students</span>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-400 text-white flex items-center justify-center shadow-md shadow-purple-500/30">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{studentCount}</p>
            <p className="text-xs text-purple-700 font-semibold mt-3 flex items-center gap-1.5">
              Enrolled students across school
            </p>
          </motion.div>
        </div>

        {/* Quick Action Matrix */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xl">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Accounting Navigation
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link 
              href="/finance" 
              className="p-5 rounded-2xl border border-white/80 bg-white/60 hover:bg-white hover:border-indigo-300 transition-all duration-300 group text-center shadow-xs hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-md shadow-indigo-500/20">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">Student Invoices</p>
              <p className="text-xs text-slate-500 mt-1">Issue bills & record receipts</p>
            </Link>

            <Link 
              href="/expenses" 
              className="p-5 rounded-2xl border border-white/80 bg-white/60 hover:bg-white hover:border-rose-300 transition-all duration-300 group text-center shadow-xs hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-md shadow-rose-500/20">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-rose-600">School Expenses</p>
              <p className="text-xs text-slate-500 mt-1">Log & audit operating costs</p>
            </Link>

            <Link 
              href="/payroll" 
              className="p-5 rounded-2xl border border-white/80 bg-white/60 hover:bg-white hover:border-emerald-300 transition-all duration-300 group text-center shadow-xs hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-md shadow-emerald-500/20">
                <CreditCard className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600">Staff Payroll</p>
              <p className="text-xs text-slate-500 mt-1">Teacher salaries & payslips</p>
            </Link>

            <Link 
              href="/exports" 
              className="p-5 rounded-2xl border border-white/80 bg-white/60 hover:bg-white hover:border-purple-300 transition-all duration-300 group text-center shadow-xs hover:shadow-md"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-violet-600 text-white flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-md shadow-purple-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-purple-600">Export Reports</p>
              <p className="text-xs text-slate-500 mt-1">Download CSV/PDF audits</p>
            </Link>
          </div>
        </div>

        {/* Invoices List */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Recent Financial Activity</h3>
              <p className="text-xs text-slate-500">Latest invoices logged in the school billing registry</p>
            </div>
            <Link href="/finance" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View All Invoices <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentInvoices.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">No invoice transactions recorded yet.</p>
            ) : (
              recentInvoices.slice(0, 5).map((inv: any) => (
                <div key={inv.id} className="p-4 rounded-2xl bg-white/70 border border-slate-100 hover:bg-white transition-all flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center">
                      INV
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : 'Fee Item'}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        Due: {new Date(inv.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{Number(inv.amount).toLocaleString()} ETB</p>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                      inv.status === 'PAID' ? 'badge-luxe-emerald' : 'badge-luxe-amber'
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
    );
  }

  // =========================================================================
  // ADMIN DASHBOARD
  // =========================================================================
  if (role === 'ADMIN' && adminData) {
    const totalRev = adminData?.totalRevenue ?? adminData?.revenueData?.reduce((s: number, r: any) => s + (r.total || 0), 0) ?? 0;
    const studentCount = adminData?.totalStudents ?? 0;
    const attendanceRate = adminData?.attendance?.rate ?? 0;
    const teacherCount = adminData?.totalTeachers ?? 0;

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Luxury Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 bg-gradient-to-r from-slate-950 via-[#10142b] to-[#1a1236] text-white">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 mb-4 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Executive Command Center</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                School Command Center
              </h1>
              <p className="text-slate-300 text-sm mt-1.5 max-w-xl font-medium">
                Real-time operational metrics across enrollment, attendance, financial health, and academic performance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link 
                href="/settings" 
                className="glass-button-secondary inline-flex items-center gap-2 text-xs font-bold py-2.5 px-4 text-slate-800 bg-white/95 hover:bg-white"
              >
                <Settings className="w-4 h-4 text-indigo-600" />
                <span>School Settings</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Main Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div whileHover={{ y: -4 }} className="glow-card-emerald rounded-3xl p-6 relative overflow-hidden transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Attendance Rate</p>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">{attendanceRate}%</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-emerald-700 font-semibold mt-3">School-wide daily attendance rate</p>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="glow-card-indigo rounded-3xl p-6 relative overflow-hidden transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider">Total Revenue</p>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">{Number(totalRev).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-indigo-700 font-semibold mt-3">Total school tuition & fees collected</p>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="glow-card-purple rounded-3xl p-6 relative overflow-hidden transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-extrabold text-purple-800 uppercase tracking-wider">Enrolled Students</p>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">{studentCount}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-purple-700 font-semibold mt-3">Active cohort pupil registry</p>
          </motion.div>

          <motion.div whileHover={{ y: -4 }} className="glow-card-amber rounded-3xl p-6 relative overflow-hidden transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">Teaching Faculty</p>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">{teacherCount}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-amber-700 font-semibold mt-3">Full-time certified instructors</p>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Revenue Collections Trend</h3>
                <p className="text-xs text-slate-500">Monthly tuition fees and billable receipts</p>
              </div>
              <span className="badge-luxe-indigo text-xs">Live Stream</span>
            </div>
            <div className="h-72 w-full">
              {adminData.revenueData && adminData.revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.6)" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}k`} />
                    <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="total" fill="url(#indigoGrad)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                  No monthly transactions recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Demographics Pie */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Student Demographics</h3>
              <p className="text-xs text-slate-500">Gender and enrollment distribution</p>
            </div>
            <div className="h-64 w-full">
              {adminData.genderData && adminData.genderData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={adminData.genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value">
                      {adminData.genderData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={LUXE_COLORS[index % LUXE_COLORS.length]} />
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
      <div className="space-y-8 animate-fade-in">
        {/* Luxury Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 bg-gradient-to-r from-slate-950 via-[#0e162e] to-[#151f3d] text-white">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 mb-4 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instructor Workspace</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Welcome back, {userProfile.firstName || 'Teacher'}
              </h1>
              <p className="text-slate-300 text-sm mt-1.5 max-w-xl font-medium">
                Record daily attendance, evaluate assessments, publish quizzes, and view your schedule.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Quick Academic Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/attendance"
            className="glass-card rounded-3xl p-6 text-center group border border-white/80 shadow-lg hover:shadow-2xl"
          >
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/25">
              <Clock className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">Mark Attendance</h2>
            <p className="text-xs text-slate-500">Record daily classroom attendance for your classes.</p>
          </Link>

          <Link
            href="/grading"
            className="glass-card rounded-3xl p-6 text-center group border border-white/80 shadow-lg hover:shadow-2xl"
          >
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/25">
              <BookOpen className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">Enter Grades</h2>
            <p className="text-xs text-slate-500">Score assignments, quizzes, and term exam papers.</p>
          </Link>

          <Link
            href="/timetable"
            className="glass-card rounded-3xl p-6 text-center group border border-white/80 shadow-lg hover:shadow-2xl"
          >
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/25">
              <Calendar className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">My Schedule</h2>
            <p className="text-xs text-slate-500">View your weekly teaching timetable and periods.</p>
          </Link>

          <Link
            href="/assignments"
            className="glass-card rounded-3xl p-6 text-center group border border-white/80 shadow-lg hover:shadow-2xl"
          >
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/25">
              <FileText className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">Assignments</h2>
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
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 bg-gradient-to-r from-slate-950 via-[#10142b] to-[#1e1336] text-white">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Student & Parent Portal</h1>
        <p className="text-slate-300 text-sm mt-1.5 font-medium">View enrolled classes, test schedules, and homework submissions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link href="/assignments" className="glass-card rounded-3xl p-6 text-center group">
          <FileText className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900">Homework & Assignments</h3>
          <p className="text-xs text-slate-500 mt-1">Review deadlines and upload completed coursework</p>
        </Link>
        <Link href="/cbt" className="glass-card rounded-3xl p-6 text-center group">
          <BookOpen className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900">Take CBT Exam</h3>
          <p className="text-xs text-slate-500 mt-1">Join active exam room and complete timed quizzes</p>
        </Link>
        <Link href="/timetable" className="glass-card rounded-3xl p-6 text-center group">
          <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900">Class Schedule</h3>
          <p className="text-xs text-slate-500 mt-1">Check today's lecture schedule and classroom locations</p>
        </Link>
      </div>
    </div>
  );
}
