'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function PromotionsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [sourceClassId, setSourceClassId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [isGraduation, setIsGraduation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  async function loadData() {
    const classesData = await api.get<any[]>('/api/v1/classes');
    setClasses(classesData);
    if (classesData.length > 0) {
      setSourceClassId(classesData[0].id);
      if (classesData.length > 1) setTargetClassId(classesData[1].id);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handlePromote(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    
    const confirmMsg = isGraduation 
      ? "Are you sure? This will mark all students in this class as GRADUATED and remove them from the roster."
      : "Are you sure? This will move all students from the source class to the target class.";
      
    if (!window.confirm(confirmMsg)) return;

    setIsProcessing(true);
    try {
      const res = await api.post<any>('/api/v1/students/promote', {
        sourceClassId,
        targetClassId: isGraduation ? null : targetClassId,
        isGraduation
      });
      setMessage(`Successfully ${res.action.toLowerCase()} ${res.count} students!`);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">End of Year Promotion</h1>
        <p className="text-slate-500 text-sm mt-1">Move students to the next grade or graduate them</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm font-bold ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <form onSubmit={handlePromote} className="space-y-6">
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
            <p className="text-sm text-amber-800 font-medium">
              ⚠️ <strong>Important:</strong> This is a bulk action. It will move every active student in the selected class.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">From Class (Current)</label>
              <select value={sourceClassId} onChange={e => setSourceClassId(e.target.value)} className="w-full px-4 py-3 border rounded-xl text-sm font-medium">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
              </select>
            </div>

            <div className="flex justify-center text-slate-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
            </div>

            <div className={isGraduation ? 'opacity-50 pointer-events-none' : ''}>
              <label className="block text-sm font-bold text-slate-700 mb-2">To Class (Next Year)</label>
              <select value={targetClassId} onChange={e => setTargetClassId(e.target.value)} className="w-full px-4 py-3 border rounded-xl text-sm font-medium">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t pt-6">
            <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input type="checkbox" checked={isGraduation} onChange={e => setIsGraduation(e.target.checked)} className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-bold text-slate-900">This is a Graduating Class</p>
                <p className="text-xs text-slate-500">Check this if they are finishing Grade 12 and leaving the school.</p>
              </div>
            </label>
          </div>

          <button type="submit" disabled={isProcessing} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-sm disabled:opacity-50 transition-colors">
            {isProcessing ? 'Processing Rollover...' : isGraduation ? 'Graduate All Students' : 'Promote All Students'}
          </button>
        </form>
      </div>
    </div>
  );
}