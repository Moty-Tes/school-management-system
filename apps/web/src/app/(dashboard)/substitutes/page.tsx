'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { UseToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Clock, Calendar, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { sonner } from '@/components/sonner';

export default function SubstituteManagerPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [uncovered, setUncovered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const { toast } = UseToast();

  useEffect(() => {
    // Set default date to today
    setDate(new Date());
  }, []);

  async function loadData() {
    setLoading(true);
    const formattedDate = date.toISOString().split('T')[0];
    const data = await api.get<any[]>(`/api/v1/substitutes/uncovered?date=${formattedDate}`);
    setUncovered(data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [date]);

  async function openAssignModal(slot: any) {
    setSelectedSlot(slot);
    const teachers = await api.get<any[]>(`/api/v1/substitutes/available?timetableId=${slot.id}&date=${date.toISOString().split('T')[0]}`);
    setAvailableTeachers(teachers);
  }

  async function handleAssign(coverTeacherId: string) {
    setIsAssigning(true);
    try {
      await api.post('/api/v1/substitutes/assign', {
        timetableId: selectedSlot.id,
        absentTeacherId: selectedSlot.teacherId,
        coverTeacherId,
        date: date.toISOString().split('T')[0]
      });
      setSelectedSlot(null);
      loadData(); // Refresh list
      toast({
        title: 'Success',
        description: 'Substitute assigned successfully!',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to assign substitute',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <motion.div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tighter">
                <Clock className="w-6 h-6 text-emerald-600 mr-2" /> Substitute Cover Manager
              </h1>
              <p className="text-slate-500 text-sm mt-1">Assign replacement teachers for absent staff</p>
            </div>

            <motion.div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(new Date(e.target.value))}
                  className="px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer"
                />
              </div>

              <button
                onClick={() => openAssignModal(selectedSlot ?? { id: Date.now(), teacher: { user: { profile: { firstName: '', lastName: '' } } }, subject: { name: '' }, startTime: '', endTime: '', class: { name: '', section: '' }, id: Date.now() })}
                disabled={!selectedSlot}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 flex items-center gap-2"
              >
                <Users className="w-4 h-4" /> Assign Substitute
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Uncovered Slots */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white rounded-3xl border border-slate-200 p-8 shadow-3xl shadow-slate-50/30"
          >
            <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
            <p className="text-slate-500 text-lg">Loading absences...</p>
          </motion.div>
        ) : uncovered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-emerald-50 border border-emerald-200 p-10 rounded-2xl text-center"
          >
            <h3 className="text-xl font-bold text-emerald-800 mb-2">All Classes Covered! 🎉</h3>
            <p className="text-emerald-600">There are no uncovered classes for this date.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="space-y-6"
          >
            {uncovered.map(slot => (
              <motion.div
                key={slot.id}
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="bg-white rounded-3xl border border-red-200 p-6 shadow-3xl shadow-slate-50/30 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{slot.class?.name} - {slot.class?.section}</h3>
                    <p className="text-sm text-indigo-600 font-medium">{slot.subject?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{slot.startTime} - {slot.endTime}</p>
                  </div>
                </div>

                <div className="bg-red-50 p-3 rounded-lg mb-4">
                  <p className="text-xs text-red-500 font-bold uppercase tracking-wider mb-1">Absent Teacher</p>
                  <p className="text-sm font-medium text-slate-900">{slot.teacher?.user?.profile?.firstName} {slot.teacher?.user?.profile?.lastName}</p>
                </div>

                <Button
                  onClick={() => openAssignModal(slot)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring" }}
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                >
                  <Users className="w-4 h-4 mr-2" /> Find Substitute
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ASSIGN MODAL */}
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          >
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-3xl shadow-emerald-500/20 border border-emerald-200">
              <h2 className="text-2xl font-bold mb-4">Assign Substitute</h2>
              <p className="text-sm text-slate-500 mb-6">
                Cover for <strong>{selectedSlot.teacher?.user?.profile?.firstName}</strong> during <strong>{selectedSlot.startTime} - {selectedSlot.endTime}</strong>.
              </p>

              <div className="space-y-4 max-h-80 overflow-y-auto">
                {availableTeachers.length === 0 ? (
                  <div className="p-4 bg-amber-50 text-amber-700 text-sm rounded-lg font-medium text-center">
                    No teachers are available for this specific time slot.
                  </div>
                ) : (
                  availableTeachers.map(teacher => (
                    <div
                      key={teacher.id}
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {teacher.user?.profile?.firstName[0]}{teacher.user?.profile?.lastName[0]}
                        </div>
                        <p className="font-medium text-slate-900 text-sm">{teacher.user?.profile?.firstName} {teacher.user?.profile?.lastName}</p>
                      </div>
                      <Button
                        onClick={() => handleAssign(teacher.id)}
                        disabled={isAssigning}
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Assign
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 pt-4 border-t flex justify-end">
                <Button
                  onClick={() => setSelectedSlot(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAssign(selectedSlot.coverTeacherId ?? '1')}
                  disabled={isAssigning}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  {isAssigning ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}