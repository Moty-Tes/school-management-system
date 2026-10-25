'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function TransportPage() {
  const [activeTab, setActiveTab] = useState<'routes' | 'vehicles' | 'assignments'>('routes');
  const [data, setData] = useState<{ routes: any[], vehicles: any[], assignments: any[] }>({ routes: [], vehicles: [], assignments: [] });
  const [students, setStudents] = useState<any[]>([]);

  // Modals
  const [isRouteOpen, setIsRouteOpen] = useState(false);
  const [isVehicleOpen, setIsVehicleOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Forms
  const [routeData, setRouteData] = useState({ name: '', description: '', fare: 0 });
  const [vehicleData, setVehicleData] = useState({ plateNumber: '', capacity: 40, driverName: '', driverPhone: '' });
  const [assignData, setAssignData] = useState({ studentId: '', routeId: '', vehicleId: '', pickupStop: '' });

  async function loadData() {
    const [transportData, studentsData] = await Promise.all([
      api.get<{ routes: any[], vehicles: any[], assignments: any[] }>('/api/v1/transport'),
      api.get<any[]>('/api/v1/students')
    ]);
    setData(transportData);
    setStudents(studentsData);

    if (transportData.routes.length > 0) setAssignData(prev => ({ ...prev, routeId: transportData.routes[0].id }));
    if (transportData.vehicles.length > 0) setAssignData(prev => ({ ...prev, vehicleId: transportData.vehicles[0].id }));
    if (studentsData.length > 0) setAssignData(prev => ({ ...prev, studentId: studentsData[0].id }));
  }

  useEffect(() => { loadData(); }, []);

  async function handleAddRoute(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/transport/routes', { ...routeData, fare: Number(routeData.fare) });
    setIsRouteOpen(false);
    loadData();
  }

  async function handleAddVehicle(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/transport/vehicles', { ...vehicleData, capacity: Number(vehicleData.capacity) });
    setIsVehicleOpen(false);
    loadData();
  }

  async function handleAssign(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/transport/assign', assignData);
      setIsAssignOpen(false);
      loadData();
      alert('Student assigned to transport successfully!');
    } catch (err: any) {
      alert(err.message); // "Vehicle is full"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transport Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage bus routes and student assignments</p>
        </div>
        <button 
          onClick={() => {
            if (activeTab === 'routes') setIsRouteOpen(true);
            if (activeTab === 'vehicles') setIsVehicleOpen(true);
            if (activeTab === 'assignments') setIsAssignOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {activeTab === 'routes' ? '+ Add Route' : activeTab === 'vehicles' ? '+ Add Vehicle' : '🚌 Assign Student'}
        </button>
      </div>

      <div className="flex gap-4 border-b">
        <button onClick={() => setActiveTab('routes')} className={`pb-2 px-2 text-sm font-medium ${activeTab === 'routes' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Routes</button>
        <button onClick={() => setActiveTab('vehicles')} className={`pb-2 px-2 text-sm font-medium ${activeTab === 'vehicles' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Vehicles</button>
        <button onClick={() => setActiveTab('assignments')} className={`pb-2 px-2 text-sm font-medium ${activeTab === 'assignments' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Assignments</button>
      </div>

      {/* ROUTES TAB */}
      {activeTab === 'routes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.routes.map(r => (
            <div key={r.id} className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">{r.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{r.description}</p>
              <p className="text-indigo-600 font-bold mt-4 font-mono">{r.fare} ETB / month</p>
            </div>
          ))}
        </div>
      )}

      {/* VEHICLES TAB */}
      {activeTab === 'vehicles' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Plate Number</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Driver</th>
                <th className="py-3 px-4">Driver Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {data.vehicles.map(v => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900">{v.plateNumber}</td>
                  <td className="py-3 px-4">{v.capacity} seats</td>
                  <td className="py-3 px-4">{v.driverName}</td>
                  <td className="py-3 px-4 font-mono">{v.driverPhone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ASSIGNMENTS TAB */}
      {activeTab === 'assignments' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Pickup Stop</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {data.assignments.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900">{a.student.firstName} {a.student.lastName}</td>
                  <td className="py-3 px-4">{a.route.name}</td>
                  <td className="py-3 px-4">{a.vehicle.plateNumber}</td>
                  <td className="py-3 px-4">{a.pickupStop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD ROUTE MODAL */}
      {isRouteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Add Transport Route</h2>
            <form onSubmit={handleAddRoute} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Route Name</label>
                <input required type="text" value={routeData.name} onChange={e => setRouteData({...routeData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Route A - Bole" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <input type="text" value={routeData.description} onChange={e => setRouteData({...routeData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Monthly Fare (ETB)</label>
                <input required type="number" value={routeData.fare} onChange={e => setRouteData({...routeData, fare: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsRouteOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD VEHICLE MODAL */}
      {isVehicleOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Add Vehicle</h2>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Plate Number</label>
                <input required type="text" value={vehicleData.plateNumber} onChange={e => setVehicleData({...vehicleData, plateNumber: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. AA-12345" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Capacity (Seats)</label>
                <input required type="number" value={vehicleData.capacity} onChange={e => setVehicleData({...vehicleData, capacity: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Driver Name</label>
                <input required type="text" value={vehicleData.driverName} onChange={e => setVehicleData({...vehicleData, driverName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Driver Phone</label>
                <input required type="text" value={vehicleData.driverPhone} onChange={e => setVehicleData({...vehicleData, driverPhone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsVehicleOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN STUDENT MODAL */}
      {isAssignOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Assign Student to Bus</h2>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Student</label>
                <select value={assignData.studentId} onChange={e => setAssignData({...assignData, studentId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Route</label>
                <select value={assignData.routeId} onChange={e => setAssignData({...assignData, routeId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {data.routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Vehicle</label>
                <select value={assignData.vehicleId} onChange={e => setAssignData({...assignData, vehicleId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {data.vehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} ({v.capacity} seats)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Pickup Stop / Area</label>
                <input required type="text" value={assignData.pickupStop} onChange={e => setAssignData({...assignData, pickupStop: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Bole Medhanialem" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsAssignOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}