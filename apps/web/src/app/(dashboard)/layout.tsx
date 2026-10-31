'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getMe, logout } from '@/lib/auth';
import { api } from '@/lib/api';
import { Toaster, toast } from 'sonner';

interface ModuleItem {
  name: string;
  href: string;
  icon: string;
  desc: string;
}

interface ModuleCategory {
  category: string;
  items: ModuleItem[];
}

const ALL_MODULES: ModuleCategory[] = [
  {
    category: 'Academics',
    items: [
      { name: 'Classes & Sections', href: '/classes', icon: '🏫', desc: 'Manage grades, arms & streams' },
      { name: 'Timetable', href: '/timetable', icon: '📅', desc: 'Class schedules & periods' },
      { name: 'Attendance', href: '/attendance', icon: '✅', desc: 'Daily attendance marking' },
      { name: 'Assessments', href: '/assessments', icon: '📝', desc: 'Tests, exams & coursework' },
      { name: 'Grading & Reports', href: '/grading', icon: '📊', desc: 'Score sheets & report cards' },
      { name: 'Quizzes', href: '/quizzes', icon: '❓', desc: 'Interactive classroom quizzes' },
      { name: 'CBT (Online Exams)', href: '/cbt', icon: '💻', desc: 'Computer-based examination system' },
      { name: 'Assignments', href: '/assignments', icon: '📁', desc: 'Homework & submission tracking' },
      { name: 'Calendar', href: '/calendar', icon: '🗓️', desc: 'Academic terms & event dates' },
      { name: 'Certificates', href: '/certificates', icon: '🎓', desc: 'Print student certificates' },
      { name: 'Promotions', href: '/promotions', icon: '🚀', desc: 'End of year student promotions' },
      { name: 'Substitutes', href: '/substitutes', icon: '🔄', desc: 'Cover absent teachers' },
    ]
  },
  {
    category: 'Finance & HR',
    items: [
      { name: 'Finance & Invoices', href: '/finance', icon: '💰', desc: 'Student fees & payment records' },
      { name: 'Expenses', href: '/expenses', icon: '📉', desc: 'School operational expenditure' },
      { name: 'Payroll', href: '/payroll', icon: '💵', desc: 'Salary slips & staff wages' },
      { name: 'HR & Staff Leaves', href: '/hr', icon: '👥', desc: 'Staff directory & leave requests' },
      { name: 'Assets & Inventory', href: '/assets', icon: '📦', desc: 'School assets tracking' },
      { name: 'Exports & Reports', href: '/exports', icon: '📑', desc: 'Export student & financial data' },
    ]
  },
  {
    category: 'People & Operations',
    items: [
      { name: 'Students', href: '/students', icon: '🎓', desc: 'Student directory & admissions' },
      { name: 'Teachers', href: '/teachers', icon: '👨‍🏫', desc: 'Faculty & staff profiles' },
      { name: 'Library', href: '/library', icon: '📚', desc: 'Book catalog & loans' },
      { name: 'Transport & Buses', href: '/transport', icon: '🚌', desc: 'Bus routes & vehicle tracking' },
      { name: 'Hostel & Dorms', href: '/hostel', icon: '🛏️', desc: 'Rooms & bed assignments' },
      { name: 'Cafeteria & Meals', href: '/cafeteria', icon: '🍽️', desc: 'Meal plans & cafeteria menu' },
      { name: 'Front Desk & Visitors', href: '/front-desk', icon: '🛎️', desc: 'Visitor log & admissions inquiry' },
      { name: 'Health & Physical Exams', href: '/physical-exams', icon: '🩺', desc: 'Medical records & checkups' },
      { name: 'Clubs & Activities', href: '/clubs', icon: '⚽', desc: 'Extracurricular student clubs' },
    ]
  },
  {
    category: 'Communication & Portal',
    items: [
      { name: 'Announcements', href: '/announcements', icon: '📢', desc: 'School-wide notice board' },
      { name: 'Broadcasts (SMS/Email)', href: '/broadcasts', icon: '📡', desc: 'Mass messages to parents' },
      { name: 'Messages & Chat', href: '/messages', icon: '💬', desc: 'Internal messaging system' },
      { name: 'PTM Meetings', href: '/ptm', icon: '🤝', desc: 'Parent-Teacher conference schedule' },
      { name: 'Custom Forms', href: '/forms', icon: '📋', desc: 'Surveys & application forms' },
      { name: 'Parent Forms', href: '/parent-forms', icon: '👨‍👩‍👧', desc: 'Parent submission portal' },
      { name: 'My Children', href: '/children', icon: '👶', desc: 'Parent view of enrolled children' },
    ]
  },
  {
    category: 'System & Administration',
    items: [
      { name: 'AI Insights', href: '/ai-insights', icon: '🤖', desc: 'AI predictive analytics' },
      { name: 'Audit Logs', href: '/audit-logs', icon: '🛡️', desc: 'Security & system activity trail' },
      { name: 'Automations', href: '/automations', icon: '⚡', desc: 'Scheduled robots & alerts' },
      { name: 'Roles & Permissions', href: '/roles', icon: '🔑', desc: 'Access control configuration' },
      { name: 'Public Website', href: '/website', icon: '🌐', desc: 'School public landing page builder' },
      { name: 'School Settings', href: '/settings', icon: '⚙️', desc: 'Branding, grading & terms' },
      { name: 'Platform Admin', href: '/platform', icon: '☁️', desc: 'Multi-tenant administration' },
    ]
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [roles, setRoles] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<{ firstName?: string | null; lastName?: string | null; email?: string }>({});
  const [enabledModules, setEnabledModules] = useState<string[]>([]);

  // Branding states
  const [tenantColor, setTenantColor] = useState('#1a1a2e');
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('SMS');

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // All Modules Mega Menu state
  const [showModulesMenu, setShowModulesMenu] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const modulesMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on path change
  useEffect(() => {
    setShowModulesMenu(false);
    setMobileNavOpen(false);
  }, [pathname]);

  // Click outside listener for modules menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modulesMenuRef.current && !modulesMenuRef.current.contains(event.target as Node)) {
        setShowModulesMenu(false);
      }
    }
    if (showModulesMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModulesMenu]);

  async function loadNotifications() {
    try {
      const data = await api.get<any[]>('/api/v1/notifications');
      setNotifications(data || []);
    } catch (err) {
      // Quiet fallback
    }
  }

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getMe();
        if (!user) {
          setAuthState('unauthenticated');
          router.replace('/login');
          return;
        }

        const userRoles: string[] = (user as any).roles || [];
        setRoles(userRoles);
        setUserProfile({
          firstName: (user as any).profile?.firstName || (user as any).firstName,
          lastName: (user as any).profile?.lastName || (user as any).lastName,
          email: user.email,
        });

        // Load tenant settings
        try {
          const tenant = await api.get<any>('/api/v1/tenant/current');
          if (tenant) {
            setTenantName(tenant.name || 'SMS');
            if (tenant.primaryColor) setTenantColor(tenant.primaryColor);
            if (tenant.logoUrl) setTenantLogo(tenant.logoUrl);
            if (tenant.enabledModules) setEnabledModules(tenant.enabledModules);
          }
        } catch (e) {
          // Defaults
        }

        loadNotifications();
        setAuthState('authenticated');
      } catch (err) {
        setAuthState('unauthenticated');
        router.replace('/login');
      }
    }

    checkAuth();
  }, [router]);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  async function handleResetDemo() {
    if (!window.confirm('Reset all demo data back to factory initial state?')) return;
    try {
      toast.loading('Resetting demo environment...');
      await api.post('/api/v1/demo/reset');
      toast.dismiss();
      toast.success('Demo data restored! Refreshing...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to reset demo data');
    }
  }

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 animate-pulse flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
            S
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') return null;

  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  const isAdmin = roles.includes('TENANT_ADMIN') || isSuperAdmin;
  const isAccountant = roles.includes('ACCOUNTANT');
  const isTeacher = roles.includes('TEACHER');
  const isParent = roles.includes('PARENT');
  const isStudent = roles.includes('STUDENT');
  const isRegistrar = roles.includes('REGISTRAR');
  const unreadCount = notifications.filter(n => !n.readAt).length;

  const roleLabel = isSuperAdmin 
    ? 'Super Admin' 
    : isAdmin 
    ? 'Administrator' 
    : isAccountant 
    ? 'Accountant' 
    : isTeacher 
    ? 'Teacher' 
    : isRegistrar 
    ? 'Registrar' 
    : isParent 
    ? 'Parent' 
    : isStudent 
    ? 'Student' 
    : 'Staff';

  let primaryNavLinks: { name: string; href: string }[] = [];

  if (isAccountant) {
    primaryNavLinks = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Finance & Invoices', href: '/finance' },
      { name: 'Expenses', href: '/expenses' },
      { name: 'Payroll', href: '/payroll' },
      { name: 'Students', href: '/students' },
      { name: 'Exports & Reports', href: '/exports' },
    ];
  } else if (isTeacher) {
    primaryNavLinks = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Gradebook', href: '/grading' },
      { name: 'Attendance', href: '/attendance' },
      { name: 'Assignments', href: '/assignments' },
      { name: 'Quizzes & CBT', href: '/quizzes' },
      { name: 'Timetable', href: '/timetable' },
    ];
  } else if (isStudent) {
    primaryNavLinks = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Assignments', href: '/assignments' },
      { name: 'CBT Exams', href: '/cbt' },
      { name: 'Timetable', href: '/timetable' },
      { name: 'Attendance', href: '/attendance' },
    ];
  } else if (isParent) {
    primaryNavLinks = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'My Children', href: '/children' },
      { name: 'Fees & Invoices', href: '/finance' },
      { name: 'Attendance', href: '/attendance' },
      { name: 'PTM Meetings', href: '/ptm' },
    ];
  } else if (isRegistrar) {
    primaryNavLinks = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Students', href: '/students' },
      { name: 'Classes', href: '/classes' },
      { name: 'Certificates', href: '/certificates' },
      { name: 'Promotions', href: '/promotions' },
      { name: 'Front Desk', href: '/front-desk' },
    ];
  } else {
    primaryNavLinks = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Students', href: '/students' },
      { name: 'Classes', href: '/classes' },
      { name: 'Finance', href: '/finance' },
      { name: 'Teachers', href: '/teachers' },
      { name: 'Attendance', href: '/attendance' },
    ];
  }

  return (
    <div className="relative min-h-screen flex flex-col antialiased text-slate-800">
      <Toaster position="top-right" richColors />

      {/* Floating Aurora Glow Orbs Canvas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-transparent blur-[120px] animate-aurora" />
        <div className="absolute top-1/4 -right-40 w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-pink-500/15 via-purple-500/15 to-transparent blur-[130px] animate-aurora" style={{ animationDelay: '-6s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-cyan-500/15 via-blue-500/10 to-transparent blur-[140px] animate-aurora" style={{ animationDelay: '-12s' }} />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-white/75 border-b border-white/60 shadow-[0_4px_30px_rgba(0,0,0,0.03)] transition-all">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left: Brand Logo & School Name */}
            <div className="flex items-center gap-4 min-w-0">
              <Link href="/dashboard" className="flex items-center gap-3 shrink-0 group">
                {tenantLogo ? (
                  <img src={tenantLogo} alt={tenantName} className="w-10 h-10 object-contain rounded-2xl transition-transform duration-200 group-hover:scale-105 shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center font-black text-lg shadow-[0_4px_16px_rgba(99,102,241,0.35)] transition-transform duration-300 group-hover:scale-105">
                    {tenantName.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight group-hover:text-indigo-600 transition-colors tracking-tight">
                    {tenantName}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="beacon-dot text-indigo-600" />
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-1 ml-4 overflow-x-auto scrollbar-none py-1">
                {primaryNavLinks.map((link) => (
                  <NavLink key={link.href} href={link.href} current={pathname}>
                    {link.name}
                  </NavLink>
                ))}

                {/* "All Modules" Mega-Menu Popover */}
                {(isAdmin || isAccountant) && (
                  <div className="relative" ref={modulesMenuRef}>
                    <button
                      onClick={() => setShowModulesMenu(!showModulesMenu)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        showModulesMenu
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                          : 'text-slate-700 hover:bg-white/90 hover:text-indigo-600'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span>All Modules</span>
                      <svg className={`w-3 h-3 transition-transform ${showModulesMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Mega-menu panel */}
                    {showModulesMenu && (
                      <div className="absolute left-0 mt-3 w-[880px] max-w-[92vw] glass-panel rounded-3xl border border-white/80 shadow-2xl p-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/60">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Complete School Suite</h3>
                            <p className="text-xs text-slate-500">Instant access to all modules, records, and services</p>
                          </div>
                          <span className="badge-luxe-indigo text-xs">
                            <span className="beacon-dot text-indigo-600" />
                            40+ Integrated Features
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-2">
                          {ALL_MODULES.map((category) => (
                            <div key={category.category} className="space-y-2">
                              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                {category.category}
                              </h4>
                              <div className="space-y-1">
                                {category.items.map((item) => (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setShowModulesMenu(false)}
                                    className={`flex items-start gap-2.5 p-2 rounded-xl text-left transition-all group ${
                                      pathname === item.href
                                        ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-indigo-700 font-bold border border-indigo-200/50'
                                        : 'hover:bg-white/80 text-slate-700'
                                    }`}
                                  >
                                    <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold group-hover:text-indigo-600 transition-colors truncate">
                                        {item.name}
                                      </p>
                                      <p className="text-[11px] text-slate-400 truncate">
                                        {item.desc}
                                      </p>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </nav>
            </div>

            {/* Right: Notifications, Reset Demo, Profile & Logout */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Notification Button */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="p-2 rounded-xl bg-white/80 hover:bg-white border border-slate-200/70 transition-all relative flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-xs"
                  title="Notifications"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-tr from-rose-500 to-pink-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotifs && (
                  <>
                    <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs" onClick={() => setShowNotifs(false)} />
                    <div className="absolute right-0 mt-3 w-80 glass-panel rounded-2xl border border-white/80 shadow-2xl overflow-hidden z-50 max-h-96">
                      <div className="p-4 border-b border-slate-100 bg-white/50 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">System Notifications</span>
                        <button onClick={() => setShowNotifs(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                      </div>
                      <div className="max-h-80 overflow-y-auto p-4 space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-center text-xs text-slate-400 py-4">No new alerts</p>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-3 rounded-xl bg-white/70 border border-slate-100 hover:bg-white transition-colors">
                              <p className="text-xs font-bold text-slate-900">{n.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Reset Demo Data button */}
              <button
                onClick={handleResetDemo}
                className="hidden sm:inline-flex text-xs font-bold text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-300/40 px-3 py-1.5 rounded-xl transition-all items-center gap-1.5 shadow-xs"
                title="Reset demo data back to default initial state"
              >
                <span>🔄</span>
                <span>Reset Demo</span>
              </button>

              {/* User Profile Pill */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200/80">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {userProfile.firstName?.charAt(0) || 'U'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 leading-none">
                    {userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName || ''}` : 'User'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{roleLabel}</span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-slate-600 hover:text-rose-600 bg-white/80 hover:bg-rose-50 border border-slate-200/70 hover:border-rose-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign out</span>
              </button>

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="lg:hidden p-2 rounded-xl bg-white/80 border border-slate-200/70 text-slate-600 shadow-xs"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileNavOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-slate-200/70 glass-panel p-4 max-h-[80vh] overflow-y-auto space-y-4">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">Quick Access</p>
              {primaryNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-xs font-bold ${
                    pathname === link.href ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:bg-white/80'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="border-t border-slate-200/60 pt-3 space-y-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">All Modules</p>
              {ALL_MODULES.map((category) => (
                <div key={category.category} className="space-y-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase px-3">{category.category}</p>
                  <div className="grid grid-cols-2 gap-1 px-1">
                    {category.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-white/80"
                      >
                        <span>{item.icon}</span>
                        <span className="truncate">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, current, children }: { href: string; current: string; children: React.ReactNode }) {
  const isActive = current === href || (href !== '/dashboard' && current.startsWith(href));
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap tracking-tight ${
        isActive
          ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-md shadow-indigo-500/25'
          : 'text-slate-600 hover:text-indigo-600 hover:bg-white/80'
      }`}
    >
      {children}
    </Link>
  );
}
