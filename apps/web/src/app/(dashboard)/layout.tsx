'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getMe, logout } from '@/lib/auth';
import { api } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [roles, setRoles] = useState<string[]>([]);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  
  // Branding states
  const [tenantColor, setTenantColor] = useState('#4f46e5');
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('SMS');

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  async function loadNotifications() {
    try {
      const data = await api.get<any[]>('/api/v1/notifications');
      setNotifications(data);
    } catch {}
  }

  async function handleMarkRead(id: string, link?: string) {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      loadNotifications();
      if (link) router.push(link);
      setShowNotifs(false);
    } catch {}
  }

  useEffect(() => {
    let mounted = true;
    
    Promise.all([
      getMe(),
      api.get<any>('/api/v1/tenant/settings')
    ]).then(([meData, settingsData]) => {
      if (mounted) {
        setAuthState('authenticated');
        setRoles(meData.roles || []);
        setEnabledModules(settingsData.enabledModules || []);
        
        if (settingsData.primaryColor) setTenantColor(settingsData.primaryColor);
        if (settingsData.logoUrl) setTenantLogo(settingsData.logoUrl);
        if (settingsData.name) setTenantName(settingsData.name);

        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
      }
    }).catch(() => {
      if (!mounted) return;
      setAuthState('unauthenticated');
      router.replace('/login');
    });
    
    return () => { mounted = false; };
  }, [router]);

  async function handleLogout() {
    try { await logout(); } catch {}
    router.replace('/login');
  }

  async function handleResetDemo() {
    if (!window.confirm("Are you sure you want to reset the demo data?")) return;
    try {
      await api.post('/api/v1/demo/reset');
      alert('Demo has been reset!');
      window.location.reload(); 
    } catch { alert('Failed to reset demo data'); }
  }

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authState === 'unauthenticated') return null;

  const isAdmin = roles.includes('TENANT_ADMIN') || roles.includes('SUPER_ADMIN');
  const isTeacher = roles.includes('TEACHER');
  const isParent = roles.includes('PARENT');
  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  const unreadCount = notifications.filter(n => !n.readAt).length;

  // Helper function to check if a module is enabled for this school
  const hasModule = (moduleName: string) => enabledModules.includes(moduleName);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <style>{`
        .bg-brand { background-color: ${tenantColor}; }
        .text-brand { color: ${tenantColor}; }
        .border-brand { border-color: ${tenantColor}; }
      `}</style>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div className="flex items-center gap-6 flex-1 min-w-0">
              <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
                {tenantLogo ? (
                  <img src={tenantLogo} alt="Logo" className="w-8 h-8 object-contain rounded" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center font-bold text-sm">
                    {tenantName.charAt(0)}
                  </div>
                )}
                <span className="font-semibold text-slate-900 hidden lg:block truncate max-w-[120px]">{tenantName}</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide py-2">
                <NavLink href="/dashboard" current={pathname}>Dashboard</NavLink>
                
                {/* CORE MODULES */}
                {hasModule('students') && (isAdmin || isTeacher) && <NavLink href="/students" current={pathname}>Students</NavLink>}
                {hasModule('admissions') && isAdmin && <NavLink href="/admissions" current={pathname}>Admissions</NavLink>}
                {hasModule('teachers') && isAdmin && <NavLink href="/teachers" current={pathname}>Teachers</NavLink>}
                {hasModule('classes') && (isAdmin || isTeacher) && <NavLink href="/classes" current={pathname}>Classes</NavLink>}
                {hasModule('timetable') && (isAdmin || isTeacher) && <NavLink href="/timetable" current={pathname}>Timetable</NavLink>}
                
                {/* ACADEMICS */}
                {hasModule('attendance') && (isAdmin || isTeacher) && <NavLink href="/attendance" current={pathname}>Attendance</NavLink>}
                {hasModule('assessments') && (isAdmin || isTeacher) && <NavLink href="/assessments" current={pathname}>Assessments</NavLink>}
                {hasModule('lms') && (isAdmin || isTeacher) && <NavLink href="/assignments" current={pathname}>Assignments</NavLink>}
                {hasModule('cbt') && (isAdmin || isTeacher) && <NavLink href="/quizzes" current={pathname}>Quizzes</NavLink>}
                
                {/* FINANCE & HR */}
                {hasModule('finance') && isAdmin && <NavLink href="/finance" current={pathname}>Finance</NavLink>}
                {hasModule('expenses') && isAdmin && <NavLink href="/expenses" current={pathname}>Expenses</NavLink>}
                {hasModule('payroll') && (isAdmin || isTeacher) && <NavLink href="/payroll" current={pathname}>Payroll</NavLink>}
                {hasModule('hr') && (isAdmin || isTeacher) && <NavLink href="/hr" current={pathname}>HR & Leave</NavLink>}
                
                {/* PREMIUM MODULES (Level 2/3) */}
                {hasModule('library') && <NavLink href="/library" current={pathname}>Library</NavLink>}
                {hasModule('transport') && isAdmin && <NavLink href="/transport" current={pathname}>Transport</NavLink>}
                {hasModule('cafeteria') && (isAdmin || isTeacher) && <NavLink href="/cafeteria" current={pathname}>Cafeteria</NavLink>}
                {hasModule('hostel') && isAdmin && <NavLink href="/hostel" current={pathname}>Hostel</NavLink>}
                {hasModule('frontdesk') && isAdmin && <NavLink href="/front-desk" current={pathname}>Front Desk</NavLink>}
                
                {/* COMMUNICATION */}
                {hasModule('messages') && <NavLink href="/messages" current={pathname}>Messages</NavLink>}
                {hasModule('announcements') && <NavLink href="/announcements" current={pathname}>Announcements</NavLink>}
                {hasModule('ptm') && <NavLink href="/ptm" current={pathname}>PTM Meetings</NavLink>}
                
                {/* MISC */}
                {isParent && <NavLink href="/my-children" current={pathname}>My Children</NavLink>}
                {hasModule('settings') && isAdmin && <NavLink href="/settings" current={pathname}>Settings</NavLink>}
                {isSuperAdmin && <NavLink href="/platform" current={pathname}>Platform Admin</NavLink>}
                {hasModule('clubs') && (isAdmin || isTeacher) && <NavLink href="/clubs" current={pathname}>Clubs</NavLink>}
                {hasModule('fundraising') && (isAdmin || isTeacher) && <NavLink href="/fundraising" current={pathname}>Fundraising</NavLink>}
               {hasModule('analytics') && (isAdmin || isTeacher) && <NavLink href="/analytics" current={pathname}>Analytics</NavLink>}
                {hasModule('diary') && (isAdmin || isTeacher) && <NavLink href="/diary" current={pathname}>Diary</NavLink>}
                {hasModule('exam') && (isAdmin) && <NavLink href="/exams" current={pathname}>Exams</NavLink>}
                {(isAdmin || isTeacher) && <NavLink href="/forms" current={pathname}>Form Builder</NavLink>}
                {isParent && <NavLink href="/parent-forms" current={pathname}>Action Required</NavLink>}
                {hasModule('certificates') && (isAdmin || isTeacher) && <NavLink href="/certificates" current={pathname}>Certificates</NavLink>}
                {hasModule('website') && (isAdmin) && <NavLink href="/website" current={pathname}>Website</NavLink>}
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-4">
              <div className="relative">
                <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors relative focus:outline-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                </button>

                {showNotifs && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-900">Notifications</span>
                        {unreadCount > 0 && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="p-6 text-center text-sm text-slate-500">No notifications yet.</p>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} onClick={() => handleMarkRead(n.id, n.link)} className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${!n.readAt ? 'bg-indigo-50/40' : ''}`}>
                              <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button onClick={handleResetDemo} className="text-xs font-medium text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-md transition-colors hidden sm:block">Reset Demo</button>
              <button onClick={handleLogout} className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors whitespace-nowrap">Sign out</button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, current, children }: { href: string; current: string; children: React.ReactNode }) {
  const isActive = current === href;
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive ? 'bg-brand text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {children}
    </Link>
  );
}