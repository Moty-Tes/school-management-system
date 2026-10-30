'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { UseToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Loader2, Calendar, Shield, X, CheckCircle, AlertCircle, FolderPlus as FolderAdd, Menu, MessageCircle } from 'lucide-react';
import { sonner } from '@/components/sonner';

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

  const { toast } = UseToast();

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
    toast({
      title: 'Route added',
      description: 'Transport route has been added successfully!',
      variant: 'success',
    });
  }

  async function handleAddVehicle(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/transport/vehicles', { ...vehicleData, capacity: Number(vehicleData.capacity) });
    setIsVehicleOpen(false);
    loadData();
    toast({
      title: 'Vehicle added',
      description: 'Transport vehicle has been added successfully!',
      variant: 'success',
    });
  }

  async function handleAssign(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/transport/assign', assignData);
      setIsAssignOpen(false);
      loadData();
      toast({
        title: 'Assignment successful',
        description: 'Student assigned to transport successfully!',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to assign student to transport',
        variant: 'destructive',
      });
    }
  }

  return (
    <motion.div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
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
                <Bus className="w-6 h-6 text-emerald-600 mr-2" /> Transport Management
              </h1>
              <p className="text-slate-500 text-sm mt-1">Manage bus routes and student assignments</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                onClick={() => setActiveTab('routes')}
              >
                Routes
              </Button>
              <Button
                variant="outline"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                onClick={() => setActiveTab('vehicles')}
              >
                Vehicles
              </Button>
              <Button
                variant="primary"
                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                onClick={() => setActiveTab('assignments')}
              >
                🚌 Assign Student
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6">
          <Button
            onClick={() => setActiveTab('routes')}
            className={`py-2 px-2 text-sm font-medium ${activeTab === 'routes' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500'}`}
          >
            Routes
          </Button>
          <Button
            onClick={() => setActiveTab('vehicles')}
            className={`py-2 px-2 text-sm font-medium ${activeTab === 'vehicles' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500'}`}
          >
            Vehicles
          </Button>
          <Button
            onClick={() => setActiveTab('assignments')}
            className={`py-2 px-2 text-sm font-medium ${activeTab === 'assignments' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500'}`}
          >
            Assignments
          </Button>
        </div>

        {/* ROUTES TAB */}
        {activeTab === 'routes' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="bg-white rounded-3xl border border-slate-200 overflow-shadow-3xl shadow-slate-50/30 p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.routes.map(r => (
                <motion.div
                  key={r.id}
                  whileHover={{ y: -6, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40"
                  style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
                >
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{r.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{r.description}</p>
                    <p className="text-indigo-600 font-bold mt-4 font-mono">{r.fare} ETB / month</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* VEHICLES TAB */}
        {activeTab === 'vehicles' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="bg-white rounded-3xl border border-slate-200 overflow-shadow-3xl shadow-slate-50/30 p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              className="border-b border-slate-200 px-4 py-3"
            >
              <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Bus Fleet</h2>
            </motion.div>
            <div className="overflow-x-auto">
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
                    <motion.tr
                      key={v.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                      className="hover:bg-slate-50"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900">{v.plateNumber}</td>
                      <td className="py-3 px-4">{v.capacity} seats</td>
                      <td className="py-3 px-4">{v.driverName}</td>
                      <td className="py-3 px-4 font-mono">{v.driverPhone}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ASSIGNMENTS TAB */}
        {activeTab === 'assignments' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="bg-white rounded-3xl border border-slate-200 overflow-shadow-3xl shadow-slate-50/30 p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              className="border-b border-slate-200 px-4 py-3"
            >
              <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Student Assignments</h2>
            </motion.div>
            <div className="overflow-x-auto">
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
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0, y: -10, x: -20 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                      className="hover:bg-slate-50"
                    >
                      <td className="py-3 px-4 font-medium text-slate-900">{a.student?.firstName} {a.student?.lastName}</td>
                      <td className="py-3 px-4">{a.route?.name}</td>
                      <td className="py-3 px-4">{a.vehicle?.plateNumber}</td>
                      <td className="py-3 px-4">{a.pickupStop}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ADD ROUTE MODAL */}
        {isRouteOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          >
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-3xl shadow-emerald-500/20 border border-emerald-200">
              <h2 className="text-2xl font-bold mb-4">Add Transport Route</h2>
              <form onSubmit={handleAddRoute} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Route Name</label>
                  <input
                    required
                    type="text"
                    value={routeData.name}
                    onChange={e => setRouteData({...routeData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="e.g. Route A - Bole"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={routeData.description}
                    onChange={e => setRouteData({...routeData, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Fare (ETB)</label>
                  <input
                    required
                    type="number"
                    value={routeData.fare}
                    onChange={e => setRouteData({...routeData, fare: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    onClick={() => setIsRouteOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Save
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* ADD VEHICLE MODAL */}
        {isVehicleOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          >
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-3xl shadow-emerald-500/20 border border-emerald-200">
              <h2 className="text-2xl font-bold mb-4">Add Vehicle</h2>
              <form onSubmit={handleAddVehicle} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plate Number</label>
                  <input
                    required
                    type="text"
                    value={vehicleData.plateNumber}
                    onChange={e => setVehicleData({...vehicleData, plateNumber: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="e.g. AA-12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capacity (Seats)</label>
                  <input
                    required
                    type="number"
                    value={vehicleData.capacity}
                    onChange={e => setVehicleData({...vehicleData, capacity: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver Name</label>
                  <input
                    required
                    type="text"
                    value={vehicleData.driverName}
                    onChange={e => setVehicleData({...vehicleData, driverName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver Phone</label>
                  <input
                    required
                    type="text"
                    value={vehicleData.driverPhone}
                    onChange={e => setVehicleData({...vehicleData, driverPhone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    onClick={() => setIsVehicleOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Save
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* ASSIGN STUDENT MODAL */}
        {isAssignOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          >
            <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-3xl shadow-emerald-500/20 border border-emerald-200">
              <h2 className="text-2xl font-bold mb-4">Assign Student to Bus</h2>
              <form onSubmit={handleAssign} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
                  <select
                    value={assignData.studentId}
                    onChange={e => setAssignData({...assignData, studentId: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Route</label>
                  <select
                    value={assignData.routeId}
                    onChange={e => setAssignData({...assignData, routeId: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer"
                  >
                    {data.routes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle</label>
                  <select
                    value={assignData.vehicleId}
                    onChange={e => setAssignData({...assignData, vehicleId: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer"
                  >
                    {data.vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} ({v.capacity} seats)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pickup Stop / Area</label>
                  <input
                    required
                    type="text"
                    value={assignData.pickupStop}
                    onChange={e => setAssignData({...assignData, pickupStop: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="e.g. Bole Medhanialem"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    onClick={() => setIsAssignOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Assign
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}