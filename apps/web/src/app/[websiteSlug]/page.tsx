'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicSchoolWebsite() {
  const { websiteSlug } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${apiUrl}/api/v1/website/public/${websiteSlug}`)
      .then(res => res.json())
      .then(res => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [websiteSlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-slate-500">School website not found.</div>;

  const { tenant, ...website } = data;
  const brandColor = tenant.primaryColor || '#4f46e5';

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-xl" style={{ backgroundColor: brandColor }}>
                {tenant.name.charAt(0)}
              </div>
            )}
            <span className="font-bold text-xl text-slate-900">{tenant.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
            <a href="#about" className="hover:text-slate-900">About</a>
            <a href="#contact" className="hover:text-slate-900">Contact</a>
            <Link href="/login" className="text-white px-5 py-2.5 rounded-full font-bold shadow-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: brandColor }}>
              Portal Login
            </Link>
            <Link href="/apply" className="text-white px-5 py-2.5 rounded-full font-bold shadow-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: brandColor }}>
              Apply Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundColor: brandColor }}></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
            {website.heroTitle}
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
            {website.heroSubtitle}
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/apply" className="text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:-translate-y-0.5 transition-transform" style={{ backgroundColor: brandColor }}>
              Start Application
            </Link>
            <Link href="/login" className="bg-white text-slate-900 border-2 border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:border-slate-300 transition-colors">
              Parent Portal
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">About Our School</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            {website.aboutText}
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">Get in Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Email</p>
              <p className="font-medium text-slate-900">{website.contactEmail || 'N/A'}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Phone</p>
              <p className="font-medium text-slate-900">{website.contactPhone || 'N/A'}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Address</p>
              <p className="font-medium text-slate-900">{website.contactAddress || 'N/A'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-slate-400 border-t border-slate-100">
        <p>© {new Date().getFullYear()} {tenant.name}. All rights reserved.</p>
        <p className="mt-1">Powered by School Management System</p>
      </footer>
    </div>
  );
}