'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function CafeteriaPage() {
  const [activeTab, setActiveTab] = useState<'pos' | 'menu'>('pos');
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // POS State
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState('');

  // Menu Form State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuForm, setMenuForm] = useState({ name: '', price: 0, category: 'LUNCH', allergens: '' });

  async function loadMenu() {
    const data = await api.get<any[]>('/api/v1/cafeteria/menu');
    setMenu(data);
    setLoading(false);
  }

  useEffect(() => { loadMenu(); }, []);

  async function handlePurchase(e: FormEvent) {
    e.preventDefault();
    setError('');
    setReceipt(null);
    if (!selectedItem) {
      setError('Please select a food item first.');
      return;
    }

    try {
      const res = await api.post<any>('/api/v1/cafeteria/purchase', {
        admissionNumber: admissionNumber.toUpperCase(),
        menuItemId: selectedItem.id,
      });
      setReceipt(res);
      setAdmissionNumber(''); // Clear for next student
      setSelectedItem(null);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleCreateMenuItem(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/cafeteria/menu', { ...menuForm, price: Number(menuForm.price) });
    setIsMenuModalOpen(false);
    setMenuForm({ name: '', price: 0, category: 'LUNCH', allergens: '' });
    loadMenu();
  }

  if (loading) return <div className="p-10 text-center">Loading cafeteria...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cafeteria & Wallet</h1>
          <p className="text-slate-500 text-sm mt-1">Manage meals and cashless purchases</p>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        <button onClick={() => setActiveTab('pos')} className={`pb-2 px-2 text-sm font-medium ${activeTab === 'pos' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Cashier POS</button>
        <button onClick={() => setActiveTab('menu')} className={`pb-2 px-2 text-sm font-medium ${activeTab === 'menu' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Menu Items</button>
      </div>

      {/* CASHIER POS TAB */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Side: Scan & Pay */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Scan Student ID</h2>
            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Admission Number</label>
                <input 
                  required 
                  type="text" 
                  value={admissionNumber} 
                  onChange={e => setAdmissionNumber(e.target.value)} 
                  className="w-full px-4 py-3 border rounded-xl text-lg font-mono uppercase focus:ring-2 focus:ring-indigo-500" 
                  placeholder="e.g. STU-0001" 
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Select Food Item</label>
                <select 
                  required 
                  onChange={e => setSelectedItem(menu.find(m => m.id === e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">-- Choose item --</option>
                  {menu.map(m => (
                    <option key={m.id} value={m.id}>{m.name} - {Number(m.price).toLocaleString()} ETB</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-sm">
                Deduct from Wallet
              </button>
            </form>

            {error && <div className="mt-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-bold">{error}</div>}

            {receipt && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <h3 className="font-bold text-emerald-800 mb-1">✅ Payment Successful</h3>
                <p className="text-sm text-emerald-700">Student: <span className="font-bold">{receipt.studentName}</span></p>
                <p className="text-sm text-emerald-700">New Balance: <span className="font-bold">{receipt.newBalance} ETB</span></p>
                {receipt.allergyWarning && (
                  <div className="mt-3 p-3 bg-red-600 text-white font-bold text-sm rounded-lg animate-pulse">
                    {receipt.allergyWarning}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Menu Preview */}
          <div className="bg-slate-50 rounded-2xl border p-6">
            <h2 className="text-lg font-bold mb-4">Today's Menu</h2>
            <div className="space-y-3">
              {menu.map(m => (
                <div key={m.id} className="bg-white p-3 rounded-lg border flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                    {m.allergens && <p className="text-[10px] text-red-500">Contains: {m.allergens}</p>}
                  </div>
                  <p className="font-mono text-indigo-600 font-bold">{Number(m.price)} ETB</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MENU TAB */}
      {activeTab === 'menu' && (
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Manage Menu</h2>
            <button onClick={() => setIsMenuModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Add Item</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {menu.map(m => (
              <div key={m.id} className="p-4 border rounded-xl bg-slate-50">
                <h3 className="font-bold text-slate-900">{m.name}</h3>
                <p className="text-sm text-indigo-600 font-bold mt-1">{Number(m.price)} ETB</p>
                {m.allergens && <p className="text-xs text-red-500 mt-2">Allergens: {m.allergens}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD MENU ITEM MODAL */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Add Menu Item</h2>
            <form onSubmit={handleCreateMenuItem} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Item Name</label>
                <input required type="text" value={menuForm.name} onChange={e => setMenuForm({...menuForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Chicken Sandwich" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Price (ETB)</label>
                <input required type="number" value={menuForm.price} onChange={e => setMenuForm({...menuForm, price: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Allergens (Comma separated)</label>
                <input type="text" value={menuForm.allergens} onChange={e => setMenuForm({...menuForm, allergens: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Peanuts, Dairy" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsMenuModalOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}