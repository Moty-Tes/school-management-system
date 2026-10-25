'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class?: { name: string, section: string };
}

export default function ParentPortal() {
  const [children, setChildren] = useState<Student[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [studentClubs, setStudentClubs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]); // <-- NEW: Invoices state
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<Student | null>(null);

  // Top up state
  const [topUpAmount, setTopUpAmount] = useState(100);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  async function loadChildData(childId: string) {
    // Fetch everything about the child in parallel
    const [walletData, logsData, clubsData, invoicesData] = await Promise.all([
      api.get(`/api/v1/cafeteria/wallet/${childId}`),
      api.get(`/api/v1/dailylogs/student/${childId}`),
      api.get(`/api/v1/clubs/student/${childId}`),
      api.get(`/api/v1/finance/invoices?studentId=${childId}`) // <-- NEW: Fetch invoices for this specific child
    ]);
    setWallet(walletData);
    setDailyLogs(logsData);
    setStudentClubs(clubsData);
    setInvoices(invoicesData);
  }

  async function loadData() {
    try {
      const childrenData = await api.get<Student[]>('/api/v1/parents/my-children');
      setChildren(childrenData);
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
        await loadChildData(childrenData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleChildChange(childId: string) {
    const child = children.find(c => c.id === childId) || null;
    setSelectedChild(child);
    if (child) await loadChildData(child.id);
  }

  async function handleTopUp() {
    if (!selectedChild) return;
    try {
      await api.post('/api/v1/cafeteria/wallet/topup', { studentId: selectedChild.id, amount: topUpAmount });
      setIsTopUpOpen(false);
      alert('Wallet topped up successfully!');
      await loadChildData(selectedChild.id);
    } catch (err) {
      alert('Failed to top up wallet');
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading portal...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parent Portal</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor your children's daily school life</p>
        </div>
        {children.length > 1 && (
          <select onChange={e => handleChildChange(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" value={selectedChild?.id}>
            {children.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
          </select>
        )}
      </div>

      {children.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-slate-500">No students linked to your account.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Profile, Wallet, & Invoices */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Profile Card */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                  {selectedChild?.firstName[0]}{selectedChild?.lastName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedChild?.firstName} {selectedChild?.lastName}</h2>
                  <p className="text-xs text-slate-500 font-mono">{selectedChild?.admissionNumber}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Class</span>
                  <span className="font-medium">{selectedChild?.class ? `${selectedChild?.class.name} - ${selectedChild?.class.section}` : 'Unassigned'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Status</span>
                  <span className="font-medium text-emerald-600">Active</span>
                </div>
              </div>
            </div>

            {/* Wallet Card */}
            <div className="bg-slate-900 p-6 rounded-xl shadow-lg text-white">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cafeteria Wallet</p>
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
              </div>
              <p className="text-3xl font-bold">{wallet ? Number(wallet.balance).toLocaleString() : '0'} <span className="text-sm text-slate-400">ETB</span></p>
              <button onClick={() => setIsTopUpOpen(true)} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors">
                + Top Up
              </button>
            </div>

            {/* Tuition Invoices */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Tuition Invoices</h3>
              <div className="space-y-3">
                {invoices.filter((i: any) => i.status !== 'PAID').length === 0 ? (
                  <p className="text-sm text-emerald-600 font-medium">All fees are fully paid! 🎉</p>
                ) : (
                  invoices.filter((i: any) => i.status !== 'PAID').map((inv: any) => (
                    <div key={inv.id} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-slate-900 text-sm">{inv.title}</p>
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">{inv.status}</span>
                      </div>
                      <p className="text-lg text-red-600 font-bold mb-3">{Number(inv.amount).toLocaleString()} ETB</p>
                      <button 
                        onClick={() => alert('This will connect to Telebirr/Chapa in production.')}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700"
                      >
                        Pay Now
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Clubs */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Clubs & Activities</h3>
              <div className="space-y-3">
                {studentClubs.length === 0 ? <p className="text-sm text-slate-500">Not enrolled in any clubs.</p> : 
                  studentClubs.map((sc: any) => (
                    <div key={sc.id} className="p-3 border rounded-lg bg-indigo-50/50 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{sc.club.name}</p>
                        <p className="text-[10px] text-slate-500">Advisor: {sc.club.advisorName}</p>
                      </div>
                      <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{sc.role}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Daily Diary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                📖 Daily School Diary
              </h3>
              
              {dailyLogs.length === 0 ? (
                <p className="text-sm text-slate-500">No diary entries yet.</p>
              ) : (
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
                  {dailyLogs.map((log: any) => (
                    <div key={log.id} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-indigo-500 rounded-full border-4 border-white shadow"></div>
                      
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-sm font-bold text-slate-900">
                            {new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          </p>
                          <span className="text-xs text-slate-400">Logged by {log.teacher.user.profile.firstName}</span>
                        </div>
                        
                        <div className="flex gap-4 mb-3">
                          <div className="bg-white px-3 py-1.5 rounded-lg border text-xs shadow-sm">
                            <span className="text-slate-400">Mood:</span> <span className="font-bold text-slate-900">{log.mood}</span>
                          </div>
                          <div className="bg-white px-3 py-1.5 rounded-lg border text-xs shadow-sm">
                            <span className="text-slate-400">Appetite:</span> <span className="font-bold text-slate-900">{log.appetite}</span>
                          </div>
                          <div className="bg-white px-3 py-1.5 rounded-lg border text-xs shadow-sm">
                            <span className="text-slate-400">Participation:</span> <span className="font-bold text-slate-900">{log.participation}</span>
                          </div>
                        </div>

                        {log.homework && (
                          <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg mb-3">
                            <p className="text-xs font-bold text-amber-800 mb-1">📚 Homework:</p>
                            <p className="text-sm text-amber-900">{log.homework}</p>
                          </div>
                        )}

                        {log.notes && (
                          <p className="text-sm text-slate-600 italic">"{log.notes}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOP UP MODAL */}
      {isTopUpOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Top Up Wallet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Amount (ETB)</label>
                <input type="number" value={topUpAmount} onChange={e => setTopUpAmount(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-lg font-mono" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsTopUpOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button onClick={handleTopUp} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Confirm Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}