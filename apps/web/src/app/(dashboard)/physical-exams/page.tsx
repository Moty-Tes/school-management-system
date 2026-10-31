'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { motion } from 'framer-motion';
import { AlertTriangle as FlagWarning, Loader2, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PhysicalExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState('Term 1');
  const [year, setYear] = useState(new Date().getFullYear());
  const [isCreating, setIsCreating] = useState(false);

  const { toast } = useToast();

  async function loadData() {
    try {
      const meData: any = await getMe();
      const isAdmin = meData.roles?.includes('TENANT_ADMIN') || meData.roles?.includes('SUPER_ADMIN');
      setRole(isAdmin ? 'ADMIN' : 'TEACHER');

      try {
        if (isAdmin) {
          const data = await api.get<any[]>(`/api/v1/physical-exams/list?term=${term}&year=${year}`);
          setExams(data);
        } else {
          const data = await api.get<any[]>('/api/v1/physical-exams/me');
          setExams(data);
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load physical examination data.',
          variant: 'destructive',
        });
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [term, year]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    try {
      setIsCreating(true);
      await api.post('/api/v1/physical-exams', {
        name,
        term,
        year,
        totalStudents,
        passedStudents,
        failedStudents,
      });
      toast({
        title: 'Exam created',
        description: 'Physical examination has been successfully created.',
        variant: 'success',
      });
      setIsCreating(false);
      loadData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create physical examination. Please try again.',
        variant: 'destructive',
      });
      setIsCreating(false);
    }
  }

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
              <FlagWarning className="w-5 h-5 text-red-500 mr-2" /> Physical Exams
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {role === 'ADMIN' ? 'Record and manage student physical examination results' : 'View your physical exam results'}
            </p>
          </div>

          {role === 'ADMIN' && (
            <motion.button
              onClick={() => setIsCreating(true)}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring" }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4" /> Create Exam
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
            <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-4">Exam Period</h2>

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
                  onClick={handleCreate}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring" }}
                  disabled={isCreating}
                  className="px-6 py-3 text-sm font-medium bg-indigo-600 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Exam'}
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Exams Table */}
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
                    <th className="py-4 px-6">Student Name</th>
                  )}
                  <th className="py-4 px-4">Class</th>
                  <th className="py-4 px-4">Exam Type</th>
                  <th className="py-4 px-4">Score</th>
                  <th className="py-4 px-4 font-bold text-slate-900">Status</th>
                  {role === 'ADMIN' && (
                    <th className="py-4 px-4 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <motion.tr>
                    <motion.td colSpan={role === 'ADMIN' ? 6 : 4} className="py-8 text-center text-slate-400">
                      Loading exam data...
                    </motion.td>
                  </motion.tr>
                ) : exams.length === 0 ? (
                  <motion.tr>
                    <motion.td colSpan={role === 'ADMIN' ? 6 : 4} className="py-8 text-center text-slate-500">
                      No exams found for this period.
                    </motion.td>
                  </motion.tr>
                ) : (
                  exams.map((e) => (
                    <motion.tr
                      key={e.id}
                      initial={{ opacity: 0, y: -10, x: -20 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {role === 'ADMIN' && (
                        <motion.td className="py-4 px-4 font-medium text-slate-900">
                          {e.student.user.profile?.firstName} {e.student.user.profile?.lastName}
                        </motion.td>
                      )}

                      <motion.td className="py-4 px-4">
                        {e.className}
                      </motion.td>

                      <motion.td className="py-4 px-4">
                        {e.examType}
                      </motion.td>

                      <motion.td className="py-4 px-4 font-mono">
                        {e.score.toLocaleString()}%
                      </motion.td>

                      <motion.td className="py-4 px-4">
                        <span className={`
                          px-2.5 py-1 rounded-full text-xs font-bold
                          ${e.status === 'PASSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                        `}>
                          {e.status}
                        </span>
                      </motion.td>

                      {role === 'ADMIN' && (
                        <motion.td className="py-4 px-4 text-right">
                          {e.status === 'PENDING' && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: "spring" }}
                              className="text-indigo-600 font-semibold text-xs hover:underline transition-colors"
                            >
                              Update
                            </motion.button>
                          )}
                        </motion.td>
                      )}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        </motion.div>

        {/* No exams state */}
        {role === 'ADMIN' && loading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-8 text-center text-slate-500"
          >
            <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
            <p>Loading exam data...</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}