'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { CheckCircle, X, Loader2, FolderAdd, Menu, Shield, Users, CreditCard, Banknote, LogOut, Calendar, Mail, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function GradingScalePage() {
  const [scales, setScales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [scaleName, setScaleName] = useState('Standard Scale');
  const [rules, setRules] = useState<{grade: string; minPercent: number; maxPercent: number; remark: string}[]>([
    { grade: 'A', minPercent: 90, maxPercent: 100, remark: 'Excellent' },
    { grade: 'B', minPercent: 80, maxPercent: 89, remark: 'Very Good' },
    { grade: 'C', minPercent: 70, maxPercent: 79, remark: 'Good' },
    { grade: 'D', minPercent: 60, maxPercent: 69, remark: 'Satisfactory' },
    { grade: 'F', minPercent: 0, maxPercent: 59, remark: 'Needs Improvement' },
  ]);

  const { toast } = useToast();

  async function loadData() {
    try {
      const data = await api.get<any[]>('/api/v1/grading');
      setScales(data);
      setLoading(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load grading scales.',
        variant: 'destructive',
      });
    }
  }

  useEffect(() => { loadData(); }, []);

  function addRule() {
    setRules([...rules, { grade: '', minPercent: 0, maxPercent: 0, remark: '' }]);
  }

  function updateRule(index: number, field: keyof {grade: string; minPercent: number; maxPercent: number; remark: string}, value: any) {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  }

  function removeRule(index: number) {
    setRules(rules.filter((_, i) => i !== index));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    try {
      // Sort rules by minPercent descending before saving
      const sortedRules = [...rules].sort((a, b) => b.minPercent - a.minPercent);

      await api.post('/api/v1/grading', { name: scaleName, rules: sortedRules });
      setIsCreateOpen(false);
      loadData();
      toast({
        title: 'Grading scale saved',
        description: 'The grading scale has been successfully saved.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save grading scale. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function setDefault(id: string) {
    try {
      await api.patch(`/api/v1/grading/${id}/default`);
      loadData();
      toast({
        title: 'Default scale updated',
        description: 'The grading scale has been set as the default.',
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update default grading scale.',
        variant: 'destructive',
      });
    }
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
              <BookOpen className="w-5 h-5 text-indigo-600 mr-2" /> Academic Rules & Grading
            </h1>
            <p className="text-slate-500 text-sm mt-1">Define how student report cards are calculated</p>
          </div>

          <motion.button
            onClick={() => setIsCreateOpen(true)}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring" }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
          >
            <FolderAdd className="w-4 h-4" /> Create Scale
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
        className="px-6 py-8 lg:px-12"
      >
        {/* Scales Grid */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {scales.map(s => (
            <motion.div
              key={s.id}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40"
              style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{s.name}</h3>
                  {s.isDefault ? (
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">ACTIVE DEFAULT</span>
                  ) : (
                    <motion.button
                      onClick={() => setDefault(s.id)}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring" }}
                      className="text-xs text-slate-500 hover:text-indigo-600 font-bold underline transition-colors"
                    >
                      Set as Default
                    </motion.button>
                  )}
                </div>
              </div>

              <motion.div className="space-y-3">
                {s.rules.map((r: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: i * 0.03 }}
                    className="flex justify-between items-center p-3 bg-slate-50 rounded-lg transition-all duration-300"
                    style={{ transition: 'all 0.2s ease' }}
                  >
                    <div className="flex items-center gap-3">
                      <motion.span
                        className="font-bold text-slate-900 text-lg w-10"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 300, delay: i * 0.03 }}
                      >
                        {r.grade}
                      </motion.span>

                      <motion.div
                        className="text-sm text-slate-600 font-mono"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {r.minPercent}% - {r.maxPercent}%
                      </motion.div>

      <motion.span
        className="text-slate-500 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, delay: i * 0.03 }}
      >
        {r.remark}
      </motion.span>
                    </div>

                    <motion.div className="flex gap-2">
                      <motion.button
                        onClick={() => /* edit rule */ }
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring" }}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline transition-colors"
                        title="Edit grade rule"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>

      <motion.button
        onClick={() => removeRule(i)}
        whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
        transition={{ type: "spring" }}
        className="text-red-600 hover:text-red-800 text-sm font-bold hover:underline transition-colors"
        title="Remove grade rule"
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty state */}
        {scales.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-12 text-center text-slate-500"
          >
            <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
            <p>No grading scales found.</p>
            <p className="text-sm text-slate-400 mt-2">Create your first grading scale.</p>
          </motion.div>
        )}
      </motion.div>

      {/* CREATE SCALE MODAL */}
      {isCreateOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          whileHover={{ opacity: 0.9 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-3xl w-full max-w-2xl p-8 shadow-3xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <FolderAdd className="w-5 h-5 text-indigo-500" /> Create Grading Scale
            </h2>

            <form onSubmit={handleCreate} className="space-y-6">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Scale Name</label>
                <input
                  required
                  type="text"
                  value={scaleName}
                  onChange={(e) => setScaleName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="e.g. Cambridge IGCSE Scale"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Grade Rules</label>
                <p className="text-xs text-slate-500 mb-3">Define the percentage ranges for each grade</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
                      <tr>
                        <th className="p-3">Grade</th>
                        <th className="p-3">Min %</th>
                        <th className="p-3">Max %</th>
                        <th className="p-3">Remark</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rules.map((rule, index) => (
                        <tr key={index}>
                          <td className="p-2">
                            <input
                              required
                              type="text"
                              value={rule.grade}
                              onChange={(e) => updateRule(index, 'grade', e.target.value)}
                              className="w-16 px-2 py-1 border rounded text-center font-bold"
                              placeholder="A"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              required
                              type="number"
                              value={rule.minPercent}
                              onChange={(e) => updateRule(index, 'minPercent', Number(e.target.value))}
                              className="w-20 px-2 py-1 border rounded text-center font-mono"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              required
                              type="number"
                              value={rule.maxPercent}
                              onChange={(e) => updateRule(index, 'maxPercent', Number(e.target.value))}
                              className="w-20 px-2 py-1 border rounded text-center font-mono"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              required
                              type="text"
                              value={rule.remark}
                              onChange={(e) => updateRule(index, 'remark', e.target.value)}
                              className="w-full px-2 py-1 border rounded"
                              placeholder="Excellent"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeRule(index)}
                              className="text-red-500 font-bold text-xs"
                              title="Delete rule"
                            >
                              Del
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button type="button" onClick={addRule} className="text-sm font-bold text-indigo-600 hover:underline mb-3">+ Add Grade Rule</button>

                <motion.div className="flex justify-end gap-3 pt-4 border-t">
                  <motion.button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring" }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring" }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white transition-all"
                  >
                    Save Scale
                  </motion.button>
                </motion.div>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}