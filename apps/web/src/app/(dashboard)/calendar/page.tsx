'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Calendar, Plus, Trash, X } from 'lucide-react';

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
  const [formData, setFormData] = useState({ title: '', description: '', startDate: '', endDate: '', type: 'GENERAL', color: '#1976d2' });

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
    showSuccessToast('Event created successfully!');
    setIsModalOpen(false);
    setFormData({ title: '', description: '', startDate: '', endDate: '', type: 'GENERAL', color: '#1976d2' });
    loadData();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this event?")) return;
    await api.delete(`/api/v1/calendar/${id}`);
    showSuccessToast('Event deleted!');
    loadData();
  }

  // --- Calendar Generation Logic ---
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
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

  // --- Color mapping for event types ---
  function getColorForType(type: string) {
    const colors: Record<string, string> = {
      GENERAL: '#1976d2',
      HOLIDAY: '#10b981',
      EXAM: '#ef4444',
      SPORTS: '#f59e0b',
      MEETING: '#8b5cf6',
      TRIP: '#059669',
    };
    return colors[type] || '#1976d2';
  }

  // --- Toast & Feedback System ---
  function showSuccessToast(message: string) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-3';
    toastContainer.innerHTML = `
      <div className="bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-emerald-500/20 transform translate-y-0 transition-transform duration-500 ease-out">
        <svg className="w-5 h-5 -mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastContainer);

    setTimeout(() => {
      toastContainer.querySelector('div')!.className = 'bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-emerald-500/20 transform translate-y-0 transition-transform duration-500 ease-out';
    }, 10);

    setTimeout(() => {
      toastContainer.style.transform = 'translateY(-100%)';
      toastContainer.style.opacity = '0';
      setTimeout(() => toastContainer.remove(), 300);
    }, 3000);
  }

  function showErrorToast(message: string) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-3';
    toastContainer.innerHTML = `
      <div className="bg-red-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-red-500/20 transform translate-y-0 transition-transform duration-500 ease-out">
        <svg className="w-5 h-5 -mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116 21H8a2 2 0 01-2-1.858L5 7"></path></svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastContainer);

    setTimeout(() => {
      toastContainer.style.transform = 'translateY(-100%)';
      toastContainer.style.opacity = '0';
      setTimeout(() => toastContainer.remove(), 300);
    }, 3000);
  }

  return (
    <motion.div className="space-y-6 max-w-7xl mx-auto px-4">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">School Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">View holidays, exams, and events</p>
        </div>

        {isAdmin && (
          <motion.button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Event
          </motion.button>
        )}
      </motion.div>

      {/* Calendar Component */}
      <motion.div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl" style={{ transition: 'all 0.3s ease' }}>

        {/* Calendar Header with animated navigation */}
        <motion.div
          className="p-4 border-b bg-slate-50 flex justify-between items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-slate-900">
            {MONTHS[currentMonth - 1]} {currentYear}
          </h2>
          <div className="flex gap-2">
            <motion.button
              onClick={() => {
                if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(y => y - 1); }
                else setCurrentMonth(m => m - 1);
              }}
              className="px-4 py-2 border rounded-lg bg-white hover:bg-slate-100 text-sm font-medium transition-colors"
              whileHover={{ background: '#f1f5f9' }}
            >
              ← Prev
            </motion.button>
            <motion.button
              onClick={() => {
                if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(y => y + 1); }
                else setCurrentMonth(m => m + 1);
              }}
              className="px-4 py-2 border rounded-lg bg-white hover:bg-slate-100 text-sm font-medium transition-colors"
              whileHover={{ background: '#f1f5f9' }}
            >
              Next →
            </motion.button>
          </div>
        </motion.div>

        {/* Calendar Grid with beautiful animated days */}
        <motion.div className="grid grid-cols-7 border-b bg-slate-100">
          {DAYS.map(d => (
            <motion.div
              key={d}
              className="p-2 text-center text-xs font-bold text-slate-500 uppercase"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, delay: DAYS.indexOf(d) * 0.05 }}
            >
              {d}
            </motion.div>
          ))}
        </motion.div>

        {/* Calendar Days with events */}
        <motion.div className="grid grid-cols-7 auto-rows-fr gap-2" style={{ transition: 'all 0.3s ease' }}>
          {totalSlots.map((day, index) => {
            if (day === null) return (
              <motion.div
                key={`blank-${index}`}
                className="p-2 border-b border-r bg-slate-50 min-h-[120px]"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            );

            const dayEvents = getEventsForDay(day);
            const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() + 1 && currentYear === new Date().getFullYear();

            return (
              <motion.div
                key={day}
                className={`p-2 border-b border-r min-h-[120px] rounded-lg transition-all duration-300 ease-out ${
                  isToday ? 'bg-indigo-50/30' : 'bg-white'
                }`}
                whileHover={{ transform: 'translateY(-4)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
              >
                <div className="flex justify-between items-start">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                    isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'
                  }`}>
                    {day}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {dayEvents.map((e, eIdx) => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: eIdx * 0.05 }}
                      className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded cursor-pointer"
                      style={{ backgroundColor: e.color }}
                    >
                      {e.title}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* CREATE EVENT MODAL */}
      {isModalOpen && (
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
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m6 4h12m0 0l-4 4m4-4l-4-4m0-6H4"></path>
              </svg>
              Add School Event
            </h2>

            <form onSubmit={handleCreate} className="space-y-5">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Event Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. Annual Sports Day"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </motion.div>

              <motion.div className="grid grid-cols-2 gap-4">
                <motion.div>
                  <label className="block text-sm font-medium mb-1">Event Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      let color = '#1976d2';
                      if (type === 'HOLIDAY') color = '#10b981';
                      if (type === 'EXAM') color = '#ef4444';
                      if (type === 'SPORTS') color = '#f59e0b';
                      if (type === 'MEETING') color = '#8b5cf6';
                      setFormData({...formData, type, color});
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
                  >
                    <option value="GENERAL">General</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="EXAM">Exam</option>
                    <option value="SPORTS">Sports</option>
                    <option value="MEETING">Meeting</option>
                    <option value="TRIP">Field Trip</option>
                  </select>
                </motion.div>

                <motion.div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-full h-10 p-1 border rounded-lg cursor-pointer bg-slate-50"
                  />
                </motion.div>
              </motion.div>

              <motion.div className="flex justify-end gap-3 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="px-5 py-3 text-sm font-medium bg-primary-600 text-white rounded-xl transition-all"
                >
                  Save Event
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}