'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, Save, Sparkles, Building2, Palette, 
  Calendar, Shield, Globe, Mail, CheckCircle2, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';

const COLOR_PRESETS = [
  { name: 'Royal Indigo', hex: '#4f46e5' },
  { name: 'Electric Violet', hex: '#7c3aed' },
  { name: 'Emerald Jade', hex: '#059669' },
  { name: 'Cyan Sapphire', hex: '#0284c7' },
  { name: 'Rose Quartz', hex: '#e11d48' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Obsidian Velvet', hex: '#0f172a' },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    name: 'Metropolitan International Academy',
    primaryColor: '#4f46e5',
    logoUrl: '',
    contactEmail: 'admin@school.edu',
    currency: 'ETB',
    currentTerm: 'Term 1',
    academicYear: '2026/2027',
  });

  async function loadData() {
    try {
      setLoading(true);
      const [meRes, tenantRes] = await Promise.all([
        getMe().catch(() => ({ roles: [] })),
        api.get<any>('/api/v1/tenant/settings').catch(() => null),
      ]);

      const roles = (meRes as any)?.roles || [];
      setIsAdmin(roles.includes('TENANT_ADMIN') || roles.includes('SUPER_ADMIN'));

      const tenant = tenantRes?.data || tenantRes;
      if (tenant) {
        setFormData(prev => ({
          ...prev,
          name: tenant.name || prev.name,
          primaryColor: tenant.primaryColor || prev.primaryColor,
          logoUrl: tenant.logoUrl || '',
        }));
      }
    } catch (err) {
      toast.error('Failed to load institution settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch('/api/v1/tenant/settings', {
        name: formData.name,
        primaryColor: formData.primaryColor,
        logoUrl: formData.logoUrl || undefined,
      });

      toast.success('School branding and configuration saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 animate-spin flex items-center justify-center text-white" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Institution Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 bg-gradient-to-r from-slate-950 via-[#121630] to-[#1c1236] text-white">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 mb-4 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Institution Configuration Studio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              School Settings & Branding
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-xl font-medium">
              Customize your institution name, brand accent theme, academic periods, and global configurations.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !isAdmin}
            className="glass-button-primary inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider py-3 px-6 shadow-xl shadow-indigo-500/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Institution Identity */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Institution Profile</h3>
              <p className="text-xs text-slate-500">Legal name, public brand title, and official emblems</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                School Display Name
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Cambridge Horizon Academy"
                className="glass-input w-full font-bold text-slate-900 text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Logo Image URL
              </label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="glass-input w-full text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Primary Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="registrar@school.edu"
                className="glass-input w-full text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Visual Brand & Accent Theme */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Brand Accent & Palette</h3>
              <p className="text-xs text-slate-500">Choose primary theme color for student cards, invoices, and portal accents</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Theme Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setFormData({ ...formData, primaryColor: preset.hex })}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                    formData.primaryColor.toLowerCase() === preset.hex.toLowerCase()
                      ? 'border-indigo-600 bg-white shadow-md shadow-indigo-500/20 scale-105'
                      : 'border-slate-200/70 bg-white/60 hover:bg-white'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full shadow-inner border-2 border-white"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span className="text-[11px] font-bold text-slate-700">{preset.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Custom Hex:</label>
              <input
                type="text"
                value={formData.primaryColor}
                onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                className="glass-input font-mono text-xs w-32 uppercase"
              />
              <div
                className="w-7 h-7 rounded-lg border border-slate-300 shadow-sm"
                style={{ backgroundColor: formData.primaryColor }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Academic Calendar & Currency */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Academic Year & Term</h3>
              <p className="text-xs text-slate-500">Define active tuition cycle, billing period, and primary currency</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Current Term
              </label>
              <select
                value={formData.currentTerm}
                onChange={e => setFormData({ ...formData, currentTerm: e.target.value })}
                className="glass-input w-full font-bold text-slate-800"
              >
                <option value="Term 1">Term 1 (First Trimester)</option>
                <option value="Term 2">Term 2 (Second Trimester)</option>
                <option value="Term 3">Term 3 (Final Trimester)</option>
                <option value="Semester 1">Semester 1 (Autumn)</option>
                <option value="Semester 2">Semester 2 (Spring)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Academic Year
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="2026/2027"
                className="glass-input w-full font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Billing Currency
              </label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="glass-input w-full font-bold text-slate-800"
              >
                <option value="ETB">ETB (Ethiopian Birr)</option>
                <option value="USD">USD ($ United States Dollar)</option>
                <option value="EUR">EUR (€ Euro)</option>
                <option value="GBP">GBP (£ British Pound)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Floating Save Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={saving || !isAdmin}
            className="glass-button-primary inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider py-3 px-8 shadow-xl shadow-indigo-600/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
