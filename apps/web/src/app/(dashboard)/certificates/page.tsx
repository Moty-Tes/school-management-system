'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function BulkCertificatesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [certTitle, setCertTitle] = useState('Certificate of Completion');
  const [certDesc, setCertDesc] = useState('For successfully completing the academic term.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>('/api/v1/classes').then(data => {
      setClasses(data);
      if (data.length > 0) setSelectedClass(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedClass) {
      api.get<any[]>('/api/v1/students').then(data => {
        setStudents(data.filter((s: any) => s.classId === selectedClass));
      });
    }
  }, [selectedClass]);

  async function handleBulkDownload(e: FormEvent) {
    e.preventDefault();
    if (students.length === 0) return alert("No students in this class");
    
    setIsGenerating(true);
    // We will trigger a download for each student
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const query = new URLSearchParams({ title: certTitle, description: certDesc }).toString();
      
      // Create an invisible link and click it to trigger download
      const link = document.createElement('a');
      link.href = `${apiUrl}/api/v1/reports/students/${s.id}/certificate?${query}`;
      link.target = '_blank';
      link.click();
      
      // Wait 500ms between downloads so the browser doesn't block them
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsGenerating(false);
    alert(`Generated ${students.length} certificates!`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bulk Certificate Generator</h1>
        <p className="text-slate-500 text-sm mt-1">Print awards for an entire class in one click</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <form onSubmit={handleBulkDownload} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Class</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full px-4 py-3 border rounded-xl text-sm">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
              </select>
              <p className="text-xs text-slate-500 mt-2">{students.length} Students in this class</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Award Title</label>
              <input type="text" value={certTitle} onChange={e => setCertTitle(e.target.value)} className="w-full px-4 py-3 border rounded-xl text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
            <input type="text" value={certDesc} onChange={e => setCertDesc(e.target.value)} className="w-full px-4 py-3 border rounded-xl text-sm" />
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
            <p className="text-sm text-amber-800 font-medium">
              🏆 <strong>Note:</strong> This will trigger a download for all {students.length} students. Please allow multiple file downloads in your browser.
            </p>
          </div>

          <button type="submit" disabled={isGenerating || students.length === 0} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-sm disabled:opacity-50 transition-colors">
            {isGenerating ? 'Generating PDFs...' : `Generate ${students.length} Certificates`}
          </button>
        </form>
      </div>
    </div>
  );
}