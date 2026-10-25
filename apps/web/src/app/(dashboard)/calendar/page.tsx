'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', startDate: '', endDate: '', type: 'GENERAL', color: '#4f46e5' });

  async function loadData() {
    setLoading(true);
    const [eventsData, meData] = await Promise.all([
      api.get<any[]>(`/api/v1/calendar?month=${currentMonth}&year=${currentYear}`),
      getMe()
    ]);
    setEvents(eventsData);
    setIsAdmin((meData as any).roles?.includes('TENANT_ADMIN') || (meData as any).roles?.includes('SUPER_ADMIN'));
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [currentMonth, currentYear]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/calendar', formData);
    setIsModalOpen(false);
    setFormData({ title: '', description: '', startDate: '', endDate: '', type: 'GENERAL', color: '#4f46e5' });
    loadData();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this event?")) return;
    await api.delete(`/api/v1/calendar/${id}`);
    loadData();
  }

  // --- CALENDAR GENERATION LOGIC ---
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  
  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalSlots = [...blanks, ...days];

  function getEventsForDay(day: number) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => {
      const start = e.startDate.split('T')[0];
      const end = e.endDate.split('T')[0];
      return dateStr >= start && dateStr <= end;
    });
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">School Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">View holidays, exams, and events</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Add Event
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">{MONTHS[currentMonth - 1]} {currentYear}</h2>
          <div className="flex gap-2">
            <button onClick={() => {
              if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
              else setCurrentMonth(m => m - 1);
            }} className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-100 text-sm font-medium">← Prev</button>
            <button onClick={() => {
              if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
              else setCurrentMonth(m => m + 1);
            }} className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-100 text-sm font-medium">Next →</button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-b bg-slate-100">
          {DAYS.map(d => <div key={d} className="p-2 text-center text-xs font-bold text-slate-500 uppercase">{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 auto-rows-fr">
          {totalSlots.map((day, index) => {
            if (day === null) return <div key={`blank-${index}`} className="p-2 border-b border-r bg-slate-50 min-h-[120px]"></div>;
            
            const dayEvents = getEventsForDay(day);
            const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() + 1 && currentYear === new Date().getFullYear();

            return (
              <div key={day} className={`p-2 border-b border-r min-h-[120px] transition-colors hover:bg-slate-50 ${isToday ? 'bg-indigo-50/30' : ''}`}>
                <div className="flex justify-between items-start">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                    {day}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {dayEvents.map(e => (
                    <div key={e.id} className="group relative">
                      <div 
                        className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded truncate cursor-pointer"
                        style={{ backgroundColor: e.color }}
                      >
                        {e.title}
                      </div>
                      {/* Tooltip for details */}
                      <div className="hidden group-hover:block absolute z-10 bottom-full mb-1 left-0 w-48 bg-slate-900 text-white text-xs p-2 rounded shadow-lg">
                        <p className="font-bold">{e.title}</p>
                        <p className="text-slate-300">{e.type}</p>
                        {e.description && <p className="mt-1 text-slate-400">{e.description}</p>}
                        {isAdmin && (
                          <button onClick={() => handleDelete(e.id)} className="mt-2 text-red-400 font-bold hover:text-red-300">Delete Event</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Add School Event</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Event Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Annual Sports Day" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Event Type</label>
                  <select value={formData.type} onChange={e => {
                    const type = e.target.value;
                    let color = '#4f46e5';
                    if (type === 'HOLIDAY') color = '#10b981';
                    if (type === 'EXAM') color = '#ef4444';
                    if (type === 'SPORTS') color = '#f59e0b';
                    if (type === 'MEETING') color = '#8b5cf6';
                    setFormData({...formData, type, color});
                  }} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="GENERAL">General</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="EXAM">Exam</option>
                    <option value="SPORTS">Sports</option>
                    <option value="MEETING">Meeting</option>
                    <option value="TRIP">Field Trip</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Color</label>
                  <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full h-10 p-1 border rounded-lg cursor-pointer" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}