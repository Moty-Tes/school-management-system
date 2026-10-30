'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { CheckCircle, X, Loader2, FolderAdd, Menu, GraduationCap, Shield, Clock, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function CertificatesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<''>('');
  const [certTitle, setCertTitle] = useState('Certificate of Completion');
  const [certDesc, setCertDesc] = useState('For successfully completing the academic term.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [isClassLoaded, setIsClassLoaded] = useState(false);

  const { toast } = useToast();

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
        setIsClassLoaded(true);
      });
    } else {
      setIsClassLoaded(false);
    }
  }, [selectedClass]);

  async function handleBulkGenerate(e: FormEvent) {
    e.preventDefault();
    if (students.length === 0) {
      toast({
        title: 'No students',
        description: 'There are no students in the selected class.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const query = new URLSearchParams({ title: certTitle, description: certDesc }).toString();

    // Process students in batches to avoid blocking
    const processNext = async (index: number) => {
      if (index >= students.length) {
        setIsGenerating(false);
        toast({
          title: 'Success',
          description: `${students.length} certificates generated successfully!`,
          variant: 'success',
        });
        return;
      }

      const s = students[index];
      try {
        const link = document.createElement('a');
        link.href = `${apiUrl}/api/v1/reports/students/${s.id}/certificate?${query}`;
        link.target = '_blank';
        link.click();

        // Wait 300ms between downloads so the browser doesn't block them
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error('Certificate generation error:', err);
      }

      processNext(index + 1);
    };

    processNext(0);
  }

  return (
    <motion.div className="min-h-screen bg-slate-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tighter">
              <GraduationCap className="w-5 h-5 text-emerald-600 mr-2" /> Certificates
            </h1>
            <p className="text-slate-500 text-sm mt-1">Print awards for an entire class in one click</p>
          </div>

          <motion.button
            onClick={() => setIsGenerating(true)}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring" }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 flex items-center gap-2"
            disabled={classes.length === 0}
          >
            <FolderAdd className="w-4 h-4" /> Generate Certificates
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
        className="px-6 py-8"
      >
        {!isClassLoaded && (
          <motion.div
            className="bg-white rounded-3xl border border-slate-200 p-8 shadow-3xl shadow-slate-50/30 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
            <p className="text-slate-500">Loading class data...</p>
          </motion.div>
        )}

        {isClassLoaded && classes.length === 0 && (
          <motion.div
            className="bg-white rounded-3xl border border-slate-200 p-8 shadow-3xl shadow-slate-50/30 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-slate-500 text-lg">No classes found.</p>
          </motion.div>
        )}

        {isClassLoaded && classes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map(c => (
              <motion.div
                key={c.id}
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40"
                style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                    <p className="text-sm text-slate-500">{c.section}</p>
                  </div>

                  <div className="p-3 bg-slate-50/50 backdrop-blur-sm rounded-xl">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <p className="text-xs text-slate-500 mt-1">{c.studentCount || 0} students</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {isClassLoaded && classes.length > 0 && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              className="bg-white rounded-3xl border border-slate-200 p-8 shadow-3xl shadow-slate-50/30 my-8"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FolderAdd className="w-5 h-5 text-indigo-500" /> Generate Certificates
              </h2>

              <form onSubmit={handleBulkGenerate} className="space-y-4">
                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
                  >
                    <option value="" disabled>Select a class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                    ))}
                  </select>
                </motion.div>

                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Award Title</label>
                  <input
                    type="text"
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Certificate of Completion"
                  />
                </motion-div>

                <motion-div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={certDesc}
                    onChange={(e) => setCertDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="For successfully completing the academic term."
                  />
                </motion-div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                  <p className="text-sm text-amber-800 font-medium">
                    🏆 <strong>Note:</strong> This will generate certificates for <strong>{students.length || 0} students</strong>. Please allow multiple file downloads in your browser.
                  </p>
                </div>

                <motion.div className="flex justify-end gap-3 pt-6 border-t">
                  <motion.button
                    type="button"
                    onClick={() => setIsGenerating(false)}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring" }}
                    className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={isGenerating || students.length === 0}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring" }}
                    className="px-5 py-3 text-sm font-medium bg-emerald-600 text-white rounded-xl transition-all disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : `Generate ${students.length} Certificates`}
                  </motion.button>
                </motion.div>
              </form>
            </motion-div>
          )}
        )}
      </motion.div>
    </motion.div>
  );
}