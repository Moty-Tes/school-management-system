'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { CheckCircle, X, Loader2, FolderAdd, Menu, Shield, Users, UserPlus, LogOut, Clock, Flag, Info, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function HostelPage() {
  const [data, setData] = useState<{ blocks: any[], totalAllocated: number }>({ blocks: [], totalAllocated: 0 });
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null);

  const { toast } = useToast();

  async function loadData() {
    const [hostelData, studentsData] = await Promise.all([
      api.get<any>('/api/v1/hostel'),
      api.get<any[]>('/api/v1/students')
    ]);
    setData(hostelData);
    setStudents(studentsData);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreateBlock(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/hostel/blocks', blockData);
      setIsBlockOpen(false);
      setBlockData({ name: '', wardenName: '', wardenPhone: '' });
      loadData();
      toast({
        title: 'Block created',
        description: 'The hostel block has been successfully created.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create hostel block. Please try again.',
        variant: 'destructive',
      });
    }
  }

  // Form state
  const [blockData, setBlockData] = useState({ name: '', wardenName: '', wardenPhone: '' });

  async function handleCreateRoom(e: FormEvent) {
    e.preventDefault();
    if (!selectedBlock) return;
    try {
      await api.post(`/api/v1/hostel/blocks/${selectedBlock.id}/rooms`, { ...roomData, capacity: Number(roomData.capacity) });
      setSelectedBlock(null);
      setRoomData({ roomNumber: '', capacity: 4 });
      loadData();
      toast({
        title: 'Room added',
        description: 'A new room has been added to the hostel block.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to add room. Please try again.',
        variant: 'destructive',
      });
    }
  }

  const [roomData, setRoomData] = useState({ roomNumber: '', capacity: 4 });

  async function handleAllocate(e: FormEvent) {
    e.preventDefault();
    if (!selectedBlock || !allocateData.studentId) return;
    try {
      await api.post('/api/v1/hostel/allocate', {
        ...allocateData,
        bedNumber: Number(allocateData.bedNumber),
        roomId: selectedBlock.id
      });
      setSelectedBlock(null);
      setAllocateData({ studentId: '', bedNumber: 1 });
      loadData();
      toast({
        title: 'Student allocated',
        description: 'Student has been successfully allocated to a bed.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to allocate student. Please try again.',
        variant: 'destructive',
      });
    }
  }

  const [allocateData, setAllocateData] = useState({ studentId: '', bedNumber: 1 });

  return (
    <motion.div className="min-h-screen bg-slate-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tighter">
              <Bed className="w-5 h-5 text-emerald-600 mr-2" /> Hostel & Boarding
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage dormitory rooms and student allocations</p>
          </div>

          <motion.button
            onClick={() => setIsBlockOpen(true)}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring" }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
          >
            <FolderAdd className="w-4 h-4" /> Add Hostel Block
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
        className="px-6 py-8 lg:px-12"
      >
        {/* Summary Card */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30"
          style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students Housed</p>
          <p className="text-5xl font-bold text-emerald-600 mt-2">{data.totalAllocated}</p>
        </motion.div>

        {/* BLOCKS LIST */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-8"
        >
          {data.blocks.map(block => (
            <motion.key
              key={block.id}
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40"
              style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{block.name}</h2>
                  <p className="text-sm text-slate-500">Warden: {block.wardenName} ({block.wardenPhone})</p>
                </div>

                <motion.div className="p-3 rounded-xl bg-indigo-50/50 backdrop-blur-sm">
                  <Bed className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs text-emerald-600">Hostel block</p>
                </div>
              </div>

              {/* Rooms Grid */}
              <motion.div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {block.rooms.map((room: any) => (
                  <motion.div
                    key={room.id}
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="border rounded-xl p-5 bg-slate-50 relative"
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-900">Room {room.roomNumber}</h3>
                      <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                        {room.allocations.length} / {room.capacity} Beds
                      </span>
                    </div>

                    {/* Beds Visualizer with Animation */}
                    <motion.div className="space-y-2">
                      {Array.from({ length: room.capacity }).map((_, index) => {
                        const bedNum = index + 1;
                        const allocation = room.allocations.find((a: any) => a.bedNumber === bedNum);

                        return (
                          <motion.div
                            key={bedNum}
                            initial={{ opacity: 0, y: -10, x: (index % 2 === 0 ? -10 : 10) }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            transition={{ type: "spring", stiffness: 300, delay: index * 0.03 }}
                            className={`flex items-center justify-between p-2 rounded-lg border ${
                              allocation ? 'bg-white border-indigo-200' : 'bg-slate-100 border-dashed border-slate-300'
                            }`}
                            style={{ transition: 'all 0.2s ease' }}
                          >
                            <span className="text-xs font-medium text-slate-500">Bed {bedNum}</span>
                            {allocation ? (
                              <motion.span
                                className="text-sm font-bold text-slate-900 truncate max-w-[140px]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                {allocation.student.firstName} {allocation.student.lastName}
                              </motion.span>
                            ) : (
                              <motion.button
                                onClick={() => setAllocateData({ studentId: allocation ? '' : students[0]?.id || '', bedNumber: bedNum })}
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(79, 137, 241, 0.1)' }}
                                transition={{ type: "spring" }}
                                className="text-xs font-bold text-indigo-600 hover:underline"
                              >
                                <Plus className="w-3 h-3 mr-1" /> Allocate
                              </motion.button>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            </motion.key>
          ))}
        </motion.div>

        {/* Empty state */}
        {data.blocks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-12 text-center text-slate-500"
          >
            <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
            <p>No hostel blocks found.</p>
            <p className="text-sm text-slate-400 mt-2">Create your first hostel block.</p>
          </motion.div>
        )}
      </motion.div>

      {/* CREATE BLOCK MODAL */}
      {isBlockOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          whileHover={{ opacity: 0.9 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-3xl w-full max-w-sm p-8 shadow-3xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <FolderAdd className="w-5 h-5 text-indigo-500" /> Add Hostel Block
            </h2>

            <form onSubmit={handleCreateBlock} className="space-y-5">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Block Name</label>
                <input
                  required
                  type="text"
                  value={blockData.name}
                  onChange={(e) => setBlockData({...blockData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. Boys Block A"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Warden Name</label>
                <input
                  type="text"
                  value={blockData.wardenName}
                  onChange={(e) => setBlockData({...blockData, wardenName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Warden Phone</label>
                <input
                  type="text"
                  value={blockData.wardenPhone}
                  onChange={(e) => setBlockData({...blockData, wardenPhone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </motion.div>

              <motion.div className="flex justify-end gap-3 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsBlockOpen(false)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring" }}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring" }}
                  className="px-5 py-3 text-sm font-medium bg-indigo-600 text-white rounded-xl transition-all"
                >
                  Save Block
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}