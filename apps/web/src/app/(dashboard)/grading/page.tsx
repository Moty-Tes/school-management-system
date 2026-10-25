'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

interface GradeRule {
  grade: string;
  minPercent: number;
  maxPercent: number;
  remark: string;
}

export default function GradingScalePage() {
  const [scales, setScales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [scaleName, setScaleName] = useState('Standard Scale');
  const [rules, setRules] = useState<GradeRule[]>([
    { grade: 'A', minPercent: 90, maxPercent: 100, remark: 'Excellent' },
    { grade: 'B', minPercent: 80, maxPercent: 89, remark: 'Very Good' },
    { grade: 'C', minPercent: 70, maxPercent: 79, remark: 'Good' },
    { grade: 'D', minPercent: 60, maxPercent: 69, remark: 'Satisfactory' },
    { grade: 'F', minPercent: 0, maxPercent: 59, remark: 'Needs Improvement' },
  ]);

  async function loadData() {
    const data = await api.get<any[]>('/api/v1/grading');
    setScales(data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function addRule() {
    setRules([...rules, { grade: '', minPercent: 0, maxPercent: 0, remark: '' }]);
  }

  function updateRule(index: number, field: keyof GradeRule, value: any) {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  }

  function removeRule(index: number) {
    setRules(rules.filter((_, i) => i !== index));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    // Sort rules by minPercent descending before saving
    const sortedRules = [...rules].sort((a, b) => b.minPercent - a.minPercent);
    
    await api.post('/api/v1/grading', { name: scaleName, rules: sortedRules });
    setIsCreateOpen(false);
    loadData();
  }

  async function setDefault(id: string) {
    await api.patch(`/api/v1/grading/${id}/default`);
    loadData();
  }

  if (loading) return <div className="p-10 text-center">Loading grading scales...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Rules & Grading</h1>
          <p className="text-slate-500 text-sm mt-1">Define how student report cards are calculated</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Create Scale
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scales.map(s => (
          <div key={s.id} className={`bg-white p-6 rounded-xl border shadow-sm ${s.isDefault ? 'ring-2 ring-indigo-500 border-transparent' : 'border-slate-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">{s.name}</h3>
              {s.isDefault ? (
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">ACTIVE DEFAULT</span>
              ) : (
                <button onClick={() => setDefault(s.id)} className="text-xs text-slate-500 hover:text-indigo-600 font-bold underline">Set as Default</button>
              )}
            </div>
            
            <div className="space-y-2">
              {s.rules.map((r: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                  <span className="font-bold text-slate-900 w-8">{r.grade}</span>
                  <span className="text-slate-600 font-mono text-xs">{r.minPercent}% - {r.maxPercent}%</span>
                  <span className="text-slate-500 text-xs">{r.remark}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE SCALE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 my-8">
            <h2 className="text-xl font-bold mb-4">Create Grading Scale</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-xs font-medium mb-1">Scale Name</label>
                <input required type="text" value={scaleName} onChange={e => setScaleName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Cambridge IGCSE Scale" />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="p-3">Grade</th>
                      <th className="p-3">Min %</th>
                      <th className="p-3">Max %</th>
                      <th className="p-3">Remark</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rules.map((rule, index) => (
                      <tr key={index}>
                        <td className="p-2"><input required type="text" value={rule.grade} onChange={e => updateRule(index, 'grade', e.target.value)} className="w-16 px-2 py-1 border rounded text-center font-bold" placeholder="A" /></td>
                        <td className="p-2"><input required type="number" value={rule.minPercent} onChange={e => updateRule(index, 'minPercent', Number(e.target.value))} className="w-20 px-2 py-1 border rounded text-center font-mono" /></td>
                        <td className="p-2"><input required type="number" value={rule.maxPercent} onChange={e => updateRule(index, 'maxPercent', Number(e.target.value))} className="w-20 px-2 py-1 border rounded text-center font-mono" /></td>
                        <td className="p-2"><input required type="text" value={rule.remark} onChange={e => updateRule(index, 'remark', e.target.value)} className="w-full px-2 py-1 border rounded" placeholder="Excellent" /></td>
                        <td className="p-2 text-right"><button type="button" onClick={() => removeRule(index)} className="text-red-500 font-bold text-xs">Del</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button type="button" onClick={addRule} className="text-sm font-bold text-indigo-600 hover:underline">+ Add Grade Rule</button>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save Scale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}