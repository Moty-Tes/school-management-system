'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';

interface Announcement {
  id: string;
  title: string;
  content: string;
  class?: { name: string, section: string };
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', classId: '' });
  const [classes, setClasses] = useState<{id: string, name: string, section: string}[]>([]);

  async function loadData() {
    const [announcementsData, meData, classesData] = await Promise.all([
      api.get<Announcement[]>('/api/v1/announcements'),
      getMe(),
      api.get<any[]>('/api/v1/classes')
    ]);
    setAnnouncements(announcementsData);
    setClasses(classesData);
    setIsAdmin((meData as any).roles?.includes('TENANT_ADMIN') || (meData as any).roles?.includes('SUPER_ADMIN'));
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/announcements', {
      title: formData.title,
      content: formData.content,
      classId: formData.classId || null
    });
    setIsModalOpen(false);
    setFormData({ title: '', content: '', classId: '' });
    loadData();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="text-slate-500 text-sm mt-1">School-wide and class-specific news</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + New Announcement
          </button>
        )}
      </div>

      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-bold text-slate-900">{a.title}</h2>
              <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{a.content}</p>
            <div className="mt-4 pt-3 border-t flex gap-2">
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                {a.class ? `Class: ${a.class.name} ${a.class.section}` : 'Whole School'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create Announcement</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Content</label>
                <textarea required rows={4} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Target Audience</label>
                <select value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">All Classes (Whole School)</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}