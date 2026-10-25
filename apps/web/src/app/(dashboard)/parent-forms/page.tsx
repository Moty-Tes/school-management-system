'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function ParentFormsPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get<any[]>('/api/v1/forms').then(data => {
      setForms(data.filter(f => f.isActive));
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`/api/v1/forms/${activeForm.id}/submit`, { data: formData });
      alert('Response submitted successfully!');
      setActiveForm(null);
      setFormData({});
    } catch (err) {
      alert('Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return <div className="p-10 text-center">Loading forms...</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Action Required</h1>
        <p className="text-slate-500 text-sm mt-1">Please fill out the pending school forms</p>
      </div>

      <div className="space-y-4">
        {forms.length === 0 ? <p className="text-slate-500">No pending forms.</p> : 
          forms.map(f => (
            <div key={f.id} className="bg-white p-6 rounded-xl border shadow-sm flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.description}</p>
              </div>
              <button onClick={() => setActiveForm(f)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Fill Form</button>
            </div>
          ))
        }
      </div>

      {/* FORM SUBMISSION MODAL */}
      {activeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900">{activeForm.title}</h2>
            <p className="text-sm text-slate-500 mb-6">{activeForm.description}</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeForm.schema.map((field: any) => (
                <div key={field.id}>
                  {field.type === 'TEXT' && (
                    <>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                      <input required={field.required} type="text" onChange={e => setFormData({...formData, [field.id]: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </>
                  )}
                  {field.type === 'DATE' && (
                    <>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                      <input required={field.required} type="date" onChange={e => setFormData({...formData, [field.id]: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </>
                  )}
                  {field.type === 'CHECKBOX' && (
                    <label className="flex items-center gap-2 mt-4 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                      <input required={field.required} type="checkbox" onChange={e => setFormData({...formData, [field.id]: e.target.checked})} className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-slate-700">{field.label}</span>
                    </label>
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button type="button" onClick={() => setActiveForm(null)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                  {isSubmitting ? 'Submitting...' : 'Submit Signature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}