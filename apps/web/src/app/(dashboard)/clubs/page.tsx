'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function ClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  
  // Forms
  const [clubForm, setClubForm] = useState({ name: '', description: '', category: 'ACADEMIC', advisorName: '' });
  const [addMemberForm, setAddMemberForm] = useState({ studentId: '', role: 'MEMBER' });

  async function loadData() {
    const [clubsData, studentsData] = await Promise.all([
      api.get<any[]>('/api/v1/clubs'),
      api.get<any[]>('/api/v1/students')
    ]);
    setClubs(clubsData);
    setStudents(studentsData);
    if (studentsData.length > 0) setAddMemberForm(prev => ({ ...prev, studentId: studentsData[0].id }));
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreateClub(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/clubs', clubForm);
    setIsCreateOpen(false);
    setClubForm({ name: '', description: '', category: 'ACADEMIC', advisorName: '' });
    loadData();
  }

  async function openClub(club: any) {
    setSelectedClub(club);
    const membersData = await api.get<any[]>(`/api/v1/clubs/${club.id}/members`);
    setMembers(membersData);
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post(`/api/v1/clubs/${selectedClub.id}/members`, addMemberForm);
      openClub(selectedClub); // Refresh members list
      loadData(); // Refresh counts
      alert('Student added to club!');
    } catch (err: any) {
      alert(err.message); // "Already a member"
    }
  }

  async function handleRemoveMember(membershipId: string) {
    if (!window.confirm("Remove student from club?")) return;
    await api.delete(`/api/v1/clubs/members/${membershipId}`);
    openClub(selectedClub); // Refresh
    loadData();
  }

  if (loading) return <div className="p-10 text-center">Loading clubs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clubs & Activities</h1>
          <p className="text-slate-500 text-sm mt-1">Manage extracurriculars, sports, and academic societies</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Create Club
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clubs.map(c => (
          <div key={c.id} onClick={() => openClub(c)} className="bg-white p-6 rounded-xl border shadow-sm cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">{c.category}</span>
            </div>
            <p className="text-sm text-slate-500 line-clamp-2">{c.description}</p>
            <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs font-semibold text-slate-400">
              <span>Advisor: {c.advisorName || 'None'}</span>
              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">{c._count.memberships} Members</span>
            </div>
          </div>
        ))}
      </div>

      {/* CLUB DETAILS & MEMBERS SIDE PANEL */}
      {selectedClub && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedClub.name}</h2>
                <p className="text-xs text-slate-500">Manage Members</p>
              </div>
              <button onClick={() => setSelectedClub(null)} className="text-slate-400 hover:text-slate-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-4 border-b bg-white">
              <form onSubmit={handleAddMember} className="flex gap-2">
                <select value={addMemberForm.studentId} onChange={e => setAddMemberForm({...addMemberForm, studentId: e.target.value})} className="flex-1 px-3 py-2 border rounded-lg text-sm">
                  {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
                <select value={addMemberForm.role} onChange={e => setAddMemberForm({...addMemberForm, role: e.target.value})} className="w-28 px-2 py-2 border rounded-lg text-sm">
                  <option value="MEMBER">Member</option>
                  <option value="LEADER">Leader</option>
                  <option value="CAPTAIN">Captain</option>
                </select>
                <button type="submit" className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold">Add</button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {members.map(m => (
                <div key={m.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{m.student.firstName} {m.student.lastName}</p>
                    <p className="text-xs text-slate-500">{m.student.class?.name || 'No Class'} | <span className="font-semibold text-indigo-600">{m.role}</span></p>
                  </div>
                  <button onClick={() => handleRemoveMember(m.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE CLUB MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Create New Club</h2>
            <form onSubmit={handleCreateClub} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Club Name</label>
                <input required type="text" value={clubForm.name} onChange={e => setClubForm({...clubForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Chess Club" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Category</label>
                <select value={clubForm.category} onChange={e => setClubForm({...clubForm, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="ACADEMIC">Academic</option>
                  <option value="SPORTS">Sports</option>
                  <option value="ARTS">Arts & Music</option>
                  <option value="COMMUNITY">Community Service</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description (Optional)</label>
                <textarea rows={2} value={clubForm.description} onChange={e => setClubForm({...clubForm, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Teacher Advisor</label>
                <input type="text" value={clubForm.advisorName} onChange={e => setClubForm({...clubForm, advisorName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}