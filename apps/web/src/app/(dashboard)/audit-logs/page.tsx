'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  async function loadData() {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (actionFilter !== 'ALL') query.append('action', actionFilter);
      
      const data = await api.get<any[]>(`/api/v1/audit?${query.toString()}`);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Debounce search slightly so we don't spam the API on every keystroke
    const timer = setTimeout(() => { loadData(); }, 300);
    return () => clearTimeout(timer);
  }, [search, actionFilter]);

  function getActionColor(action: string) {
    if (action.includes('CREATE') || action.includes('PAID')) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (action.includes('DELETE') || action.includes('REJECT')) return 'text-red-600 bg-red-50 border-red-200';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security & Audit Logs</h1>
        <p className="text-slate-500 text-sm mt-1">Track every action performed in the system</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            placeholder="Search by user name or action details..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select 
          value={actionFilter} 
          onChange={e => setActionFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm bg-slate-50 font-medium"
        >
          <option value="ALL">All Actions</option>
          <option value="RECORD_PAYMENT">Payments Recorded</option>
          <option value="SAVE_GRADES">Grades Modified</option>
          <option value="CREATE_STUDENT">Students Created</option>
          <option value="DELETE_STUDENT">Students Deleted</option>
        </select>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : logs.length === 0 ? (
          <p className="text-center text-slate-500 py-10">No activity logs found matching your criteria.</p>
        ) : (
          <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
            {logs.map((log) => (
              <div key={log.id} className="relative pl-6">
                {/* Timeline Dot */}
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-indigo-500 rounded-full border-4 border-white shadow"></div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-slate-900">
                        {log.user.profile?.firstName} {log.user.profile?.lastName}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{log.details}</p>
                    <p className="text-xs text-slate-400 mt-1">Entity: {log.entity} | IP: Internal</p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}