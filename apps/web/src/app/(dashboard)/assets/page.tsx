'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assignAsset, setAssignAsset] = useState<any>(null);
  const [maintenanceAsset, setMaintenanceAsset] = useState<any>(null);

  // Forms
  const [formData, setFormData] = useState({ name: '', category: 'IT Equipment', serialNumber: '', purchaseDate: '', purchasePrice: 0 });
  const [assignData, setAssignData] = useState({ userId: '', location: '' });
  const [maintenanceData, setMaintenanceData] = useState({ description: '', cost: 0 });

  async function loadData() {
    const [assetsData, statsData, usersData] = await Promise.all([
      api.get<any[]>('/api/v1/assets'),
      api.get<any>('/api/v1/assets/stats'),
      api.get<any[]>('/api/v1/teachers') // Assuming we can assign to teachers/admins
    ]);
    setAssets(assetsData);
    setStats(statsData);
    
    // Map teachers to a flat user list
    const flatUsers = usersData.map((t: any) => ({
      id: t.user.id,
      name: `${t.user.profile?.firstName} ${t.user.profile?.lastName}`
    }));
    setUsers(flatUsers);
    if (flatUsers.length > 0) setAssignData(prev => ({ ...prev, userId: flatUsers[0].id }));
    
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/assets', { ...formData, purchasePrice: Number(formData.purchasePrice) });
    setIsCreateOpen(false);
    setFormData({ name: '', category: 'IT Equipment', serialNumber: '', purchaseDate: '', purchasePrice: 0 });
    loadData();
  }

  async function handleAssign(e: FormEvent) {
    e.preventDefault();
    try {
      await api.patch(`/api/v1/assets/${assignAsset.id}/assign`, assignData);
      setAssignAsset(null);
      loadData();
    } catch (err: any) { alert(err.message); }
  }

  async function handleReturn(id: string) {
    if (!window.confirm("Mark this asset as returned?")) return;
    await api.patch(`/api/v1/assets/${id}/return`);
    loadData();
  }

  async function handleMaintenance(e: FormEvent) {
    e.preventDefault();
    await api.post(`/api/v1/assets/${maintenanceAsset.id}/maintenance`, { ...maintenanceData, cost: Number(maintenanceData.cost) });
    setMaintenanceAsset(null);
    setMaintenanceData({ description: '', cost: 0 });
    loadData();
  }

  if (loading) return <div className="p-10 text-center">Loading assets...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asset Management</h1>
          <p className="text-slate-500 text-sm mt-1">Track school equipment and inventory</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Register Asset
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Asset Value</p>
          <p className="text-3xl font-bold mt-2 text-emerald-400">{stats?.totalValue?.toLocaleString()} <span className="text-sm">ETB</span></p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Items</p>
          <p className="text-3xl font-bold mt-2 text-slate-900">{stats?.totalAssets}</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned to Staff</p>
          <p className="text-3xl font-bold mt-2 text-indigo-600">{stats?.assigned}</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Maintenance</p>
          <p className="text-3xl font-bold mt-2 text-red-600">{stats?.maintenance}</p>
        </div>
      </div>

      {/* ASSETS TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="py-3 px-4">Asset Name</th>
              <th className="py-3 px-4">Serial No</th>
              <th className="py-3 px-4">Value</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Assigned To</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {assets.map(asset => (
              <tr key={asset.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-medium text-slate-900">
                  {asset.name}
                  <span className="block text-xs text-slate-400 font-normal">{asset.category}</span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-500">{asset.serialNumber || '-'}</td>
                <td className="py-3 px-4 font-mono">{Number(asset.purchasePrice).toLocaleString()} ETB</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    asset.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                    asset.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                    asset.status === 'IN_MAINTENANCE' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {asset.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {asset.assignedTo ? (
                    <span className="font-medium">{asset.assignedTo.profile?.firstName} {asset.assignedTo.profile?.lastName}</span>
                  ) : (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  {asset.status === 'AVAILABLE' && (
                    <button onClick={() => setAssignAsset(asset)} className="text-indigo-600 font-semibold text-xs hover:underline">Assign</button>
                  )}
                  {asset.status === 'ASSIGNED' && (
                    <button onClick={() => handleReturn(asset.id)} className="text-amber-600 font-semibold text-xs hover:underline">Return</button>
                  )}
                  <button onClick={() => setMaintenanceAsset(asset)} className="text-slate-600 font-semibold text-xs hover:underline">Maint.</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE ASSET MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Register New Asset</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Asset Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. HP ProBook 450" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="IT Equipment">IT Equipment</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Lab Equipment">Lab Equipment</option>
                    <option value="Library">Library</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Serial Number</label>
                  <input type="text" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Purchase Date</label>
                  <input required type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Price (ETB)</label>
                  <input required type="number" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {assignAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Assign Asset</h2>
            <p className="text-sm text-slate-500 mb-4">Assigning: <span className="font-bold">{assignAsset.name}</span></p>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Staff Member</label>
                <select value={assignData.userId} onChange={e => setAssignData({...assignData, userId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Location (Optional)</label>
                <input type="text" value={assignData.location} onChange={e => setAssignData({...assignData, location: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Room 204" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setAssignAsset(null)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAINTENANCE MODAL */}
      {maintenanceAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Log Maintenance</h2>
            <p className="text-sm text-slate-500 mb-4">Asset: <span className="font-bold">{maintenanceAsset.name}</span></p>
            <form onSubmit={handleMaintenance} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea required rows={3} value={maintenanceData.description} onChange={e => setMaintenanceData({...maintenanceData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Replaced screen" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Cost (ETB)</label>
                <input required type="number" value={maintenanceData.cost} onChange={e => setMaintenanceData({...maintenanceData, cost: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setMaintenanceAsset(null)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}