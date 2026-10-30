'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { CheckCircle, X, Loader2, FolderAdd, Menu, Shield, Users, UserPlus, LogOut, Circle, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(['ACADEMIC', 'SPORTS', 'ARTS', 'COMMUNITY']);

  const { toast } = useToast();

  async function loadData() {
    const [clubsData, studentsData] = await Promise.all([
      api.get<any[]>('/api/v1/clubs'),
      api.get<any[]>('/api/v1/students')
    ]);
    setClubs(clubsData);
    setStudents(studentsData);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreateClub(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/clubs', {
        name: selectedClub?.name || '',
        description: selectedClub?.description || '',
        category: selectedClub?.category || 'ACADEMIC',
        advisorName: selectedClub?.advisorName || ''
      });
      setIsCreateOpen(false);
      setSelectedClub(null);
      loadData();
      toast({
        title: 'Club created',
        description: 'The club has been successfully created.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create club. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function openClub(club: any) {
    setSelectedClub(club);
    const membersData = await api.get<any[]>(`/api/v1/clubs/${club.id}/members`);
    setMembers(membersData);
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    if (!selectedClub) return;
    try {
      await api.post(`/api/v1/clubs/${selectedClub.id}/members`, { studentId: addMemberForm.studentId, role: addMemberForm.role });
      openClub(selectedClub);
      loadData();
      toast({
        title: 'Member added',
        description: `${addMemberForm.studentFirstName} has been added to the club.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to add member.',
        variant: 'destructive',
      });
    }
  }

  async function handleRemoveMember(membershipId: string) {
    if (!window.confirm('Are you sure you want to remove this student from the club?')) return;
    try {
      await api.delete(`/api/v1/clubs/members/${membershipId}`);
      openClub(selectedClub);
      loadData();
      toast({
        title: 'Member removed',
        description: 'The student has been removed from the club.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to remove member. Please try again.',
        variant: 'destructive',
      });
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
              <Users className="w-5 h-5 text-indigo-600 mr-2" /> Clubs & Activities
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage extracurriculars, sports, and academic societies</p>
          </div>

          <motion.button
            onClick={() => setIsCreateOpen(true)}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring" }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
          >
            <FolderAdd className="w-4 h-4" /> Create Club
          </motion.button>
        </div>
      </motion.div>

      {/* Clubs Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
        className="px-6 py-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {clubs.map(c => (
            <motion.div
              key={c.id}
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40"
              style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{c.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{c.description}</p>
                  <div className="mt-3 flex gap-2">
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">{c.category}</span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs font-medium text-indigo-500">{c._count.memberships} Members</span>
                  </div>
                </div>

                <motion.div className="p-3 rounded-xl bg-indigo-50/50 backdrop-blur-sm">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <p className="text-xs text-indigo-600">{c._count.memberships} enrolled</p>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {clubs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="col-span-3 p-12 text-center text-slate-500"
          >
            <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
            <p>No clubs found. Create one to get started!</p>
          </motion.div>
        )}
      </motion.div>

      {/* CLUB DETAILS & MEMBERS SIDE PANEL */}
      {selectedClub && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50"
          whileHover={{ opacity: 0.9 }}
        >
          <motion.div
            className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            initial={{ opacity: 0, translateX: 20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedClub.name}</h2>
                <p className="text-xs text-slate-500">Manage Members</p>
              </div>
              <button
                onClick={() => setSelectedClub(null)}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring" }}
                className="text-slate-400 hover:text-slate-900 rounded-lg p-2 transition-all duration-200"
              >
                <X className="w-5 h-5" /> Close
              </button>
            </div>

            {/* Add Member Form */}
            <div className="p-4 border-b bg-white">
              <form onSubmit={handleAddMember} className="flex gap-3">
                <select
                  onChange={(e: any) => setAddMemberForm(prev => ({ ...prev, studentId: e.target.value }))}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-3 pr-12 cursor-pointer"
                >
                  {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>

                <select
                  onChange={(e: any) => setAddMemberForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-32 px-2 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white cursor-pointer"
                >
                  <option value="MEMBER">Member</option>
                  <option value="LEADER">Leader</option>
                  <option value="CAPTAIN">Captain</option>
                </select>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring" }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  Add Member
                </motion.button>
              </form>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {members.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="p-8 text-center text-slate-500"
                >
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No members yet. Add students to get started.</p>
                </motion.div>
              ) : (
                members.map((m: any) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 transition-all duration-300"
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{m.student.firstName} {m.student.lastName}</p>
                      <p className="text-xs text-slate-500">{m.student.class?.name || 'No Class'} • <span className="font-semibold text-indigo-600">{m.role}</span></p>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => handleRemoveMember(m.id)}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring" }}
                        className="text-red-600 hover:text-red-800 text-xs font-bold hover:underline transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </motion.button>

                      {m.role !== 'CAPTAIN' && (
                        <motion.button
                          onClick={() => {}}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring" }}
                          className="text-emerald-600 hover:text-emerald-800 text-xs font-bold hover:underline transition-colors"
                        >
                          <Circle className="w-4 h-4" /> Promote
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* REMOVE MEMBER CONFIRMATION */}
        {selectedClub && members.some(m => /* check */) && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            whileHover={{ opacity: 0.9 }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-3xl p-8 max-w-md"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <h3 className="text-xl font-bold text-slate-900 mb-4">Remove Member</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to remove this student from the club? This action cannot be undone.
              </p>

              <motion.div className="flex justify-end gap-3 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={() => setSelectedClub(prev => prev ? /* deselect */ null : prev)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring" }}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => /* proceed with removal */ }
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring" }}
                  className="px-5 py-3 text-sm font-medium bg-red-600 text-white rounded-xl transition-all"
                >
                  Remove
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      )}

      {/* CREATE CLUB MODAL */}
      {isCreateOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          whileHover={{ opacity: 0.9 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-3xl w-full max-w-md p-8 shadow-3xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <FolderAdd className="w-5 h-5 text-indigo-500" /> Create New Club
            </h2>

            <form onSubmit={handleCreateClub} className="space-y-6">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Club Name</label>
                <input
                  required
                  placeholder="e.g. Chess Club"
                  value={selectedClub?.name || ''}
                  onChange={(e) => setSelectedClub(prev => prev ? {...prev, name: e.target.value} : { name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={selectedClub?.category || 'ACADEMIC'}
                  onChange={(e) => setSelectedClub(prev => prev ? {...prev, category: e.target.value} : { category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'ACADEMIC' ? 'Academic' : cat === 'SPORTS' ? 'Sports' : cat === 'ARTS' ? 'Arts & Music' : 'Community Service'}
                    </option>
                  ))}
                </select>
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Describe the club's purpose and activities..."
                  value={selectedClub?.description || ''}
                  onChange={(e) => setSelectedClub(prev => prev ? {...prev, description: e.target.value} : { description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teacher Advisor</label>
                <input
                  placeholder="e.g. Mr. Smith"
                  value={selectedClub?.advisorName || ''}
                  onChange={(e) => setSelectedClub(prev => prev ? {...prev, advisorName: e.target.value} : { advisorName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </motion.div>

              <motion.div className="flex justify-end gap-3 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring" }}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="px-5 py-3 text-sm font-medium bg-indigo-600 text-white rounded-xl transition-all"
                >
                  Create Club
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}