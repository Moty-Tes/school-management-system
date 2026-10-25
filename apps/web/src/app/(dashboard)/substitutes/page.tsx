'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function SubstituteManagerPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [uncovered, setUncovered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  async function loadData() {
    setLoading(true);
    const data = await api.get<any[]>(`/api/v1/substitutes/uncovered?date=${date}`);
    setUncovered(data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [date]);

  async function openAssignModal(slot: any) {
    setSelectedSlot(slot);
    const teachers = await api.get<any[]>(`/api/v1/substitutes/available?timetableId=${slot.id}&date=${date}`);
    setAvailableTeachers(teachers);
  }

  async function handleAssign(coverTeacherId: string) {
    setIsAssigning(true);
    try {
      await api.post('/api/v1/substitutes/assign', {
        timetableId: selectedSlot.id,
        absentTeacherId: selectedSlot.teacherId,
        coverTeacherId,
        date
      });
      setSelectedSlot(null);
      loadData(); // Refresh list
    } catch (err) {
      alert('Failed to assign substitute');
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Substitute Cover Manager</h1>
          <p className="text-slate-500 text-sm mt-1">Assign replacement teachers for absent staff</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Select Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm font-mono" />
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center">Loading absences...</div>
      ) : uncovered.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 p-10 rounded-2xl text-center">
          <h3 className="text-xl font-bold text-emerald-800 mb-2">All Classes Covered! 🎉</h3>
          <p className="text-emerald-600">There are no uncovered classes for this date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {uncovered.map(slot => (
            <div key={slot.id} className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{slot.class.name} - {slot.class.section}</h3>
                  <p className="text-sm text-indigo-600 font-medium">{slot.subject.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{slot.startTime} - {slot.endTime}</p>
                </div>
              </div>

              <div className="bg-red-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-red-500 font-bold uppercase tracking-wider mb-1">Absent Teacher</p>
                <p className="text-sm font-medium text-slate-900">{slot.teacher.user.profile?.firstName} {slot.teacher.user.profile?.lastName}</p>
              </div>

              <button onClick={() => openAssignModal(slot)} className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                Find Substitute
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ASSIGN MODAL */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-2">Assign Substitute</h2>
            <p className="text-sm text-slate-500 mb-6">
              Cover for <strong>{selectedSlot.teacher.user.profile?.firstName}</strong> during <strong>{selectedSlot.startTime} - {selectedSlot.endTime}</strong>.
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {availableTeachers.length === 0 ? (
                <div className="p-4 bg-amber-50 text-amber-700 text-sm rounded-lg font-medium text-center">
                  No teachers are available for this specific time slot.
                </div>
              ) : (
                availableTeachers.map(teacher => (
                  <div key={teacher.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {teacher.user.profile?.firstName[0]}{teacher.user.profile?.lastName[0]}
                      </div>
                      <p className="font-medium text-slate-900 text-sm">{teacher.user.profile?.firstName} {teacher.user.profile?.lastName}</p>
                    </div>
                    <button 
                      onClick={() => handleAssign(teacher.id)} 
                      disabled={isAssigning}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end">
              <button onClick={() => setSelectedSlot(null)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}