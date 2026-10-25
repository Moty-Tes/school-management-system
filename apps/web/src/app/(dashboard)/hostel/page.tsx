'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function HostelPage() {
  const [data, setData] = useState<{ blocks: any[], totalAllocated: number }>({ blocks: [], totalAllocated: 0 });
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isRoomOpen, setIsRoomOpen] = useState<any>(null);
  const [isAllocateOpen, setIsAllocateOpen] = useState<any>(null);

  // Forms
  const [blockData, setBlockData] = useState({ name: '', wardenName: '', wardenPhone: '' });
  const [roomData, setRoomData] = useState({ roomNumber: '', capacity: 4 });
  const [allocateData, setAllocateData] = useState({ studentId: '', bedNumber: 1 });

  async function loadData() {
    const [hostelData, studentsData] = await Promise.all([
      api.get<any>('/api/v1/hostel'),
      api.get<any[]>('/api/v1/students')
    ]);
    setData(hostelData);
    setStudents(studentsData);
    if (studentsData.length > 0) setAllocateData(prev => ({ ...prev, studentId: studentsData[0].id }));
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreateBlock(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/hostel/blocks', blockData);
    setIsBlockOpen(false);
    setBlockData({ name: '', wardenName: '', wardenPhone: '' });
    loadData();
  }

  async function handleCreateRoom(e: FormEvent) {
    e.preventDefault();
    await api.post(`/api/v1/hostel/blocks/${isRoomOpen.id}/rooms`, { ...roomData, capacity: Number(roomData.capacity) });
    setIsRoomOpen(null);
    setRoomData({ roomNumber: '', capacity: 4 });
    loadData();
  }

  async function handleAllocate(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/hostel/allocate', { ...allocateData, bedNumber: Number(allocateData.bedNumber), roomId: isAllocateOpen.id });
      setIsAllocateOpen(null);
      loadData();
      alert('Student allocated successfully!');
    } catch (err: any) {
      alert(err.message); // "Bed already taken" or "Room full"
    }
  }

  if (loading) return <div className="p-10 text-center">Loading hostel data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hostel & Boarding</h1>
          <p className="text-slate-500 text-sm mt-1">Manage dormitory rooms and student allocations</p>
        </div>
        <button onClick={() => setIsBlockOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add Hostel Block
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students Housed</p>
          <p className="text-3xl font-bold mt-2 text-emerald-400">{data.totalAllocated}</p>
        </div>
      </div>

      {/* BLOCKS LIST */}
      {data.blocks.map(block => (
        <div key={block.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{block.name}</h2>
              <p className="text-sm text-slate-500">Warden: {block.wardenName} ({block.wardenPhone})</p>
            </div>
            <button onClick={() => setIsRoomOpen(block)} className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50">
              + Add Room
            </button>
          </div>
          
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {block.rooms.map((room: any) => (
              <div key={room.id} className="border rounded-xl p-4 bg-slate-50 relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900">Room {room.roomNumber}</h3>
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                    {room.allocations.length} / {room.capacity} Beds
                  </span>
                </div>
                
                {/* Beds Visualizer */}
                <div className="space-y-2">
                  {Array.from({ length: room.capacity }).map((_, index) => {
                    const bedNum = index + 1;
                    const allocation = room.allocations.find((a: any) => a.bedNumber === bedNum);
                    
                    return (
                      <div key={bedNum} className={`flex items-center justify-between p-2 rounded-lg border ${allocation ? 'bg-white border-indigo-200' : 'bg-slate-100 border-dashed border-slate-300'}`}>
                        <span className="text-xs font-medium text-slate-500">Bed {bedNum}</span>
                        {allocation ? (
                          <span className="text-sm font-bold text-slate-900 truncate max-w-[120px]">
                            {allocation.student.firstName} {allocation.student.lastName}
                          </span>
                        ) : (
                          <button onClick={() => setIsAllocateOpen({ ...room, bedNumber: bedNum })} className="text-xs font-bold text-indigo-600 hover:underline">
                            Allocate
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {block.rooms.length === 0 && <p className="text-sm text-slate-500 col-span-full">No rooms created yet.</p>}
          </div>
        </div>
      ))}

      {/* CREATE BLOCK MODAL */}
      {isBlockOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Add Hostel Block</h2>
            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Block Name</label>
                <input required type="text" value={blockData.name} onChange={e => setBlockData({...blockData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Boys Block A" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Warden Name</label>
                <input type="text" value={blockData.wardenName} onChange={e => setBlockData({...blockData, wardenName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Warden Phone</label>
                <input type="text" value={blockData.wardenPhone} onChange={e => setBlockData({...blockData, wardenPhone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsBlockOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save Block</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ROOM MODAL */}
      {isRoomOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Add Room to {isRoomOpen.name}</h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Room Number</label>
                <input required type="text" value={roomData.roomNumber} onChange={e => setRoomData({...roomData, roomNumber: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. 101" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Capacity (Beds)</label>
                <input required type="number" min="1" value={roomData.capacity} onChange={e => setRoomData({...roomData, capacity: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsRoomOpen(null)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALLOCATE MODAL */}
      {isAllocateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Allocate Student</h2>
            <p className="text-sm text-slate-500 mb-4">Room {isAllocateOpen.roomNumber} - Bed {isAllocateOpen.bedNumber}</p>
            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Select Student</label>
                <select value={allocateData.studentId} onChange={e => setAllocateData({...allocateData, studentId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsAllocateOpen(null)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Assign Bed</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}