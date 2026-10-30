'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, CreditCard, BookOpen, Clock, Grid, ChartBar, Pie, Settings, LogOut } from 'lucide-react';

const COLORS = [
  '#1a1a2e',
  '#16213e',
  '#f15a24',
  '#457b9d',
  '#2a9d8f',
  '#e9c46a',
  '#f4a261',
  '#e8d5e6',
];

interface AnalyticsData {
  attendance: { rate: number };
  revenueData: { name: string; total: number }[];
  genderData: { name: string; value: number }[];
}

export default function DashboardPage() {
  const [role, setRole] = useState<string>('');
  const [adminData, setAdminData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then((me: any) => {
      const isAdmin = me.roles?.includes('TENANT_ADMIN') || me.roles?.includes('SUPER_ADMIN');
      const isStudentOrParent = me.roles?.includes('STUDENT') || me.roles?.includes('PARENT');

      setRole(isAdmin ? 'ADMIN' : isStudentOrParent ? 'STUDENT' : 'TEACHER');

      if (isAdmin) {
        api.get('/api/v1/analytics').then(data => setAdminData(data)).catch(console.error);
      } else if (isStudentOrParent) {
        api.get('/api/v1/analytics/me').then(data => setStudentData(data)).catch(console.error);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <motion.div className="flex min-h-screen items-center justify-center">
        <motion.spin className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </motion.div>
    );
  }

  // --- ADMIN DASHBOARD ---
  if (role === 'ADMIN' && adminData) {
    return (
      <main className="py-12 bg-gradient/50 bg-slate-50/30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header Section with Animated Background */}
          <section className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-50/30 mb-8"
            >
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 letter-spacing-{'-0.02em'}">
                    School Overview
                  </h1>
                  <p className="text-slate-500 mt-2 max-w-lg">
                    Welcome back, Admin. Here is what is happening today.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/settings" className="relative px-4 py-2 text-sm font-medium text-primary-600 rounded-full bg-primary-50/30 backdrop-blur-sm hover:bg-primary-50/50 transition-all duration-300">
                    School Settings →
                    <svg className="w-3 h-3 inline -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m6 4h12m0 0l-4 4m4-4l-4-4m0-6H4"></path></svg>
                  </Link>
                </div>
              </div>

              {/* Theme accent bar */}
              <div className="h-1 bg-primary-600 rounded-bottom w-16" />
            </motion.div>

            {/* Animated floating orbs */}
            <div className="absolute top-0 right-0 -translate-x-1/2 -translate-y-1/2 transform" style={{ left: '50%', top: '50%' }}>
              <motion.div
                className="w-64 h-64 rounded-full bg-primary-500/10 opacity-0 group-hover:opacity-50 transition-opacity duration-500"
                animate={{ opacity: [0, 1, 0], transition: { duration: 6, delay: 2, repeat: Infinity, ease: 'ease-in-out' } }}
                style={{ left: '50%', top: '50%' }}
              />
            </div>
            <div className="absolute bottom-0 left-0 -translate-x-1/2 -translate-y-1/2 transform" style={{ left: '50%', bottom: '50%' }}>
              <motion.div
                className="w-96 h-96 rounded-full bg-primary-500/10 opacity-0 group-hover:opacity-50 transition-opacity duration-500"
                animate={{ opacity: [0, 1, 0], transition: { duration: 8, delay: 1, repeat: Infinity, ease: 'ease-in-out' } }}
                style={{ left: '50%', bottom: '50%' }}
              />
            </div>
          </section>

          {/* Admin Stat Cards - staggered entrance with spring */}
          <section className="mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delayChildren: 0.1, staggerChildren: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto"
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="group bg-white rounded-3xl border border-slate-200 p-8 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40"
                style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Attendance Rate</p>
                    <p className="text-5xl font-bold text-slate-900">87.5%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/50 backdrop-blur-sm">
                    <Clock className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -8, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
                className="group bg-white rounded-3xl border border-slate-200 p-8 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40"
                style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Revenue</p>
                    <p className="text-5xl font-bold text-slate-900">2,456,789 ETB</p>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-50/50 backdrop-blur-sm">
                    <CreditCard className="w-8 h-8 text-indigo-400" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -8, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.2 }}
                className="group bg-white rounded-3xl border border-slate-200 p-8 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40"
                style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Students Enrolled</p>
                    <p className="text-5xl font-bold text-slate-900">1,247</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-200/50 backdrop-blur-sm">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* Admin Charts - elegant cards with hover morphing */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

            {/* Revenue Collection Chart */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="group bg-white rounded-3xl border border-slate-200 p-8 shadow-2xl shadow-slate-50/30 overflow-hidden transform transition-all duration-500 hover:shadow-3xl hover:shadow-slate-50/40"
              style={{ background: 'linear-gradient(135deg, #ffffff, #f8fafc)' }}
            >
              <div className="mb-6">
                <h3 className="text-base font-semibold text-slate-600 mb-2 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-500" /> Revenue Collection
                </h3>
                <p className="text-sm text-slate-500">Current academic year performance</p>
              </div>

              <ResponsiveContainer width="100%" height="60%">
                <BarChart data={adminData.revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    style={{ opacity: 0.3 }}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      color: '#fff',
                      fontFamily: '"Inter", "San Francisco", "SF Pro Display", system-ui, sans-serif',
                    }}
                    itemStyle={{ opacity: 0.95 }}
                  />
                  <defs>
                    <linearGradient id="revenue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4facfe" />
                      <stop offset="100%" stopColor="#00f2fe" />
                    </linearGradient>
                  </defs>
                  <Bar
                    dataKey="total"
                    fill="url(#revenue-gradient)"
                    barSize={38}
                    radius={[8, 8, 0, 0]}
                    animationDuration={1200}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Hover gradient overlay */}
              <motion.rect
                x={0}
                y={0}
                width="100%"
                height="100%"
                fill="url(#revenue-gradient)"
                opacity={0}
                animate={{ opacity: [0, 0.1, 0] }}
                transition={{ duration: 0.5 }}
                className="rounded-3xl"
              />
            </motion.div>

            {/* Demographics Chart */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="group bg-white rounded-3xl border border-slate-200 p-8 shadow-2xl shadow-slate-50/30 overflow-hidden transform transition-all duration-500 hover:shadow-3xl hover:shadow-slate-50/40"
              style={{ background: 'linear-gradient(135deg, #ffffff, #f8fafc)' }}
            >
              <div className="mb-6">
                <h3 className="text-base font-semibold text-slate-600 mb-2 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-emerald-500" /> Demographics
                </h3>
                <p className="text-sm text-slate-500">Gender distribution of students</p>
              </div>

              <ResponsiveContainer width="100%" height="60%">
                <PieChart>
                  <Pie
                    data={adminData.genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {adminData.genderData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{ transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
                      >
                        <animateTransform
                          attributeName="transform"
                          type="scale"
                          from="1"
                          to="1.05"
                          dur="2s"
                          repeatCount="indefinite"
                          ease="ease-in-out"
                        />
                        <animate
                          attributeName="boxShadow"
                          from="0 0 0 0 rgba(0,0,0,0)"
                          to="0 4px 20px rgba(0,0,0,0.15)"
                          dur="2s"
                          repeatCount="indefinite"
                          ease="ease-in-out"
                        />
                      </Cell>
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    fontSize={10}
                    textAnchor="middle"
                  >
                    {adminData.genderData.map((entry: any, index: number) => (
                      <text
                        key={`legend-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        x="50%"
                        dy="1.2em"
                        className="text-xs font-medium"
                      >
                        {entry.name}: {entry.value}
                      </text>
                    ))}
                  </Legend>
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </section>

        </div>
      </main>
    );
  }

  // --- STUDENT / PARENT DASHBOARD ---
  if ((role === 'STUDENT' || role === 'STUDENT') && studentData) {
    if (!studentData.isStudent) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-3xl shadow-slate-50/30 text-center max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Welcome!</h2>
            <p className="text-slate-500 mb-6">Your student profile is still being set up by the school administration.</p>
            <button
              onClick={() => window.location.href='/settings'}
              className="mt-6 inline-block px-6 py-3 text-sm font-medium text-white rounded-full bg-primary-600 hover:bg-primary-500 transition-colors"
            >
              Complete Profile →
            </button>
          </div>
        </div>
      );
    }
  }

  // --- TEACHER DASHBOARD ---
  return (
    <main className="py-12 bg-gradient/50 bg-slate-50/30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <section className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-50/30 mb-8"
          >
            <div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
                Teacher Dashboard
              </h1>
              <p className="text-slate-500 mt-2">Welcome back. Here are your quick actions for today.</p>
            </div>
          </motion.div>
        </section>

        {/* Quick Action Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          {/* Mark Attendance */}
          <motion.div
            whileHover={{ y: -10, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="group bg-white rounded-3xl border border-slate-200 p-8 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40 cursor-pointer"
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-16 h-16 bg-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:text-white transition-colors">
              <LogOut className="w-8 h-8 text-primary-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">Mark Attendance</h2>
            <p className="text-slate-500 text-center max-w-xs mx-auto">
              Take daily attendance for your homeroom or subject classes.
            </p>
            <arrowDown className="mt-4 w-6 h-6 mx-auto text-primary-400" />
          </motion.div>

          {/* Enter Grades */}
          <motion.div
            whileHover={{ y: -10, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
            className="group bg-white rounded-3xl border border-slate-200 p-8 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40 cursor-pointer"
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-16 h-14 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:text-white transition-colors">
              <BookOpen className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">Enter Grades</h2>
            <p className="text-slate-500 text-center max-w-xs mx-auto">
              Create new assessments and record student scores.
            </p>
            <arrowDown className="mt-4 w-6 h-6 mx-auto text-emerald-400" />
          </motion.div>
        </section>
      </div>
    </main>
  );
}

// Helper to get arrow SVG
function ArrowDown() {
  return (
    <svg
      className="w-5 h-5 mt-2"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}