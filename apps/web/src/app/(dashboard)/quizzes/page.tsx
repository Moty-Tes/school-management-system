'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { BarChart3, Loader2, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState('Term 1');
  const [year, setYear] = useState(new Date().getFullYear());

  const { toast } = useToast();

  async function loadData() {
    try {
      const meData: any = await getMe();
      const isAdmin = meData.roles?.includes('TENANT_ADMIN') || meData.roles?.includes('SUPER_ADMIN');
      setRole(isAdmin ? 'ADMIN' : 'TEACHER');

      try {
        if (isAdmin) {
          const data = await api.get<any[]>(`/api/v1/quizzes/list?term=${term}&year=${year}`);
          setQuizzes(data);
        } else {
          const data = await api.get<any[]>('/api/v1/quizzes/me');
          setQuizzes(data);
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load quiz data.',
          variant: 'destructive',
        });
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [term, year]);

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
              <BarChart3 className="w-5 h-5 text-emerald-600 mr-2" /> Quizzes
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {role === 'ADMIN' ? 'Create and manage quizzes' : 'View your quizzes'}
            </p>
          </div>

          {role === 'ADMIN' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring" }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4" /> Create Quiz
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
        {/* Admin Filters */}
        {role === 'ADMIN' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 mb-8"
            style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
          >
            <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-4">Quiz Period</h2>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <motion.div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Term</label>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-3 pr-12 cursor-pointer"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </motion.div>

              <motion.div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </motion.div>

              <motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring" }}
                  className="px-6 py-3 text-sm font-medium bg-indigo-600 text-white rounded-xl transition-all"
                >
                  Manage Quizzes
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Quizzes Table */}
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
                    <th className="py-4 px-6">Teacher Name</th>
                  )}
                  <th className="py-4 px-4">Class</th>
                  <th className="py-4 px-4">Subject</th>
                  <th className="py-4 px-4">Topic</th>
                  <th className="py-4 px-4 font-bold text-slate-900">Date</th>
                  <th className="py-4 px-4">Total Questions</th>
                  {role === 'ADMIN' && (
                    <th className="py-4 px-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <motion.tr>
                    <motion.td colSpan={role === 'ADMIN' ? 7 : 5} className="py-8 text-center text-slate-400">
                      Loading quiz data...
                    </motion.td>
                  </motion.tr>
                ) : quizzes.length === 0 ? (
                  <motion.tr>
                    <motion.td colSpan={role === 'ADMIN' ? 7 : 5} className="py-8 text-center text-slate-500">
                      No quizzes found for this period.
                    </motion.td>
                  </motion.tr>
                ) : (
                  quizzes.map((q) => (
                    <motion.tr
                      key={q.id}
                      initial={{ opacity: 0, y: -10, x: -20 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {role === 'ADMIN' && (
                        <motion.td className="py-4 px-4 font-medium text-slate-900">
                          {q.teacher.user.profile?.firstName} {q.teacher.user.profile?.lastName}
                        </motion.td>
                      )}

                      <motion.td className="py-4 px-4">
                        {q.className}
                      </motion.td>

                      <motion.td className="py-4 px-4">
                        {q.subject}
                      </motion.td>

                      <motion.td className="py-4 px-4">
                        {q.topic}
                      </motion.td>

                      <motion.td className="py-4 px-4">
        {new Date(q.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </motion.td>

                      <motion.td className="py-4 px-4">
                        {q.totalQuestions}
                      </motion.td>

                      {role === 'ADMIN' && (
                        <motion.td className="py-4 px-4 text-right">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring" }}
                            className="text-indigo-600 font-semibold text-xs hover:underline transition-colors"
                          >
                            View
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

        {/* No quizzes state */}
        {role === 'ADMIN' && loading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-8 text-center text-slate-500"
          >
            <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
            <p>Loading quiz data...</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}