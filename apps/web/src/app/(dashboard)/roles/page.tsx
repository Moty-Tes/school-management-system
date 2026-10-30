'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function RolesPage() {
  const [users, setUsers] = useState<any[]>([]);
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
          const data = await api.get<any[]>('/api/v1/roles/all');
          setUsers(data);
        } else {
          const data = await api.get<any[]>('/api/v1/roles/me');
          setUsers(data);
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load roles data.',
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
              <ShieldCheck className="w-5 h-5 text-emerald-600 mr-2" /> Roles & Permissions
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {role === 'ADMIN' ? 'Manage user roles and permissions' : 'View your role and permissions'}
            </p>
          </div>

          {role === 'ADMIN' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring" }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4" /> Manage Roles
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
        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-3xl shadow-slate-50/30"
          style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="border-b border-slate-200"
          >
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  {role === 'ADMIN' && (
                    <th className="py-4 px-6">Username</th>
                  )}
                  <th className="py-4 px-4">Full Name</th>
                  <th className="py-4 px-4">Email</th>
                  <th className="py-4 px-4">Role</th>
                  <th className="py-4 px-4">Status</th>
                  {role === 'ADMIN' && (
                    <th className="py-4 px-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <motion.tr>
                    <motion.td colSpan={role === 'ADMIN' ? 6 : 4} className="py-8 text-center text-slate-400">
                      Loading roles data...
                    </motion.td>
                  </motion.tr>
                ) : users.length === 0 ? (
                  <motion.tr>
                    <motion.td colSpan={role === 'ADMIN' ? 6 : 4} className="py-8 text-center text-slate-500">
                      No users found.
                    </motion.td>
                  </motion.tr>
                ) : (
                  users.map((u) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: -10, x: -20 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {role === 'ADMIN' && (
                        <motion.td className="py-4 px-4 font-medium text-slate-900">
                          {u.username}
                        </motion.td>
                      )}

                      <motion.td className="py-4 px-4 font-medium text-slate-900">
                        {u.profile?.firstName} {u.profile?.lastName}
                      </motion.td>

                      <motion.td className="py-4 px-4">
                        {u.email}
                      </motion.td>

                      <motion.td className="py-4 px-4">
                        <span className={`
                          px-2 py-1 rounded text-xs font-bold
                          ${u.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-indigo-100 text-indigo-800'}
                        `}>
                          {u.role}
                        </span>
                      </motion.td>

                      {role === 'ADMIN' && (
                        <motion.td className="py-4 px-4 text-right">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring" }}
                            className="text-indigo-600 font-semibold text-xs hover:underline transition-colors"
                          >
                            Edit
                          </motion.button>
                        </motion.td>
                      )}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        </motion.div>

        {/* No users state */}
        {role === 'ADMIN' && loading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-8 text-center text-slate-500"
          >
            <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
            <p>Loading roles data...</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}