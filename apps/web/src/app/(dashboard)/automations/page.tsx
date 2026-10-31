'use client';

export default function AutomationsPage() {
  const automations = [
    {
      title: 'Daily Absence Alerts',
      description: 'Pushes a real-time notification to parents if their child is marked absent.',
      time: 'Every day at 10:00 AM',
      status: 'ACTIVE',
      icon: '⚠️',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      title: 'Fee Due Reminders',
      description: 'Scans unpaid invoices and alerts parents 3 days before the due date.',
      time: 'Every day at 8:00 AM',
      status: 'ACTIVE',
      icon: '💰',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: 'Contract Expiry Alerts',
      description: 'Notifies Admins 30 days before a teacher contract expires.',
      time: 'Every day at 9:00 AM',
      status: 'ACTIVE',
      icon: '⏳',
      color: 'bg-red-50 text-red-700 border-red-200'
    },
    {
      title: 'Student Birthdays',
      description: 'Sends a warm birthday wish to parents and students on their special day.',
      time: 'Every day at 7:00 AM',
      status: 'ACTIVE',
      icon: '🎂',
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Automation Hub</h1>
        <p className="text-slate-500 text-sm mt-1">Your background workers running silently on the server</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {automations.map((auto, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className={`p-4 border-b ${auto.color} flex items-center gap-3`}>
              <div className="text-2xl">{auto.icon}</div>
              <div>
                <h3 className="font-bold">{auto.title}</h3>
                <p className="text-xs font-semibold opacity-80">{auto.time}</p>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <p className="text-sm text-slate-600 mb-6">{auto.description}</p>
              <div className="flex justify-between items-center border-t pt-4">
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  {auto.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">node-cron</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg mt-8">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Enterprise Background Engine
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          These tasks are executed via <strong>Cron Jobs</strong>. They run even when you are logged out. This saves your administrators hours of manual messaging and ensures no parent is left uninformed.
        </p>
      </div>
    </div>
  );
}