'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function WebsiteBuilderPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get<any>('/api/v1/website/settings').then(data => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      await api.patch('/api/v1/website/settings', settings);
      setMessage('Website updated successfully!');
    } catch {
      setMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">School Website Builder</h1>
          <p className="text-slate-500 text-sm mt-1">Customize your public-facing landing page</p>
        </div>
        {settings.isPublished && settings.tenant?.slug && (
          <a href={`/${settings.tenant.slug}`} target="_blank" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800">
            View Live Website ↗
          </a>
        )}
      </div>

      {message && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg text-sm">{message}</div>}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border">
          <div>
            <h3 className="font-bold text-slate-900">Publish Website</h3>
            <p className="text-sm text-slate-500">Make your website visible to the public.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={settings.isPublished} onChange={e => setSettings({...settings, isPublished: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Hero Title</label>
          <input type="text" value={settings.heroTitle} onChange={e => setSettings({...settings, heroTitle: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Hero Subtitle</label>
          <input type="text" value={settings.heroSubtitle} onChange={e => setSettings({...settings, heroSubtitle: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">About Us</label>
          <textarea rows={4} value={settings.aboutText} onChange={e => setSettings({...settings, aboutText: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Contact Email</label>
            <input type="email" value={settings.contactEmail || ''} onChange={e => setSettings({...settings, contactEmail: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Contact Phone</label>
            <input type="text" value={settings.contactPhone || ''} onChange={e => setSettings({...settings, contactPhone: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
          </div>
        </div>

        <div className="border-t pt-6">
          <button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}