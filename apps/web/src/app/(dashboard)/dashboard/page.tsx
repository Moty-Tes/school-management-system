'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#4f46e5', '#ec4899', '#10b981'];

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
        api.get('/api/v1/analytics').then(data => setAdminData(data));
      } else if (isStudentOrParent) {
        api.get('/api/v1/analytics/me').then(data => setStudentData(data));
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  if (role === 'ADMIN' && adminData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">School Overview</h1>
            <p className="text-slate-500 mt-1">Welcome back, Admin. Here is what is happening today.</p>
          </div>
          <Link href="/settings" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">School Settings →</Link>
        </div>

        {/* Admin Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
            <div className="flex items-end gap-3 mt-2">
              <p className="text-4xl font-bold text-slate-900">{adminData.attendance.rate}%</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue (6 Mo)</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">
              {adminData.revenueData.reduce((acc: number, curr: any) => acc + curr.total, 0).toLocaleString()} <span className="text-lg text-slate-500">ETB</span>
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students Enrolled</p>
            <p className="text-4xl font-bold text-slate-900 mt-2">
              {adminData.genderData.reduce((acc: number, curr: any) => acc + curr.value, 0)}
            </p>
          </div>
        </div>

        {/* Admin Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
            <h3 className="text-base font-bold text-slate-900 mb-6">Revenue Collection</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adminData.revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-6">Demographics</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={adminData.genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                    {adminData.genderData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STUDENT / PARENT DASHBOARD ---
  if ((role === 'STUDENT' || role === 'STUDENT') && studentData) {
    if (!studentData.isStudent) {
      return (
        <div className="p-10 text-center text-slate-500">
          <h2 className="text-xl font-bold mb-2">Welcome!</h2>
          <p>Your student profile is still being set up by the school administration.</p>
        </div>
      );
    }

    const getAtt = (status: string) => studentData.attendance.find((a: any) => a.status === status)?._count.status || 0;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {studentData.student.firstName}. Here is your academic summary.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">My Class</p>
            <p className="text-2xl font-bold mt-2">{studentData.student.class ? `${studentData.student.class.name} - ${studentData.student.class.section}` : 'Unassigned'}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Attendance</p>
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{getAtt('PRESENT')}</p>
                <p className="text-xs text-slate-500 uppercase">Present</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{getAtt('ABSENT')}</p>
                <p className="text-xs text-slate-500 uppercase">Absent</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Grades */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50"><h3 className="font-bold text-slate-900">Recent Grades</h3></div>
            <div className="divide-y divide-slate-100">
              {studentData.grades.length === 0 ? <p className="p-6 text-sm text-slate-500">No grades yet.</p> : 
                studentData.grades.map((g: any) => (
                  <div key={g.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{g.assessment.title}</p>
                      <p className="text-xs text-slate-500">{new Date(g.assessment.date).toLocaleDateString()}</p>
                    </div>
                    <span className="font-mono font-bold text-indigo-600 text-lg">{g.score} <span className="text-xs text-slate-400">/ {g.assessment.maxScore}</span></span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Timetable */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50"><h3 className="font-bold text-slate-900">My Timetable</h3></div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {studentData.timetable.length === 0 ? <p className="p-6 text-sm text-slate-500">No timetable set yet.</p> :
                studentData.timetable.map((t: any) => (
                  <div key={t.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{t.subject.name}</p>
                      <p className="text-xs text-slate-500">{t.teacher.user.profile.firstName} {t.teacher.user.profile.lastName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-700">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][t.dayOfWeek - 1]}</p>
                      <p className="text-xs text-slate-500">{t.startTime} - {t.endTime}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- TEACHER DASHBOARD ---
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Teacher Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back. Here are your quick actions for today.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/attendance" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 transition-colors group">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Mark Attendance</h2>
          <p className="text-sm text-slate-500">Take daily attendance for your homeroom or subject classes.</p>
        </Link>

        <Link href="/assessments" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 transition-colors group">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Enter Grades</h2>
          <p className="text-sm text-slate-500">Create new assessments and record student scores.</p>
        </Link>
      </div>
    </div>
  );
}