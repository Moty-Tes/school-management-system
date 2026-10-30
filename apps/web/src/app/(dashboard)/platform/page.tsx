'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { motion } from 'framer-motion';
import { CheckCircle, X, Loader2, FolderAdd, Menu, Shield, Users, UserPlus, LogOut, Clock, Flag, Info, Trash2, Edit2, RefreshCw, Monitor, Settings, Palette, Calendar, Globe, Layout, Loader, Brain, Activity, BarChart3, Clipboard, Folder, FolderAdd as FolderAddIcon, Home, Login, LogOut as LogOutIcon, MapPin, Mic, MonitorOff, Music, Page, PanelRight, Pipe, PlayCircle, Scissors, ShieldCheck, TrendingUp, Wrench } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PlatformPage() {
  const [dashboardStats, setDashboardStats] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  async function loadData() {
    try {
      const meData: any = await getMe();
      const isAdmin = meData.roles?.includes('TENANT_ADMIN') || meData.roles?.includes('SUPER_ADMIN');
      setRole(isAdmin ? 'ADMIN' : 'TEACHER');

      try {
        if (isAdmin) {
          const data = await api.get<any[]>('/api/v1/platform/dashboard-stats');
          setDashboardStats(data);
        } else {
          const data = await api.get<any[]>('/api/v1/platform/me-stats');
          setDashboardStats(data);
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load platform dashboard data.',
          variant: 'destructive',
        });
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  return (
    <motion.div className="min-h-screen bg-slate-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tighter">
              <Screen className="w-5 h-5 text-emerald-600 mr-2" /> Platform Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {role === 'ADMIN' ? 'System-wide analytics and management' : 'Your personal dashboard'}
            </p>
          </div>

          {role === 'ADMIN' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring" }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4" /> Admin Tools
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
        className="px-6 py-8 lg:px-12"
      >
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {dashboardStats.map((stat) => (
            <motion.div
              key={stat.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40 group"
              style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{stat.title}</h3>
                  <p className="text-sm text-slate-500">{stat.subtitle}</p>
                </div>
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring" }}
                  className="p-3 rounded-xl bg-indigo-50/50 backdrop-blur-sm"
                >
                  <Info className="w-4 h-4 text-indigo-400" />
                </div>
              </div>

              <p className="text-3xl font-bold text-emerald-600">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.change} {stat.change >= 0 ? '↑' : '↓'}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-shadow-3xl shadow-slate-50/30"
          style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="border-b border-slate-200 px-6 py-4"
          >
            <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Recent Activity</h2>
          </motion.div>
          <motion.div className="px-6 py-4 text-sm text-slate-500">
            <p>No recent activity.</p>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        {role === 'ADMIN' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            <motion.div
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40 group"
              style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
            >
              <div className="p-4 rounded-xl bg-indigo-50/50 backdrop-blur-sm">
                <Users className="w-6 h-6 text-indigo-400" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Manage Users</p>
                  <p className="text-xs text-slate-500">Add, edit, or remove staff and students</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40 group"
              style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
            >
              <div className="p-4 rounded-xl bg-emerald-50/50 backdrop-blur-sm">
                <Users className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-slate-800">View Reports</p>
                  <p className="text-xs text-slate-500">Generate academic and operational reports</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40 group"
              style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
            >
              <div className="p-4 rounded-xl bg-amber-50/50 backdrop-blur-sm">
                <Users className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Settings</p>
                  <p className="text-xs text-slate-500">Configure system preferences</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40 group"
              style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
            >
              <div className="p-4 rounded-xl bg-red-50/50 backdrop-blur-sm">
                <Users className="w-6 h-6 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-slate-800">Security</p>
                  <p className="text-xs text-slate-500">Manage access and permissions</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}