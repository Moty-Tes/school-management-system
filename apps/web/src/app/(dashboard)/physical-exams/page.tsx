'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function PhysicalExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [seatingPlan, setSeatingPlan] = useState<any>(null);

  // Forms
  const [roomForm, setRoomForm] = useState({ name: '', capacity: 40 });
  const [examForm, setExamForm] = useState({ title: '', date: '', startTime: '09:00', endTime: '11:00', classIds: [] as string[] });

  async function loadData() {
    const [examsData, roomsData, classesData] = await Promise.all([
      api.get<any[]>('/api/v1/exams/schedules'),
      api.get<any[]>('/api/v1/exams/rooms'),
      api.get<any[]>('/api/v1/classes')
    ]);
    setExams(examsData);
    setRooms(roomsData);
    setClasses(classesData);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreateRoom(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/exams/rooms', { ...roomForm, capacity: Number(roomForm.capacity) });
    setIsRoomOpen(false);
    setRoomForm({ name: '', capacity: 40 });
    loadData();
  }

  async function handleCreateExam(e: FormEvent) {
    e.preventDefault();
    if (examForm.classIds.length === 0) return alert("Select at least one class");
    await api.post('/api/v1/exams/schedules', examForm);
    setIsExamOpen(false);
    setExamForm({ title: '', date: '', startTime: '09:00', endTime: '11:00', classIds: [] });
    loadData();
  }

  async function generateSeating(examId: string) {
    if (!window.confirm("Generate seating plan? This will randomly assign students to rooms and seats.")) return;
    try {
      await api.post(`/api/v1/exams/${examId}/generate-seating`);
      alert('Seating plan generated successfully!');
      loadData();
    } catch (err: any) {
      alert(err.message); // "Already generated" or "Not enough seats"
    }
  }

  async function viewSeating(examId: string) {
    const data = await api.get<any>(`/api/v1/exams/${examId}/seating`);
    setSeatingPlan(data);
  }

  function toggleClass(id: string) {
    setExamForm(prev => {
      const exists = prev.classIds.includes(id);
      if (exists) return { ...prev, classIds: prev.classIds.filter(c => c !== id) };
      return { ...prev, classIds: [...prev.classIds, id] };
    });
  }

  if (loading) return <div className="p-10 text-center">Loading exam data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Physical Exam Scheduler</h1>
          <p className="text-slate-500 text-sm mt-1">Manage exam rooms and generate seating plans</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsRoomOpen(true)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">+ Add Room</button>
          <button onClick={() => setIsExamOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Schedule Exam</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Rooms</p>
          <p className="text-3xl font-bold mt-2 text-slate-900">{rooms.length}</p>
          <p className="text-sm text-slate-500 mt-1">Total Capacity: {rooms.reduce((s, r) => s + r.capacity, 0)} seats</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="py-3 px-4">Exam Title</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Classes</th>
              <th className="py-3 px-4">Seats</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {exams.map(e => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-medium text-slate-900">{e.title}</td>
                <td className="py-3 px-4 text-slate-600">{new Date(e.date).toLocaleDateString()} ({e.startTime} - {e.endTime})</td>
                <td className="py-3 px-4 text-slate-600">{e.classIds.length} Classes</td>
                <td className="py-3 px-4">
                  {e._count.seats > 0 ? (
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">{e._count.seats} Assigned</span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">Pending</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right space-x-3">
                  {e._count.seats === 0 ? (
                    <button onClick={() => generateSeating(e.id)} className="text-indigo-600 font-bold text-xs hover:underline">Generate Seating</button>
                  ) : (
                    <button onClick={() => viewSeating(e.id)} className="text-slate-900 font-bold text-xs hover:underline">View Plan</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE ROOM MODAL */}
      {isRoomOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Add Exam Room</h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Room Name</label>
                <input required type="text" value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Main Hall" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Capacity (Seats)</label>
                <input required type="number" min="1" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsRoomOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE EXAM MODAL */}
      {isExamOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Schedule Exam</h2>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Exam Title</label>
                <input required type="text" value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Grade 10 Midterm - Math" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Date</label>
                  <input required type="date" value={examForm.date} onChange={e => setExamForm({...examForm, date: e.target.value})} className="w-full px-2 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Start</label>
                  <input required type="time" value={examForm.startTime} onChange={e => setExamForm({...examForm, startTime: e.target.value})} className="w-full px-2 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">End</label>
                  <input required type="time" value={examForm.endTime} onChange={e => setExamForm({...examForm, endTime: e.target.value})} className="w-full px-2 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2">Select Participating Classes</label>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-2">
                  {classes.map(c => (
                    <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer text-sm">
                      <input type="checkbox" checked={examForm.classIds.includes(c.id)} onChange={() => toggleClass(c.id)} className="w-4 h-4 text-indigo-600" />
                      {c.name} - {c.section}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsExamOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW SEATING PLAN MODAL */}
      {seatingPlan && (
        <div className="fixed inset-0 bg-black/50 flex flex-col z-50 p-4 sm:p-10 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-5xl mx-auto p-6 my-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Exam Seating Plan</h2>
                <p className="text-sm text-slate-500">Students are mixed across rooms to prevent cheating.</p>
              </div>
              <button onClick={() => setSeatingPlan(null)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">Close</button>
            </div>

            <div className="space-y-8">
              {Object.keys(seatingPlan).map(roomName => (
                <div key={roomName} className="border rounded-xl overflow-hidden">
                  <div className="bg-slate-100 p-4 border-b">
                    <h3 className="font-bold text-slate-900">{roomName}</h3>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white border-b text-xs font-semibold text-slate-500 uppercase">
                      <tr><th className="p-3">Seat No</th><th className="p-3">Student Name</th><th className="p-3">Class</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {seatingPlan[roomName].map((seat: any) => (
                        <tr key={seat.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-indigo-600">#{seat.seatNumber}</td>
                          <td className="p-3 font-medium text-slate-900">{seat.student.firstName} {seat.student.lastName}</td>
                          <td className="p-3 text-slate-500">{seat.student.class?.name} {seat.student.class?.section}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}