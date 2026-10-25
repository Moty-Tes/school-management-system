'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function PlatformAdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/platform/stats')
      .then(res => setData(res))
      .catch(() => alert('Access Denied. Only Super Admins can view this.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center">Loading platform data...</div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">SaaS Platform Overview</h1>
        <p className="text-slate-500 mt-1">Welcome, CEO. Here is how your company is performing.</p>
      </div>

      {/* Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Recurring Revenue</p>
          <p className="text-4xl font-bold mt-2 text-emerald-400">
            {data.overview.monthlyRevenue.toLocaleString()} <span className="text-lg">ETB</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Annual Run Rate</p>
          <p className="text-4xl font-bold mt-2 text-slate-900">
            {data.overview.annualRevenue.toLocaleString()} <span className="text-lg text-slate-500">ETB</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Schools</p>
          <p className="text-4xl font-bold mt-2 text-slate-900">{data.overview.totalSchools}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
          <p className="text-4xl font-bold mt-2 text-slate-900">{data.overview.totalStudents}</p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Your Customers (Schools)</h3>
          <span className="text-xs font-semibold text-slate-500">Priced at 50 ETB / Student / Month</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-xs uppercase font-semibold text-slate-500">
              <th className="py-3 px-6">School Name</th>
              <th className="py-3 px-6">Tenant Code</th>
              <th className="py-3 px-6">Joined</th>
              <th className="py-3 px-6">Students</th>
              <th className="py-3 px-6 text-right">Monthly Bill</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {data.tenants.map((tenant: any) => (
              <tr key={tenant.id} className="hover:bg-slate-50">
                <td className="py-3 px-6 font-medium text-slate-900">{tenant.name}</td>
                <td className="py-3 px-6 font-mono text-slate-500">{tenant.code}</td>
                <td className="py-3 px-6 text-slate-500">{new Date(tenant.joinedAt).toLocaleDateString()}</td>
                <td className="py-3 px-6 font-bold text-slate-700">{tenant.studentCount}</td>
                <td className="py-3 px-6 text-right font-mono font-bold text-emerald-600">
                  {tenant.monthlyBill.toLocaleString()} ETB
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}