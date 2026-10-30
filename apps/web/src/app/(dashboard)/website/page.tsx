'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { UseToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, FolderAdd, Menu, CheckCircle, AlertCircle, Shield, Settings as SettingsIcon, FileText, TrendingUp, Wrench, Palette, Globe, Layout, Calendar as CalendarIcon, Mail, PlayCircle } from 'lucide-react';

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

  if (loading) return <motion.div className="min-h-screen flex items-center justify-center p-8">{'<Loader2 className="w-12 h-12 mx-auto opacity-50 animate-spin" /> <p className="text-slate-500 mt-4">Loading...</p>'}</motion.div>;

  return (
    <motion.div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
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
                <FolderAdd className="w-6 h-6 text-emerald-600 mr-2" /> School Website Builder
              </h1>
              <p className="text-slate-500 text-sm mt-1">Customize your public-facing landing page</p>
            </div>

            <Button
              variant="outline"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <SettingsIcon className="w-4 h-4 mr-2" /> Settings
            </Button>
          </motion.div>

          {/* Live Preview */}
          {settings?.tenant?.slug && settings?.isPublished && (
            <motion.div className="mt-6">
              <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-2">Live Preview</h2>
              <a href={`/${settings.tenant.slug}`} target="_blank" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40">
                View Live Website ↗
              </a>
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium animate-in"
            >
              {message}
            </motion.div>
          )}

          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-3xl shadow-slate-50/30">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Publish Website</h2>
                <p className="text-slate-500 text-sm mt-1">Make your website visible to the public.</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings?.isPublished ?? false}
                    onChange={e => setSettings({...settings, isPublished: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div
                    className="w-11 h-6 bg-slate-200 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Hero Title</label>
                <input
                  type="text"
                  value={settings?.heroTitle || ''}
                  onChange={e => setSettings({...settings, heroTitle: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Hero Subtitle</label>
                <input
                  type="text"
                  value={settings?.heroSubtitle || ''}
                  onChange={e => setSettings({...settings, heroSubtitle: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">About Us</label>
              <textarea
                rows={4}
                value={settings?.aboutText || ''}
                onChange={e => setSettings({...settings, aboutText: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={settings?.contactEmail || ''}
                  onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Contact Phone</label>
                <input
                  type="text"
                  value={settings?.contactPhone || ''}
                  onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-xl disabled:opacity-50 transition-all duration-300"
              >
                {isSaving ? 'Saving...' : 'Save & Publish'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}