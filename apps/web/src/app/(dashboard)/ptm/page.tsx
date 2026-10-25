'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';

export default function PTMPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'teacher' | 'book'>('book');
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Teacher state
  const [mySlots, setMySlots] = useState<any[]>([]);
  const [slotForm, setSlotForm] = useState({ eventId: '', startTime: '09:00', endTime: '12:00' });

  // Parent state
  const [selectedEventId, setSelectedEventId] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [bookForm, setBookForm] = useState({ slotId: '', studentId: '', notes: '' });

  // Admin state
  const [eventForm, setEventForm] = useState({ title: '', date: '' });
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  async function loadData() {
    const meData: any = await getMe();
    const isAdmin = meData.roles?.includes('TENANT_ADMIN') || meData.roles?.includes('SUPER_ADMIN');
    const isTeacher = meData.roles?.includes('TEACHER');
    const isParent = meData.roles?.includes('PARENT');

    setRole(isAdmin ? 'ADMIN' : isTeacher ? 'TEACHER' : 'PARENT');
    if (isAdmin) setActiveTab('events');
    else if (isTeacher) setActiveTab('teacher');
    else setActiveTab('book');

    const eventsData = await api.get<any[]>('/api/v1/ptm/events');
    setEvents(eventsData);
    if (eventsData.length > 0) {
      setSlotForm(prev => ({ ...prev, eventId: eventsData[0].id }));
      setSelectedEventId(eventsData[0].id);
    }

    if (isTeacher) {
      const slotsData = await api.get<any[]>('/api/v1/ptm/slots/me');
      setMySlots(slotsData);
    }

    if (isParent) {
      const childrenData = await api.get<any[]>('/api/v1/parents/my-children');
      setChildren(childrenData);
      if (childrenData.length > 0) setBookForm(prev => ({ ...prev, studentId: childrenData[0].id }));
    }

    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (activeTab === 'book' && selectedEventId) {
      api.get<any[]>(`/api/v1/ptm/slots/available?eventId=${selectedEventId}`).then(setAvailableSlots);
    }
  }, [activeTab, selectedEventId]);

  async function handleCreateEvent(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/ptm/events', eventForm);
    setIsEventModalOpen(false);
    setEventForm({ title: '', date: '' });
    loadData();
  }

  async function handleCreateSlots(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/ptm/slots', slotForm);
    alert('Time slots generated successfully!');
    loadData();
  }

  async function handleBook(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/ptm/book', bookForm);
      alert('Meeting booked successfully!');
      setBookForm({ ...bookForm, slotId: '', notes: '' });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div className="p-10 text-center">Loading PTM data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parent-Teacher Meetings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage conference schedules</p>
        </div>
        {role === 'ADMIN' && (
          <button onClick={() => setIsEventModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Create Event
          </button>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b">
        {role === 'ADMIN' && <button onClick={() => setActiveTab('events')} className={`pb-2 px-2 text-sm font-medium ${activeTab === 'events' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Events</button>}
        {role === 'TEACHER' && <button onClick={() => setActiveTab('teacher')} className={`pb-2 px-2 text-sm font-medium ${activeTab === 'teacher' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>My Schedule</button>}
        {role === 'PARENT' && <button onClick={() => setActiveTab('book')} className={`pb-2 px-2 text-sm font-medium ${activeTab === 'book' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Book a Meeting</button>}
      </div>

      {/* ADMIN TAB */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map(ev => (
            <div key={ev.id} className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">{ev.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{new Date(ev.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* TEACHER TAB */}
      {activeTab === 'teacher' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
            <h2 className="text-lg font-bold mb-4">Generate Slots</h2>
            <form onSubmit={handleCreateSlots} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Select Event</label>
                <select value={slotForm.eventId} onChange={e => setSlotForm({...slotForm, eventId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Start Time</label>
                  <input required type="time" value={slotForm.startTime} onChange={e => setSlotForm({...slotForm, startTime: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">End Time</label>
                  <input required type="time" value={slotForm.endTime} onChange={e => setSlotForm({...slotForm, endTime: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium">Generate 15-Min Slots</button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b"><h2 className="font-bold">My Bookings</h2></div>
            <div className="divide-y divide-slate-100">
              {mySlots.map(slot => (
                <div key={slot.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900">{slot.startTime} - {slot.endTime}</p>
                    <p className="text-xs text-slate-500">{slot.event.title}</p>
                  </div>
                  {slot.isBooked ? (
                    <div className="text-right">
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">Booked</span>
                      <p className="text-sm font-medium mt-1">{slot.booking.student.firstName} {slot.booking.student.lastName}</p>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs italic">Available</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PARENT TAB */}
      {activeTab === 'book' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
            <h2 className="text-lg font-bold mb-4">Book a Slot</h2>
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Select Event</label>
                <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Select Child</label>
                <select value={bookForm.studentId} onChange={e => setBookForm({...bookForm, studentId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {children.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Select Time</label>
                <select required value={bookForm.slotId} onChange={e => setBookForm({...bookForm, slotId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Choose a time...</option>
                  {availableSlots.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.startTime} - {s.teacher.user.profile?.firstName} {s.teacher.user.profile?.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Notes for Teacher</label>
                <textarea rows={2} value={bookForm.notes} onChange={e => setBookForm({...bookForm, notes: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Optional..." />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium">Confirm Booking</button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Available Teachers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableSlots.map(slot => (
                <div key={slot.id} className="p-4 border rounded-lg bg-slate-50">
                  <p className="font-bold text-slate-900">{slot.teacher.user.profile?.firstName} {slot.teacher.user.profile?.lastName}</p>
                  <p className="text-sm text-indigo-600 font-medium mt-1">{slot.startTime} - {slot.endTime}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create PTM Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Title</label>
                <input required type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Term 1 Conference" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Date</label>
                <input required type="date" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}