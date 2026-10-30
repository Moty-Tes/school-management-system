'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Loader2, Info, Shield, Users, Calendar, Mail, Globe, Layout } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPage() {
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
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
          const data = await api.get<any[]>('/api/v1/settings');
          setSystemSettings(data);
        } else {
          const data = await api.get<any[]>('/api/v1/settings/me');
          setSystemSettings(data);
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load settings data.',
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
              <SettingsIcon className="w-5 h-5 text-emerald-600 mr-2" /> System Settings
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {role === 'ADMIN' ? 'Configure system-wide settings' : 'View your personal settings'}
            </p>
          </div>

          {role === 'ADMIN' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring" }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4" /> Update Settings
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
        {/* Settings Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {systemSettings.map((setting) => (
            <motion.div
              key={setting.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40 group"
              style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{setting.title}</h3>
                  <p className="text-sm text-slate-500">{setting.subtitle}</p>
                </div>
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ type: "spring" }}
                  className="p-3 rounded-xl bg-indigo-50/50 backdrop-blur-sm"
                >
                  <Info className="w-4 h-4 text-indigo-400" />
                </motion.div>
              </div>

              <p className="text-3xl font-bold text-emerald-600">{setting.value}</p>
              <p className="text-sm text-slate-500">{setting.category}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Settings Sections */}
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
            <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Account Settings</h2>
          </motion.div>
          <motion.div className="px-6 py-4 text-sm text-slate-500">
            <p>Account configuration options will appear here.</p>
          </motion.div>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          <motion.div
            whileHover={{ y: -6, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40 group"
            style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
          >
            <div className="p-4 rounded-xl bg-indigo-50/50 backdrop-blur-sm">
              <Shield className="w-6 h-6 text-indigo-400" />
              <div>
                <p className="text-sm font-medium text-slate-800">Security</p>
                <p className="text-xs text-slate-500">Manage password and login settings</p>
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
                <p className="text-sm font-medium text-slate-800">Notifications</p>
                <p className="text-xs text-slate-500">Configure notification preferences</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Integration Settings */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[{ id: 1, title: 'Calendar Integration', icon: 'Calendar' }, { id: 2, title: 'Email Settings', icon: 'Mail' }, { id: 3, title: 'API Access', icon: 'Globe' }, { id: 4, title: 'Webhooks', icon: 'Layout' }].map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40 group"
              style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
            >
              <div className="p-4 rounded-xl bg-indigo-50/50 backdrop-blur-sm">
                {item.icon === 'Calendar' ? (
                  <Calendar className="w-6 h-6 text-indigo-400" />
                ) : item.icon === 'Mail' ? (
                  <Mail className="w-6 h-6 text-indigo-400" />
                ) : item.icon === 'Globe' ? (
                  <Globe className="w-6 h-6 text-indigo-400" />
                ) : (
                  <Layout className="w-6 h-6 text-indigo-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500">Configure integration settings</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}