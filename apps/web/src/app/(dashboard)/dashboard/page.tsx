'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, CreditCard, BarChart3, BookOpen, Clock } from 'lucide-react';
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
      console.log("User roles:", me.roles); // Debugging
      
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
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  if (role === 'ADMIN' && adminData) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">School Overview</h1>
            <p className="text-slate-500 mt-1">Welcome back, Admin. Here is what is happening today.</p>
          </div>
          <Link href="/settings" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">School Settings →</Link>
        </div>

        {/* Admin Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Attendance Rate" 
            value={`${adminData.attendance.rate}%`} 
            icon={<Clock className="w-6 h-6 text-emerald-600" />} 
            color="bg-emerald-50" 
          />
          <StatCard 
            title="Total Revenue (6 Mo)" 
            value={`${adminData.revenueData.reduce((acc: number, curr: any) => acc + curr.total, 0).toLocaleString()} ETB`} 
            icon={<CreditCard className="w-6 h-6 text-indigo-600" />} 
            color="bg-indigo-50" 
          />
          <StatCard 
            title="Students Enrolled" 
            value={adminData.genderData.reduce((acc: number, curr: any) => acc + curr.value, 0)} 
            icon={<Users className="w-6 h-6 text-purple-600" />} 
            color="bg-purple-50" 
          />
        </div>

        {/* Admin Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div whileHover={{ scale: 1.01 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600"/> Revenue Collection</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adminData.revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          <motion.div whileHover={{ scale: 1.01 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-600"/> Demographics</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={adminData.genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" animationDuration={1500}>
                    {adminData.genderData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // --- STUDENT / PARENT DASHBOARD ---
  if ((role === 'STUDENT') && studentData) {
    if (!studentData.isStudent) {
      return <div className="p-10 text-center text-slate-500">Your student profile is still being set up by the administration.</div>;
    }

    const getAtt = (status: string) => studentData.attendance.find((a: any) => a.status === status)?._count.status || 0;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {studentData.student.firstName}. Here is your academic summary.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard 
            title="My Class" 
            value={studentData.student.class ? `${studentData.student.class.name} - ${studentData.student.class.section}` : 'Unassigned'} 
            icon={<BookOpen className="w-6 h-6 text-indigo-600" />} 
            color="bg-indigo-50" 
          />
          <StatCard 
            title="My Attendance" 
            value={`${getAtt('PRESENT')} Present / ${getAtt('ABSENT')} Absent`} 
            icon={<Clock className="w-6 h-6 text-emerald-600" />} 
            color="bg-emerald-50" 
          />
        </div>

        {/* Recent Grades & Timetable */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50"><h3 className="font-bold text-slate-900">Recent Grades</h3></div>
            <div className="divide-y divide-slate-100">
              {studentData.grades.map((g: any) => (
                <div key={g.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-900">{g.assessment.title}</p>
                    <p className="text-xs text-slate-500">{new Date(g.assessment.date).toLocaleDateString()}</p>
                  </div>
                  <span className="font-mono font-bold text-indigo-600 text-lg">{g.score} <span className="text-xs text-slate-400">/ {g.assessment.maxScore}</span></span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50"><h3 className="font-bold text-slate-900">My Timetable</h3></div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {studentData.timetable.map((t: any) => (
                <div key={t.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-900">{t.subject.name}</p>
                    <p className="text-xs text-slate-500">{t.teacher.user.profile.firstName} {t.teacher.user.profile.lastName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][t.dayOfWeek - 1]}</p>
                    <p className="text-xs text-slate-500">{t.startTime} - {t.endTime}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // --- TEACHER DASHBOARD ---
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Teacher Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back. Here are your quick actions for today.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/attendance" className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Mark Attendance</h2>
          <p className="text-sm text-slate-500">Take daily attendance for your homeroom or subject classes.</p>
        </Link>

        <Link href="/assessments" className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all group">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Enter Grades</h2>
          <p className="text-sm text-slate-500">Create new assessments and record student scores.</p>
        </Link>
      </div>
    </motion.div>
  );
}

// Reusable animated StatCard component
function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-start justify-between"
    >
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
    </motion.div>
  );
}