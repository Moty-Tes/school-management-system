'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getMe, logout } from '@/lib/auth';
import { api } from '@/lib/api';
import { Toaster } from 'sonner';

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
      console.error('Failed to load notifications:', err);
    }
  }

  useEffect(() => {
    let mounted = true;

    Promise.all([
      getMe(),
      api.get<any>('/api/v1/tenant/settings').catch(() => null)
    ]).then(([meData, settingsData]) => {
      if (mounted) {
        setAuthState('authenticated');
        setRoles(meData.roles || []);
        setUserProfile({
          firstName: meData.firstName,
          lastName: meData.lastName,
          email: meData.email,
        });

        if (settingsData) {
          setEnabledModules(settingsData.enabledModules || []);
          if (settingsData.primaryColor) setTenantColor(settingsData.primaryColor);
          if (settingsData.logoUrl) setTenantLogo(settingsData.logoUrl);
          if (settingsData.name) setTenantName(settingsData.name);
        }

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
      alert('Demo data has been reset successfully!');
      window.location.reload();
    } catch { 
      alert('Failed to reset demo data'); 
    }
  }

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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

  // Determine current active role display label
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

  // Role-specific primary navigation links
  let primaryNavLinks: { name: string; href: string }[] = [];

  if (isAccountant) {
    primaryNavLinks = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Finance & Invoices', href: '/finance' },
      { name: 'Expenses', href: '/expenses' },
      { name: 'Payroll', href: '/payroll' },
      { name: 'Students', href: '/students' },
      { name: 'Exports & Reports', href: '/exports' },
      { name: 'Announcements', href: '/announcements' },
      { name: 'Messages', href: '/messages' },
    ];
  } else if (isTeacher) {
    primaryNavLinks = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Attendance', href: '/attendance' },
      { name: 'Classes', href: '/classes' },
      { name: 'Students', href: '/students' },
      { name: 'Timetable', href: '/timetable' },
      { name: 'Assessments', href: '/assessments' },
      { name: 'Grading', href: '/grading' },
      { name: 'Assignments', href: '/assignments' },
      { name: 'Messages', href: '/messages' },
    ];
  } else if (isParent) {
    primaryNavLinks = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'My Children', href: '/children' },
      { name: 'Fees & Invoices', href: '/finance' },
      { name: 'PTM Meetings', href: '/ptm' },
      { name: 'Parent Forms', href: '/parent-forms' },
      { name: 'Announcements', href: '/announcements' },
      { name: 'Messages', href: '/messages' },
    ];
  } else if (isStudent) {
    primaryNavLinks = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'My Schedule', href: '/timetable' },
      { name: 'Attendance', href: '/attendance' },
      { name: 'Assignments', href: '/assignments' },
      { name: 'CBT Exams', href: '/cbt' },
      { name: 'Library', href: '/library' },
      { name: 'Cafeteria', href: '/cafeteria' },
      { name: 'Messages', href: '/messages' },
    ];
  } else if (isRegistrar) {
    primaryNavLinks = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Students', href: '/students' },
      { name: 'Classes', href: '/classes' },
      { name: 'Certificates', href: '/certificates' },
      { name: 'Promotions', href: '/promotions' },
      { name: 'Front Desk', href: '/front-desk' },
      { name: 'Messages', href: '/messages' },
    ];
  } else {
    // Admin / Super Admin primary links
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
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      <Toaster position="top-right" richColors />

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left: Brand Logo & School Name */}
            <div className="flex items-center gap-4 min-w-0">
              <Link href="/dashboard" className="flex items-center gap-3 shrink-0 group">
                {tenantLogo ? (
                  <img src={tenantLogo} alt={tenantName} className="w-9 h-9 object-contain rounded-lg transition-transform duration-200 group-hover:scale-105" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {tenantName.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-sm sm:text-base leading-tight group-hover:text-indigo-600 transition-colors">
                    {tenantName}
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                    {roleLabel}
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-1 ml-4 overflow-x-auto scrollbar-none py-1">
                {primaryNavLinks.map((link) => (
                  <NavLink key={link.href} href={link.href} current={pathname}>
                    {link.name}
                  </NavLink>
                ))}

                {/* "All Modules" Mega-Menu Popover (Available for Admins & Accountants) */}
                {(isAdmin || isAccountant) && (
                  <div className="relative" ref={modulesMenuRef}>
                    <button
                      onClick={() => setShowModulesMenu(!showModulesMenu)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        showModulesMenu
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span>All Modules</span>
                      <svg className={`w-3.5 h-3.5 transition-transform ${showModulesMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Mega-menu panel */}
                    {showModulesMenu && (
                      <div className="absolute left-0 mt-2 w-[850px] max-w-[90vw] bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">All School Modules</h3>
                            <p className="text-xs text-slate-500">Quickly navigate to any area of the school management system</p>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                            40+ Features Ready
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-2">
                          {ALL_MODULES.map((category) => (
                            <div key={category.category} className="space-y-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {category.category}
                              </h4>
                              <div className="space-y-1">
                                {category.items.map((item) => (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setShowModulesMenu(false)}
                                    className={`flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors group ${
                                      pathname === item.href
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'hover:bg-slate-50 text-slate-700'
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
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors relative flex items-center justify-center text-slate-600 hover:text-slate-900"
                  title="Notifications"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotifs && (
                  <>
                    <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs" onClick={() => setShowNotifs(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 max-h-96">
                      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-900">Notifications</span>
                        <button onClick={() => setShowNotifs(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                      </div>
                      <div className="max-h-80 overflow-y-auto p-4 space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-center text-sm text-slate-500 py-4">No notifications yet.</p>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                              <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
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
                className="hidden sm:inline-flex text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors items-center gap-1.5"
                title="Reset demo data back to default initial state"
              >
                <span>🔄</span>
                <span>Reset Demo</span>
              </button>

              {/* User Identity / Sign Out */}
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign out</span>
              </button>

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="lg:hidden p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
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
          <div className="lg:hidden border-t border-slate-200 bg-white p-4 max-h-[80vh] overflow-y-auto space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase text-slate-400 px-3 py-1">Quick Access</p>
              {primaryNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                    pathname === link.href ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-3">
              <p className="text-xs font-bold uppercase text-slate-400 px-3 py-1">All Modules</p>
              {ALL_MODULES.map((category) => (
                <div key={category.category} className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-500 uppercase px-3">{category.category}</p>
                  <div className="grid grid-cols-2 gap-1 px-1">
                    {category.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className="flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
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
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
        isActive
          ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-xs'
          : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </Link>
  );
}
