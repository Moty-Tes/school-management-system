'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { sonner } from '@/components/sonner';

export default function StudentProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [healthRecord, setHealthRecord] = useState<any>(null);
  const [behaviorLogs, setBehaviorLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  // Modals State
  const [isBehaviorOpen, setIsBehaviorOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [isVisitOpen, setIsVisitOpen] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);

  // Form States
  const [behaviorData, setBehaviorData] = useState({ type: 'POSITIVE', title: '', description: '' });
  const [healthData, setHealthData] = useState({ bloodType: '', allergies: '', chronicConditions: '', emergencyContactName: '', emergencyContactPhone: '' });
  const [visitData, setVisitData] = useState({ symptoms: '', treatment: '', medication: '' });
  const [certData, setCertData] = useState({ title: 'Certificate of Achievement', description: 'For outstanding performance and dedication.' });

  // AI State
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [isGeneratingComment, setIsGeneratingComment] = useState(false);

  async function loadData() {
    try {
      const [profileData, behaviorRes, healthRes, meData] = await Promise.all([
        api.get(`/api/v1/students/${id}/profile`),
        api.get(`/api/v1/behavior/student/${id}`),
        api.get(`/api/v1/health/${id}/record`).catch(() => null),
        getMe()
      ]);
      setData(profileData);
      setBehaviorLogs(behaviorRes);
      setHealthRecord(healthRes);
      setIsStaff(
        (meData as any).roles?.includes('TEACHER') || 
        (meData as any).roles?.includes('TENANT_ADMIN') || 
        (meData as any).roles?.includes('SUPER_ADMIN')
      );
      if (healthRes) setHealthData(healthRes);
    } catch (err) {
      router.push('/students');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [id, router]);

  if (loading) return <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!data) return null;

  const { student, attendance, recentGrades, finances } = data;
  const getAtt = (status: string) => attendance.find((a: any) => a.status === status)?._count.status || 0;

  // --- DOWNLOAD HANDLERS ---
  function handleDownloadReport() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    window.open(`${apiUrl}/api/v1/reports/students/${id}/report-card`, '_blank');
  }

  function handleDownloadIdCard() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    window.open(`${apiUrl}/api/v1/reports/students/${id}/id-card`, '_blank');
  }

  function handleDownloadTranscript() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    window.open(`${apiUrl}/api/v1/reports/students/${id}/transcript`, '_blank');
  }

  function handleDownloadCertificate() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const query = new URLSearchParams({
      title: certData.title,
      description: certData.description
    }).toString();
    window.open(`${apiUrl}/api/v1/reports/students/${id}/certificate?${query}`, '_blank');
    setIsCertOpen(false);
  }

  // --- FORM HANDLERS ---
  async function handleLogBehavior(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/behavior', { ...behaviorData, studentId: id });
    setIsBehaviorOpen(false);
    setBehaviorData({ type: 'POSITIVE', title: '', description: '' });
    loadData();
  }

  async function handleSaveHealth(e: FormEvent) {
    e.preventDefault();
    await api.post(`/api/v1/health/${id}/record`, healthData);
    setIsHealthOpen(false);
    loadData();
    sonner.success('Health record updated!');
  }

  async function handleLogVisit(e: FormEvent) {
    e.preventDefault();
    await api.post(`/api/v1/health/${id}/visit`, visitData);
    setIsVisitOpen(false);
    setVisitData({ symptoms: '', treatment: '', medication: '' });
    sonner.success('Clinic visit logged and parents notified!');
  }

  async function generateComment() {
    setIsGeneratingComment(true);
    try {
      const res = await api.get<{ comment: string }>(`/api/v1/ai/comment/${id}`);
      setAiComment(res.comment);
    } catch {
      sonner.error('Failed to generate comment');
    } finally {
      setIsGeneratingComment(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <Link href="/students" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back to Students
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-20 -mt-20 opacity-50 pointer-events-none"></div>

        {student.photoUrl ? (
          <img src={`http://localhost:4000${student.photoUrl}`} alt={student.firstName} className="w-28 h-28 rounded-full object-cover bg-slate-100 border-4 border-white shadow-md relative z-10" />
        ) : (
          <div className="w-28 h-28 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-4xl border-4 border-white shadow-md relative z-10">
            {student.firstName[0]}{student.lastName[0]}
          </div>
        )}
        
        <div className="flex-1 text-center md:text-left relative z-10">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{student.firstName} {student.lastName}</h1>
          <p className="text-slate-500 font-mono mt-1 text-sm bg-slate-100 inline-block px-2 py-0.5 rounded">{student.admissionNumber}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">{student.class ? `${student.class.name} - ${student.class.section}` : 'Unassigned'}</span>
            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">{student.status}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 min-w-[220px] relative z-10 w-full md:w-auto">
          <button onClick={handleDownloadReport} className="bg-indigo-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">Report Card</button>
          <button onClick={handleDownloadIdCard} className="bg-slate-800 text-white py-2 rounded-lg text-xs font-medium hover:bg-slate-900 transition-colors">ID Card</button>
          <button onClick={handleDownloadTranscript} className="bg-emerald-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors">Official Transcript</button>
          {isStaff && (
            <button onClick={() => setIsCertOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-xs font-medium transition-colors shadow-sm">🏆 Award Certificate</button>
          )}
          {isStaff && (
            <button onClick={() => setIsVisitOpen(true)} className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-xs font-medium transition-colors">+ Log Clinic Visit</button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Attendance</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Present</span><span className="font-bold text-emerald-600">{getAtt('PRESENT')}</span></div>
            <div className="flex justify-between"><span>Absent</span><span className="font-bold text-red-600">{getAtt('ABSENT')}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Finance</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Billed</span><span className="font-mono">{finances.totalBilled.toLocaleString()}</span></div>
            <div className="flex justify-between font-bold"><span>Balance</span><span className={finances.balance > 0 ? 'text-red-600' : 'text-emerald-600'}>{finances.balance.toLocaleString()} ETB</span></div>
          </div>
        </div>
        
        {/* HEALTH RECORD BOX */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm border-t-4 border-t-red-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Medical Info</h3>
            {isStaff && <button onClick={() => setIsHealthOpen(true)} className="text-xs text-indigo-600 font-bold hover:underline">Edit</button>}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Blood Type</span><span className="font-bold text-red-600">{healthRecord?.bloodType || 'Unknown'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Allergies</span><span className="font-bold text-amber-600 text-right max-w-[120px] truncate">{healthRecord?.allergies || 'None'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Emergency</span><span className="font-mono text-xs">{healthRecord?.emergencyContactPhone || '-'}</span></div>
          </div>
        </div>
      </div>

      {/* Behavior Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Behavior & Wellbeing</h3>
          {isStaff && <button onClick={() => setIsBehaviorOpen(true)} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium">+ Log Note</button>}
        </div>
        <div className="p-6 space-y-4">
          {behaviorLogs.length === 0 ? (
            <p className="text-sm text-slate-500">No behavior records found.</p>
          ) : (
            behaviorLogs.map(log => (
              <div key={log.id} className={`p-4 rounded-xl border-l-4 ${log.type === 'POSITIVE' ? 'border-l-emerald-500 bg-emerald-50/30' : 'border-l-red-500 bg-red-50/30'}`}>
                <h4 className="font-bold text-slate-900 text-sm">{log.type === 'POSITIVE' ? '🌟' : '⚠️'} {log.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{log.description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI COMMENT GENERATOR */}
      {isStaff && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-indigo-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                ✨ AI Report Card Assistant
              </h3>
              <p className="text-sm text-slate-500">Generate a personalized comment based on academic and behavior data.</p>
            </div>
            <button 
              onClick={generateComment} 
              disabled={isGeneratingComment}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isGeneratingComment ? 'Generating...' : 'Generate Comment'}
            </button>
          </div>
          
          {aiComment && (
            <div className="bg-white p-4 rounded-xl border border-indigo-100 text-sm text-slate-700 italic relative">
              "{aiComment}"
              <button 
                onClick={() => { navigator.clipboard.writeText(aiComment); sonner.success('Copied to clipboard!'); }}
                className="absolute top-2 right-2 text-xs font-bold text-indigo-600 hover:underline not-italic"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent Grades Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Recent Assessments</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-xs uppercase font-semibold text-slate-500">
              <th className="py-3 px-6">Date</th>
              <th className="py-3 px-6">Assessment</th>
              <th className="py-3 px-6 text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {recentGrades.length === 0 ? (
              <tr><td colSpan={3} className="py-8 text-center text-slate-400">No grades recorded yet.</td></tr>
            ) : (
              recentGrades.map((grade: any) => {
                const percentage = ((grade.score / grade.assessment.maxScore) * 100).toFixed(1);
                return (
                  <tr key={grade.id} className="hover:bg-slate-50">
                    <td className="py-3 px-6 text-slate-500">{new Date(grade.assessment.date).toLocaleDateString()}</td>
                    <td className="py-3 px-6 font-medium text-slate-900">{grade.assessment.title}</td>
                    <td className="py-3 px-6 text-right">
                      <span className="font-bold text-indigo-600">{grade.score}</span>
                      <span className="text-slate-400 text-xs"> / {grade.assessment.maxScore} ({percentage}%)</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODALS ================= */}

      {/* LOG BEHAVIOR MODAL */}
      {isBehaviorOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Log Behavior Incident</h2>
            <form onSubmit={handleLogBehavior} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Behavior Type</label>
                <select value={behaviorData.type} onChange={e => setBehaviorData({...behaviorData, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="POSITIVE">🌟 Positive (Merit)</option>
                  <option value="NEGATIVE">⚠️ Negative (Demerit)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Title</label>
                <input required type="text" value={behaviorData.title} onChange={e => setBehaviorData({...behaviorData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Outstanding Participation" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description (Optional)</label>
                <textarea rows={3} value={behaviorData.description} onChange={e => setBehaviorData({...behaviorData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Provide details..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsBehaviorOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Save & Notify Parents</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLINIC VISIT MODAL */}
      {isVisitOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-red-600">Log Clinic Visit</h2>
            <form onSubmit={handleLogVisit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Symptoms</label>
                <input required type="text" value={visitData.symptoms} onChange={e => setVisitData({...visitData, symptoms: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Headache and fever" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Treatment / Action</label>
                <input required type="text" value={visitData.treatment} onChange={e => setVisitData({...visitData, treatment: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Rest and water" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Medication Given</label>
                <input type="text" value={visitData.medication} onChange={e => setVisitData({...visitData, medication: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Paracetamol" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsVisitOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Save & Notify Parents</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE HEALTH RECORD MODAL */}
      {isHealthOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Update Medical Record</h2>
            <form onSubmit={handleSaveHealth} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Blood Type</label>
                  <input type="text" value={healthData.bloodType} onChange={e => setHealthData({...healthData, bloodType: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. O+" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Emergency Phone</label>
                  <input type="text" value={healthData.emergencyContactPhone} onChange={e => setHealthData({...healthData, emergencyContactPhone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Allergies</label>
                <input type="text" value={healthData.allergies} onChange={e => setHealthData({...healthData, allergies: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Peanuts, Penicillin" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Chronic Conditions</label>
                <input type="text" value={healthData.chronicConditions} onChange={e => setHealthData({...healthData, chronicConditions: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Asthma" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsHealthOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AWARD CERTIFICATE MODAL */}
      {isCertOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-amber-600">Issue Award Certificate</h2>
            <p className="text-sm text-slate-500 mb-4">Generate a beautiful PDF award for {student.firstName}.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Award Title</label>
                <input type="text" value={certData.title} onChange={e => setCertData({...certData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Student of the Month" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description / Reason</label>
                <textarea rows={3} value={certData.description} onChange={e => setCertData({...certData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. For exceptional leadership and academic excellence." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsCertOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button onClick={handleDownloadCertificate} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}