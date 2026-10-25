'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';

export default function HRPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: 'SICK',
    startDate: '',
    endDate: '',
    reason: '',
  });

  async function loadData() {
    const meData: any = await getMe();
    const isAdmin = meData.roles?.includes('TENANT_ADMIN') || meData.roles?.includes('SUPER_ADMIN');
    setRole(isAdmin ? 'ADMIN' : 'TEACHER');

    const endpoint = isAdmin ? '/api/v1/leaves/all' : '/api/v1/leaves/me';
    const data = await api.get<any[]>(endpoint);
    setLeaves(data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/leaves', formData);
    setIsModalOpen(false);
    setFormData({ type: 'SICK', startDate: '', endDate: '', reason: '' });
    loadData();
  }

  async function handleUpdateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    await api.patch(`/api/v1/leaves/${id}`, { status });
    loadData();
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading HR data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HR & Leave Management</h1>
          <p className="text-slate-500 text-sm mt-1">{role === 'ADMIN' ? 'Manage staff leave requests' : 'Request time off and view your history'}</p>
        </div>
        {role === 'TEACHER' && (
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Request Leave
          </button>
        )}
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
            <tr>
              {role === 'ADMIN' && <th className="py-3 px-4">Staff Name</th>}
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Status</th>
              {role === 'ADMIN' && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {leaves.length === 0 ? (
              <tr><td colSpan={role === 'ADMIN' ? 6 : 4} className="py-8 text-center text-slate-400">No leave requests found.</td></tr>
            ) : (
              leaves.map(leave => (
                <tr key={leave.id} className="hover:bg-slate-50">
                  {role === 'ADMIN' && (
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {leave.teacher.user.profile?.firstName} {leave.teacher.user.profile?.lastName}
                    </td>
                  )}
                  <td className="py-3 px-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">{leave.type}</span></td>
                  <td className="py-3 px-4 text-slate-600">
                    {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{leave.reason}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  {role === 'ADMIN' && (
                    <td className="py-3 px-4 text-right space-x-2">
                      {leave.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleUpdateStatus(leave.id, 'APPROVED')} className="text-emerald-600 font-bold text-xs hover:underline">Approve</button>
                          <button onClick={() => handleUpdateStatus(leave.id, 'REJECTED')} className="text-red-600 font-bold text-xs hover:underline">Reject</button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* REQUEST LEAVE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Request Leave</h2>
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Leave Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="SICK">Sick Leave</option>
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Start Date</label>
                  <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">End Date</label>
                  <input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Reason</label>
                <textarea required rows={3} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Provide a brief reason..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}