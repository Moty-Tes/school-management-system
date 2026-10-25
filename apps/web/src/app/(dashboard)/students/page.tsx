'use client';

import { useEffect, useState, FormEvent, useRef } from 'react';
import { api, ApiError } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Papa from 'papaparse';
import Link from 'next/link';

interface ClassItem {
  id: string;
  name: string;
  section: string;
}

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  classId?: string;
  class?: ClassItem;
  guardianName: string;
  guardianPhone: string;
  photoUrl?: string;
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  gender: 'MALE',
  classId: '',
  guardianName: '',
  guardianPhone: '',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Ref for the hidden file input (CSV)
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [studentsData, classesData, meData] = await Promise.all([
        api.get<Student[]>('/api/v1/students'),
        api.get<ClassItem[]>('/api/v1/classes'),
        getMe()
      ]);
      setStudents(studentsData);
      setClasses(classesData);
      setIsAdmin((meData as any).roles?.includes('TENANT_ADMIN') || (meData as any).roles?.includes('SUPER_ADMIN'));
      
      // Auto-select first class if available
      if (classesData.length > 0 && !formData.classId) {
        setFormData(prev => ({ ...prev, classId: classesData[0].id }));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // --- CSV IMPORT LOGIC ---
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (classes.length === 0) {
      alert("Please create a class first before importing students.");
      return;
    }
    const defaultClassId = classes[0].id;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const formattedData = results.data.map((row: any) => ({
            firstName: row.firstName || row.FirstName,
            lastName: row.lastName || row.LastName,
            gender: (row.gender || row.Gender || 'MALE').toUpperCase(),
            classId: defaultClassId,
            guardianName: row.guardianName || row.GuardianName || 'Unknown',
            guardianPhone: row.guardianPhone || row.GuardianPhone || '0000000000',
          }));

          await api.post('/api/v1/students/bulk', formattedData);
          alert(`Successfully imported ${formattedData.length} students!`);
          loadData();
        } catch (err) {
          alert('Failed to import. Check your CSV format.');
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }
    });
  }

  // --- MANUAL FORM LOGIC ---
  function openAddModal() {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM, classId: classes[0]?.id || '' });
    setPhotoFile(null);
    setIsModalOpen(true);
  }

  function openEditModal(student: Student) {
    setEditingId(student.id);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      classId: student.classId || '',
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
    });
    setPhotoFile(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let finalPhotoUrl = undefined;

      // If user selected a photo, upload it first
      if (photoFile) {
        const uploadData = new FormData();
        uploadData.append('image', photoFile);
        const uploadRes = await api.post<{ url: string }>('/api/v1/upload', uploadData);
        finalPhotoUrl = uploadRes.url;
      }

      const payload = {
        ...formData,
        ...(finalPhotoUrl ? { photoUrl: finalPhotoUrl } : {})
      };

      if (editingId) {
        await api.patch(`/api/v1/students/${editingId}`, payload);
      } else {
        await api.post('/api/v1/students', payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save student');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/api/v1/students/${id}`);
      loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete student');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your school's student roster</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          {/* Hidden file input */}
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          
          {isAdmin && (
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex-1 sm:flex-none bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Import CSV
            </button>
          )}

          {isAdmin && (
            <button 
              onClick={openAddModal} 
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Student
            </button>
          )}
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">{error}</div>}

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <th className="py-3.5 px-4">Adm No</th>
              <th className="py-3.5 px-4">Name</th>
              <th className="py-3.5 px-4">Class</th>
              <th className="py-3.5 px-4">Guardian</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <tr><td colSpan={5} className="py-10 text-center text-slate-400">Loading students...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-slate-400">No students found.</td></tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-3.5 px-4 font-mono text-indigo-600 font-medium">{student.admissionNumber}</td>
                  <td className="py-3.5 px-4">
                    <Link href={`/students/${student.id}`} className="flex items-center gap-3">
                      {student.photoUrl ? (
                        <img src={`http://localhost:4000${student.photoUrl}`} alt={student.firstName} className="w-8 h-8 rounded-full object-cover bg-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                      )}
                      <span className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {student.firstName} {student.lastName}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    {student.class ? (
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                        {student.class.name} - {student.class.section}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {student.guardianName} <br/>
                    <span className="text-xs text-slate-400">{student.guardianPhone}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-3">
                    {isAdmin ? (
                      <>
                        <button onClick={() => openEditModal(student)} className="text-indigo-600 hover:text-indigo-900 text-xs font-semibold">Edit</button>
                        <button onClick={() => handleDelete(student.id, student.firstName)} className="text-red-600 hover:text-red-900 text-xs font-semibold">Delete</button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">View Only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{editingId ? 'Edit Student' : 'Add New Student'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                  <input required type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                  <input required type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                  <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Class</label>
                  <select required value={formData.classId} onChange={(e) => setFormData({...formData, classId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <option value="" disabled>Select a class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Guardian Name</label>
                <input required type="text" value={formData.guardianName} onChange={(e) => setFormData({...formData, guardianName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Guardian Phone</label>
                <input required type="text" value={formData.guardianPhone} onChange={(e) => setFormData({...formData, guardianPhone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Student Photo (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                  {isSubmitting ? 'Saving...' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}