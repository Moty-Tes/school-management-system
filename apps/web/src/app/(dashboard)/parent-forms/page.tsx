'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { CheckCircle, X, Loader2, FolderAdd, Menu, Shield, Users, UserPlus, LogOut, Clock, Flag, Info, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ParentFormsPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    api.get<any[]>('/api/v1/forms').then(data => {
      setForms(data.filter((f: any) => f.isActive));
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post(`/api/v1/forms/${activeForm.id}/submit`, { data: formData });
      toast({
        title: 'Form submitted',
        description: 'Your form response has been successfully submitted.',
        variant: 'success',
      });
      setActiveForm(null);
      setFormData({});
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to submit form. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
              <FolderAdd className="w-5 h-5 text-indigo-600 mr-2" /> Action Required
            </h1>
            <p className="text-slate-500 text-sm mt-1">Please fill out the pending school forms</p>
          </div>

          {activeForm && (
            <motion.button
              onClick={() => setActiveForm(null)}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring" }}
              className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-slate-100"
            >
              Close
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
        className="px-6 py-8 lg:px-12"
      >
        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-slate-900">Action Required</h1>
          <p className="text-slate-500 text-sm mt-1">Please fill out the pending school forms</p>

          {forms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="p-8 text-center text-slate-500"
            >
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pending forms.</p>
            </motion.div>
          ) : (
            <p className="text-sm text-slate-500">You have {forms.length} form(s) to complete.</p>
          )}
        </motion.div>

        {/* Forms List */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="space-y-4"
        >
          {forms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="p-8 text-center text-slate-500"
            >
              <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
              <p>No pending forms.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.map((f: any) => (
                <motion.div
                  key={f.id}
                  whileHover={{ y: -6, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-3xl shadow-slate-50/30 transform transition-all duration-500 hover:shadow-4xl hover:shadow-slate-50/40"
                  style={{ background: 'linear-gradient(135deg, var(--bg), var(--bg-light))' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{f.description}</p>
                    </div>

                    <motion.div className="p-3 rounded-xl bg-indigo-50/50 backdrop-blur-sm">
                      <Info className="w-4 h-4 text-indigo-400" />
                      <p className="text-xs text-indigo-600">Fill form</p>
                    </div>
                  </div>

                  <motion.button
                    onClick={() => setActiveForm(f)}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring" }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 mt-4"
                  >
                    Fill Form
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* FORM SUBMISSION MODAL */}
        {activeForm && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            whileHover={{ opacity: 0.9 }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-3xl w-full max-w-lg p-8 shadow-3xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FolderAdd className="w-5 h-5 text-indigo-500" /> {activeForm.title}
              </h2>

              <p className="text-sm text-slate-500 mb-6">{activeForm.description}</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {activeForm.schema.map((field: any) => (
                  <div key={field.id} className="space-y-2">
                    {field.type === 'TEXT' && (
                      <>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          required={field.required}
                          type="text"
                          onChange={(e: any) => setFormData({...formData, [field.id]: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                          placeholder={field.placeholder || ''}
                        />
                      </>
                    )}
                    {field.type === 'DATE' && (
                      <>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          required={field.required}
                          type="date"
                          onChange={(e: any) => setFormData({...formData, [field.id]: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        />
                      </>
                    )}
                    {field.type === 'CHECKBOX' && (
                      <label className="flex items-center gap-2 mt-4 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <input
                          required={field.required}
                          type="checkbox"
                          onChange={(e: any) => setFormData({...formData, [field.id]: e.target.checked})}
                          className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm font-medium text-slate-700">{field.label}</span>
                      </label>
                    )}
                  </div>
                ))}

                <motion.div className="flex justify-end gap-3 pt-6 border-t">
                  <motion.button
                    type="button"
                    onClick={() => setActiveForm(null)}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring" }}
                    className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring" }}
                    className="px-5 py-3 text-sm font-medium bg-indigo-600 text-white rounded-xl transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Signature'}
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}