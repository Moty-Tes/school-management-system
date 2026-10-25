'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function FormsAdminPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingSubmissions, setViewingSubmissions] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);

  // Form Builder State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [schema, setSchema] = useState<any[]>([]);

  async function loadData() {
    const data = await api.get<any[]>('/api/v1/forms');
    setForms(data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function addField(type: string) {
    setSchema([...schema, { id: Date.now().toString(), type, label: '', required: true, options: type === 'SELECT' ? ['Option 1', 'Option 2'] : [] }]);
  }

  function updateField(id: string, key: string, value: any) {
    setSchema(schema.map(f => f.id === id ? { ...f, [key]: value } : f));
  }

  function removeField(id: string) {
    setSchema(schema.filter(f => f.id !== id));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/forms', { title: formTitle, description: formDesc, schema });
    setIsCreateOpen(false);
    setFormTitle('');
    setFormDesc('');
    setSchema([]);
    loadData();
  }

  async function viewSubmissions(formId: string) {
    setViewingSubmissions(formId);
    const data = await api.get<any[]>(`/api/v1/forms/${formId}/submissions`);
    setSubmissions(data);
  }

  if (loading) return <div className="p-10 text-center">Loading forms...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Custom Forms</h1>
          <p className="text-slate-500 text-sm mt-1">Create permission slips, surveys, and consent forms</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Create Form
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {forms.map(f => (
          <div key={f.id} className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
              <span className={`px-2 py-1 rounded text-xs font-bold ${f.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {f.isActive ? 'ACTIVE' : 'CLOSED'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-4">{f.description}</p>
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm font-semibold text-slate-700">{f._count.submissions} Submissions</span>
              <button onClick={() => viewSubmissions(f.id)} className="text-indigo-600 text-sm font-bold hover:underline">View Responses →</button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE FORM MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex flex-col z-50 p-4 sm:p-10 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-3xl mx-auto p-6 my-auto">
            <h2 className="text-xl font-bold mb-4">Form Builder</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Form Title</label>
                  <input required type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Grade 5 Museum Field Trip" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Description</label>
                  <input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900">Form Fields</h3>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addField('TEXT')} className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-bold hover:bg-slate-200">+ Text</button>
                    <button type="button" onClick={() => addField('CHECKBOX')} className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-bold hover:bg-slate-200">+ Checkbox</button>
                    <button type="button" onClick={() => addField('DATE')} className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-bold hover:bg-slate-200">+ Date</button>
                  </div>
                </div>

                <div className="space-y-3">
                  {schema.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border">
                      <span className="text-xs font-bold text-slate-400 w-6">{index + 1}.</span>
                      <div className="flex-1">
                        <input required type="text" value={field.label} onChange={e => updateField(field.id, 'label', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" placeholder="Field Label (e.g. Parent Name)" />
                      </div>
                      <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded w-20 text-center">{field.type}</span>
                      <label className="flex items-center gap-1 text-xs text-slate-600">
                        <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, 'required', e.target.checked)} /> Req
                      </label>
                      <button type="button" onClick={() => removeField(field.id)} className="text-red-500 text-xs font-bold hover:underline">Del</button>
                    </div>
                  ))}
                  {schema.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Add fields above to build your form.</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Publish Form</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMISSIONS MODAL */}
      {viewingSubmissions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl p-6 max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">Form Submissions</h2>
            <div className="overflow-y-auto flex-1 border rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 sticky top-0 border-b">
                  <tr><th className="p-3">Submitted By</th><th className="p-3">Date</th><th className="p-3">Answers</th></tr>
                </thead>
                <tbody className="divide-y">
                  {submissions.map(s => (
                    <tr key={s.id}>
                      <td className="p-3 font-medium">{s.user.profile?.firstName} {s.user.profile?.lastName}</td>
                      <td className="p-3 text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <pre className="text-xs bg-slate-100 p-2 rounded overflow-x-auto">{JSON.stringify(s.data, null, 2)}</pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewingSubmissions(null)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}