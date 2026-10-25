'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  async function loadData() {
    const [rolesData, permsData] = await Promise.all([
      api.get<any[]>('/api/v1/roles'),
      api.get<any[]>('/api/v1/roles/permissions')
    ]);
    setRoles(rolesData);
    setPermissions(permsData);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function togglePermission(id: string) {
    setSelectedPerms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  async function handleCreateRole(e: FormEvent) {
    e.preventDefault();
    if (selectedPerms.length === 0) return alert("Select at least one permission");
    
    await api.post('/api/v1/roles', {
      name: roleName,
      description: roleDesc,
      permissionIds: selectedPerms
    });
    
    setIsModalOpen(false);
    setRoleName('');
    setRoleDesc('');
    setSelectedPerms([]);
    loadData();
  }

  // Group permissions by category for the UI
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) return <div className="p-10 text-center">Loading roles...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roles & Permissions</h1>
          <p className="text-slate-500 text-sm mt-1">Create custom roles for your staff</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Create Custom Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map(r => (
          <div key={r.id} className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-slate-900">{r.name}</h3>
              {r.isSystem && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded">SYSTEM</span>}
            </div>
            <p className="text-sm text-slate-500 mb-4">{r.description || 'No description'}</p>
            <div className="flex justify-between text-xs font-semibold text-slate-400 border-t pt-4">
              <span>{r.permissions?.length || 0} Permissions</span>
              <span>{r._count?.userTenantRoles || 0} Users</span>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE ROLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 my-8">
            <h2 className="text-xl font-bold mb-4">Create Custom Role</h2>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Role Name</label>
                  <input required type="text" value={roleName} onChange={e => setRoleName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Librarian" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Description</label>
                  <input type="text" value={roleDesc} onChange={e => setRoleDesc(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Manage books only" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-slate-900 mb-2">Select Permissions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-h-80 overflow-y-auto p-2">
                  {Object.keys(groupedPermissions).map(category => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{category}</h4>
                      {groupedPermissions[category].map(perm => (
                        <label key={perm.id} className="flex items-start gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedPerms.includes(perm.id)} 
                            onChange={() => togglePermission(perm.id)}
                            className="mt-0.5"
                          />
                          <span className="text-xs text-slate-600 leading-tight">{perm.description}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Create Role</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}