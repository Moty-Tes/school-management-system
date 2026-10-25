'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function FrontDeskPage() {
  const [activeTab, setActiveTab] = useState<'visitors' | 'gatepasses'>('visitors');
  
  const [visitors, setVisitors] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isVisitorOpen, setIsVisitorOpen] = useState(false);
  const [isPassOpen, setIsPassOpen] = useState(false);

  // Forms
  const [visitorForm, setVisitorForm] = useState({ name: '', phone: '', purpose: '', hostName: '' });
  const [passForm, setPassForm] = useState({ admissionNumber: '', reason: '', releasedTo: '', approvedBy: '' });

  async function loadData() {
    const [visitorData, passData] = await Promise.all([
      api.get<any[]>('/api/v1/frontdesk/visitors'),
      api.get<any[]>('/api/v1/frontdesk/gate-passes')
    ]);
    setVisitors(visitorData);
    setGatePasses(passData);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleLogVisitor(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/frontdesk/visitors', visitorForm);
    setIsVisitorOpen(false);
    setVisitorForm({ name: '', phone: '', purpose: '', hostName: '' });
    loadData();
  }

  async function handleCheckoutVisitor(id: string) {
    await api.patch(`/api/v1/frontdesk/visitors/${id}/checkout`);
    loadData();
  }

  async function handleCreatePass(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/frontdesk/gate-passes', passForm);
      setIsPassOpen(false);
      setPassForm({ admissionNumber: '', reason: '', releasedTo: '', approvedBy: '' });
      loadData();
      alert('Gate pass approved and logged!');
    } catch (err: any) {
      alert(err.message); // "Student not found" or "Already out"
    }
  }

  async function handleReturnStudent(id: string) {
    await api.patch(`/api/v1/frontdesk/gate-passes/${id}/return`);
    loadData();
  }

  if (loading) return <div className="p-10 text-center">Loading front desk...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Front Desk & Security</h1>
          <p className="text-slate-500 text-sm mt-1">Manage visitors and student early departures</p>
        </div>
        <button 
          onClick={() => activeTab === 'visitors' ? setIsVisitorOpen(true) : setIsPassOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {activeTab === 'visitors' ? '+ Log Visitor' : '🚪 Issue Gate Pass'}
        </button>
      </div>

      <div className="flex gap-4 border-b">
        <button onClick={() => setActiveTab('visitors')} className={`pb-2 px-2 text-sm font-medium ${activeTab === 'visitors' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Active Visitors</button>
        <button onClick={() => setActiveTab('gatepasses')} className={`pb-2 px-2 text-sm font-medium ${activeTab === 'gatepasses' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Students Off-Campus</button>
      </div>

      {/* VISITORS TAB */}
      {activeTab === 'visitors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visitors.length === 0 ? <p className="text-sm text-slate-500 col-span-full">No active visitors on campus.</p> : 
            visitors.map(v => (
              <div key={v.id} className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-900">{v.name}</h3>
                  <span className="text-xs text-slate-500 font-mono">{new Date(v.checkInTime).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-slate-600 mb-1"><span className="font-semibold">Purpose:</span> {v.purpose}</p>
                <p className="text-sm text-slate-600 mb-4"><span className="font-semibold">Visiting:</span> {v.hostName || 'General'}</p>
                <button onClick={() => handleCheckoutVisitor(v.id)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-lg text-sm font-medium transition-colors">
                  Check Out
                </button>
              </div>
            ))
          }
        </div>
      )}

      {/* GATE PASSES TAB */}
      {activeTab === 'gatepasses' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Released To</th>
                <th className="py-3 px-4">Exit Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {gatePasses.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">No students are currently out of school.</td></tr>
              ) : (
                gatePasses.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{p.student.firstName} {p.student.lastName}</td>
                    <td className="py-3 px-4 text-slate-600">{p.reason}</td>
                    <td className="py-3 px-4 text-slate-600">{p.releasedTo}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{new Date(p.exitTime).toLocaleTimeString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleReturnStudent(p.id)} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                        Mark Returned
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* LOG VISITOR MODAL */}
      {isVisitorOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Log New Visitor</h2>
            <form onSubmit={handleLogVisitor} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Visitor Name</label>
                <input required type="text" value={visitorForm.name} onChange={e => setVisitorForm({...visitorForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Phone Number</label>
                <input type="text" value={visitorForm.phone} onChange={e => setVisitorForm({...visitorForm, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Purpose of Visit</label>
                <input required type="text" value={visitorForm.purpose} onChange={e => setVisitorForm({...visitorForm, purpose: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Meeting with Principal" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Host / Visiting Whom</label>
                <input type="text" value={visitorForm.hostName} onChange={e => setVisitorForm({...visitorForm, hostName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsVisitorOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Check In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE GATE PASS MODAL */}
      {isPassOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Issue Gate Pass</h2>
            <form onSubmit={handleCreatePass} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Student Admission No.</label>
                <input required type="text" value={passForm.admissionNumber} onChange={e => setPassForm({...passForm, admissionNumber: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm uppercase font-mono" placeholder="e.g. STU-0001" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Reason for Leaving</label>
                <input required type="text" value={passForm.reason} onChange={e => setPassForm({...passForm, reason: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Doctor Appointment" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Released To (Guardian)</label>
                <input required type="text" value={passForm.releasedTo} onChange={e => setPassForm({...passForm, releasedTo: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Approved By (Staff)</label>
                <input required type="text" value={passForm.approvedBy} onChange={e => setPassForm({...passForm, approvedBy: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsPassOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Authorize Exit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}