'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetGroup: 'ALL',
    channel: 'SMS',
  });

  async function loadData() {
    const data = await api.get<any[]>('/api/v1/broadcasts');
    setBroadcasts(data);
  }

  useEffect(() => { loadData(); }, []);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setIsSending(true);
    setMessage('');
    
    try {
      const res = await api.post<any>('/api/v1/broadcasts', formData);
      setMessage(`Successfully queued ${res.channel} broadcast to ${res.recipientCount} recipients!`);
      setFormData({ title: '', content: '', targetGroup: 'ALL', channel: 'SMS' });
      loadData();
    } catch (err) {
      setMessage('Failed to send broadcast.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Broadcast Center</h1>
        <p className="text-slate-500 text-sm mt-1">Send instant SMS or Email alerts to parents and staff</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COMPOSE FORM */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Compose Message</h2>
          
          {message && (
            <div className={`p-3 mb-4 rounded-lg text-sm ${message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Channel</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={formData.channel === 'SMS'} onChange={() => setFormData({...formData, channel: 'SMS'})} />
                  SMS (Text Message)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={formData.channel === 'EMAIL'} onChange={() => setFormData({...formData, channel: 'EMAIL'})} />
                  Email
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Send To</label>
              <select value={formData.targetGroup} onChange={e => setFormData({...formData, targetGroup: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="ALL">Everyone (All Roles)</option>
                <option value="PARENTS">All Parents</option>
                <option value="TEACHERS">All Teachers & Staff</option>
                <option value="STUDENTS">All Students</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subject / Title</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. School Closed Tomorrow" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Message Content</label>
              <textarea required rows={5} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Type your message here..." />
            </div>

            <button type="submit" disabled={isSending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg disabled:opacity-50">
              {isSending ? 'Sending Broadcast...' : '🚀 Send Broadcast Now'}
            </button>
          </form>
        </div>

        {/* HISTORY LOG */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Sent History</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {broadcasts.length === 0 ? (
              <p className="text-center text-slate-500 text-sm mt-10">No messages sent yet.</p>
            ) : (
              broadcasts.map(b => (
                <div key={b.id} className="p-4 border rounded-xl bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900">{b.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${b.channel === 'SMS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {b.channel}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3">{b.content}</p>
                  <div className="mt-3 pt-3 border-t flex justify-between items-center text-xs text-slate-500">
                    <span>To: {b.targetGroup} ({b.recipientCount} people)</span>
                    <span>{new Date(b.sentAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}