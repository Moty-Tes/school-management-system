'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Papa from 'papaparse';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserPlus, UserRemove, Download, Upload, Calendar, Settings } from 'lucide-react';

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
      motionAlert("Please create a class first before importing students.");
      return;
    }
    const defaultClassId = classes[0].id;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
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
          motionAlert(`Successfully imported ${formattedData.length} students!`);
          loadData();
        } catch (err) {
          motionAlert('Failed to import. Check your CSV format.', 'error');
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

      // Show success animation
      showSuccessToast('Student saved successfully!');

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save student');
      showErrorToast('Failed to save student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/api/v1/students/${id}`);
      showDeleteToast(`Student ${name} has been deleted`);
      loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete student');
      showErrorToast('Failed to delete student. Please try again.');
    }
  }

  // --- Toast & Alert System ---
  function motionAlert(message: string, type: 'success' | 'error' = 'success') {
    const toastId = `student-${Date.now()}`;
    if (type === 'success') {
      // Use sonner toast for success
      import('sonner').then(({ default: toast }) => {
        toast.success(message, {
          id: toastId,
          description: 'Student data updated successfully',
          action: {
            label: 'Undo',
            onClick: () => {
              // Can implement undo logic here
            }
          }
        });
      });
    } else {
      import('sonner').then(({ default: toast }) => {
        toast.error(message, {
          id: toastId,
          description: 'Import failed, please check CSV format'
        });
      });
    }
  }

  function showSuccessToast(message: string) {
    // Client-side toast notification
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-3';
    toastContainer.innerHTML = `
      <div className="bg-primary-600 text-white px-6 py-4 rounded-3xl shadow-2xl transform translate-y-0 transition-transform duration-500 ease-out shadow-primary-500/20">
        <svg className="w-5 h-5 -mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastContainer);

    // Animate in
    setTimeout(() => {
      toastContainer.querySelector('div')!.className = 'bg-primary-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-primary-500/20 transform translate-y-0 transition-transform duration-500 ease-out';
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      toastContainer.style.transform = 'translateY(-100%)';
      toastContainer.style.opacity = '0';
      setTimeout(() => toastContainer.remove(), 300);
    }, 3000);
  }

  function showErrorToast(message: string) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-3';
    toastContainer.innerHTML = `
      <div className="bg-red-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-red-500/20 transform translate-y-0 transition-transform duration-500 ease-out">
        <svg className="w-5 h-5 -mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116 21H8a2 2 0 01-2-1.858L5 7"></path></svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastContainer);

    setTimeout(() => {
      toastContainer.style.transform = 'translateY(-100%)';
      toastContainer.style.opacity = '0';
      setTimeout(() => toastContainer.remove(), 300);
    }, 3000);
  }

  function showDeleteToast(message: string) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-3';
    toastContainer.innerHTML = `
      <div className="bg-green-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-green-500/20 transform translate-y-0 transition-transform duration-500 ease-out">
        <svg className="w-5 h-5 -mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastContainer);

    setTimeout(() => {
      toastContainer.style.transform = 'translateY(-100%)';
      toastContainer.style.opacity = '0';
      setTimeout(() => toastContainer.remove(), 3000);
    }, 3000);
  }

  return (
    <motion.div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your school's student roster</p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          {/* Hidden file input */}
          <motion.input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden sm:inline-block bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            style={{ transition: 'all 0.3s ease' }}
          />

          {isAdmin && (
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30"
            >
              Import CSV
            </motion.button>
          )}

          {isAdmin && (
            <motion.button
              onClick={openAddModal}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/30"
            >
              + Add Student
            </motion.button>
          )}
        </div>
      </motion.div>

      {error && (
        <motion.div
          className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm animate-bounce"
        >
          {error}
        </motion.div>
      )}

      {/* Students Table with animated rows */}
      <motion.div>
        <motion.div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-lg shadow-slate-50/30">
          <motion.table className="w-full text-left border-collapse animate-in" style={{ transitionProperty: 'all', transitionDuration: '0.2s' }}>
            <motion.thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <motion.tr className="hover:bg-slate-100">
                <motion.th className="py-3.5 px-4">Adm No</motion.th>
                <motion.th className="py-3.5 px-4">Name</motion.th>
                <motion.th className="py-3.5 px-4">Class</motion.th>
                <motion.th className="py-3.5 px-4">Guardian</motion.th>
                <motion.th className="py-3.5 px-4 text-right">Actions</motion.th>
              </motion.tr>
            </motion.thead>
            <motion.tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <motion.tr className="align-middle">
                  <motion.td colSpan={5} className="py-10 text-center text-slate-400">
                    Loading students...
                  </motion.td>
                </motion.tr>
              ) : students.length === 0 ? (
                <motion.tr className="align-middle">
                  <motion.td colSpan={5} className="py-10 text-center text-slate-400">
                    No students found.
                  </motion.td>
                </motion.tr>
              ) : (
                students.map((student, index) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: index * 0.05 }}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <motion.td className="py-3.5 px-4 font-mono text-indigo-600 font-medium">{student.admissionNumber}</motion.td>
                    <motion.td className="py-3.5 px-4">
                      <motion.a
                        href={`/students/${student.id}`}
                        className="flex items-center gap-3 group-hover:text-indigo-600 transition-colors"
                      >
                        {student.photoUrl ? (
                          <motion.img
                            src={`http://localhost:4000${student.photoUrl}`}
                            alt={student.firstName}
                            className="w-8 h-8 rounded-full object-cover bg-slate-200 transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <motion.div
                            className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs transition-colors hover:text-indigo-500"
                          >
                            {student.firstName[0]}{student.lastName[0]}
                          </motion.div>
                        )}
                        <span className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {student.firstName} {student.lastName}
                        </span>
                      </motion.a>
                    </motion.td>
                    <motion.td className="py-3.5 px-4">
                      {student.class ? (
                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors hover:bg-indigo-100">
                          {student.class.name} - {student.class.section}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Unassigned</span>
                      )}
                    </motion.td>
                    <motion.td className="py-3.5 px-4">
                      {student.guardianName} <br/>
                      <span className="text-xs text-slate-400">{student.guardianPhone}</span>
                    </motion.td>
                    <motion.td className="py-3.5 px-4 text-right space-x-3">
                      {isAdmin ? (
                        <motion.div>
                          <motion.button
                            onClick={() => openEditModal(student)}
                            className="text-indigo-600 hover:text-indigo-900 text-xs font-semibold hover:underline transition-colors"
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            onClick={() => handleDelete(student.id, student.firstName)}
                            className="text-red-600 hover:text-red-900 text-xs font-semibold hover:underline transition-colors"
                          >
                            Delete
                          </motion.button>
                        </motion.div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">View Only</span>
                      )}
                    </motion.td>
                  </motion.tr>
                ))
              )}
            </motion.tbody>
          </motion.table>
        </motion.div>
      </motion.div>

      {/* Add/Edit Modal with premium design */}
      {isModalOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          whileHover={{ opacity: 0.9 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-3xl w-full max-w-md p-8 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              border: '1px solid var(--border-color, #e5e7eb)',
              background: 'var(--modal-bg, #fff)'
            }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              {editingId ? 'Edit Student' : 'Add New Student'}
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">

              <motion.div className="grid grid-cols-2 gap-6">
                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                  <input
                    required
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="John"
                  />
                </motion.div>
                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                  <input
                    required
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Doe"
                  />
                </motion.div>
              </motion.div>

              <motion.div className="grid grid-cols-2 gap-6">
                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </motion.div>
                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({...formData, classId: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12"
                  >
                    <option value="" disabled>Select a class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                    ))}
                  </select>
                </motion.div>
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Guardian Name</label>
                <input
                  required
                  type="text"
                  value={formData.guardianName}
                  onChange={(e) => setFormData({...formData, guardianName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Guardian Name"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Guardian Phone</label>
                <input
                  required
                  type="text"
                  value={formData.guardianPhone}
                  onChange={(e) => setFormData({...formData, guardianPhone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="0912345678"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student Photo (Optional)</label>
                <motion.input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
                />
              </motion.div>

              <motion.div className="flex justify-end gap-3 pt-8 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 text-sm font-medium bg-primary-600 text-white rounded-xl disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save Student'}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Bulk Import Section */}
      {isAdmin && (
        <motion.div className="mt-8 pt-8 border-t animate-in" style={{ transitionDelay: '0.3s' }}>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Bulk Import</h3>
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Select CSV File
            </motion.button>
          </div>
          <p className="text-xs text-slate-400 mt-2 sm:mt-0">CSV format: admissionNumber,firstName,lastName,gender,classId,guardianName,guardianPhone</p>
        </motion.div>
      )}
    </motion.div>
  );
}