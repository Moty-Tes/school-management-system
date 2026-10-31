'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { TrendingUp, Loader2, X, Edit2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PromotionsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', targetClass: '' });

  const { toast } = useToast();

  async function loadData() {
    try {
      const meData: any = await getMe();
      const isAdmin = meData.roles?.includes('TENANT_ADMIN') || meData.roles?.includes('SUPER_ADMIN');
      setRole(isAdmin ? 'ADMIN' : 'TEACHER');

      try {
        if (isAdmin) {
          const data = await api.get<any[]>('/api/v1/announcements');
          setAnnouncements(data);
        } else {
          const data = await api.get<any[]>('/api/v1/announcements/me');
          setAnnouncements(data);
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load announcements.',
          variant: 'destructive',
        });
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    try {
      setIsCreating(true);
      await api.post('/api/v1/announcements', {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        targetClass: newAnnouncement.targetClass,
      });
      toast({
        title: 'Announcement created',
        description: 'The announcement has been successfully published.',
        variant: 'success',
      });
      setIsCreating(false);
      setNewAnnouncement({ title: '', content: '', targetClass: '' });
      loadData();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create announcement. Please try again.',
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
              <TrendingUp className="w-5 h-5 text-emerald-600 mr-2" /> Announcements
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {role === 'ADMIN' ? 'Create and manage school announcements' : 'View announcements'}
            </p>
          </div>

          {role === 'ADMIN' && (
            <motion.button
              onClick={() => setIsCreating(true)}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring" }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4" /> Create Announcement
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
        {/* Create Announcement Form */}
        {role === 'ADMIN' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 mb-12"
            style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
          >
            <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-4">Create Announcement</h2>

            <form onSubmit={handleCreate} className="space-y-6">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. School Holiday - No Classes"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Content</label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-min h-24"
                  placeholder="Write your announcement here..."
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Class</label>
                <select
                  value={newAnnouncement.targetClass}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, targetClass: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-3 pr-12 cursor-pointer"
                >
                  <option value="">All Classes</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </motion.div>

              <motion.div className="flex justify-end gap-3 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring" }}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isCreating}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring" }}
                  className="px-5 py-3 text-sm font-medium bg-indigo-600 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Publishing...' : 'Publish Announcement'}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        )}

        {/* Announcements List */}
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
            className="border-b border-slate-200 px-6 py-4"
          >
            <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Announcements</h2>
            {role === 'ADMIN' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring" }}
                className="text-indigo-600 font-semibold text-xs hover:underline transition-colors float-right"
              >
                Manage Announcements
              </motion.button>
            )}
          </motion.div>

          {loading ? (
            <motion.div className="p-8 text-center text-slate-500">
              <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
              <p>Loading announcements...</p>
            </motion.div>
          ) : announcements.length === 0 ? (
            <motion.div className="p-12 text-center text-slate-500">
              <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
              <p>No announcements found.</p>
              <p className="text-sm text-slate-400 mt-2">Create your first announcement.</p>
            </motion.div>
          ) : (
            <motion.div className="divide-y divide-slate-100">
              {announcements.map((a) => (
                <motion.div
                  key={a.id}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="px-6 py-4 border-b last:border-0 group"
                  style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900">{a.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{a.content}</p>
                    </div>
                    {role === 'ADMIN' && (
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring" }}
                          className="text-red-600 font-bold text-xs hover:underline transition-colors"
                          title="Delete"
                        >
                          <X className="w-3 h-3" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring" }}
                          className="text-indigo-600 font-bold text-xs hover:underline transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}