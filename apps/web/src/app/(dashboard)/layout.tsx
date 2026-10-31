'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getMe, logout } from '@/lib/auth';
import { api } from '@/lib/api';
import { Toaster, toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Users, CreditCard, BookOpen, Clock, Settings,
  BarChart3, DollarSign, Receipt, ArrowUpRight, CheckCircle2,
  AlertCircle, FileText, Calendar, PlusCircle, Sparkles, TrendingUp,
  Shield, GraduationCap, ArrowRight, Award, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, CartesianGrid,
  XAxis, YAxis, Tooltip, Cell, Legend, PieChart, Pie,
  AreaChart, Area, Line, Cell as LineCell, XAxis as LineXAxis, YAxis as LineYAxis
} from 'recharts';
import {
  Card, KpiCard, EmptyState, Skeleton, Table, TableHeadCell, TableRowCell, Button, TableSection, KpiEmptyState
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

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
      { name: 'Classes & Sections', href: '/classes', icon: 'Users', desc: 'Manage grades, arms & streams' },
      { name: 'Timetable', href: '/timetable', icon: 'Calendar', desc: 'Class schedules & periods' },
      { name: 'Attendance', href: '/attendance', icon: 'Clock', desc: 'Daily attendance marking' },
      { name: 'Assessments', href: '/assessments', icon: 'BookOpen', desc: 'Tests, exams & coursework' },
      { name: 'Grading & Reports', href: '/grading', icon: 'DollarSign', desc: 'Score sheets & report cards' },
      { name: 'Quizzes', href: '/quizzes', icon: 'Sparkles', desc: 'Interactive classroom quizzes' },
      { name: 'CBT (Online Exams)', href: '/cbt', icon: 'Shield', desc: 'Computer-based examination system' },
      { name: 'Assignments', href: '/assignments', icon: 'FileText', desc: 'Homework & submission tracking' },
      { name: 'Calendar', href: '/calendar', icon: 'Calendar', desc: 'Academic terms & event dates' },
      { name: 'Certificates', href: '/certificates', icon: 'Award', desc: 'Print student certificates' },
      { name: 'Promotions', href: '/promotions', icon: 'Award', desc: 'End of year student promotions' },
      { name: 'Substitutes', href: '/substitutes', icon: 'Users', desc: 'Cover absent teachers' },
    ]
  },
  {
    category: 'Finance & HR',
    items: [
      { name: 'Finance & Invoices', href: '/finance', icon: 'DollarSign', desc: 'Student fees & payment records' },
      { name: 'Expenses', href: '/expenses', icon: 'Receipt', desc: 'School operational expenditure' },
      { name: 'Payroll', href: '/payroll', icon: 'CreditCard', desc: 'Salary slips & staff wages' },
      { name: 'HR & Staff Leaves', href: '/hr', icon: 'Users', desc: 'Staff directory & leave requests' },
      { name: 'Assets & Inventory', href: '/assets', icon: 'BookOpen', desc: 'School assets tracking' },
      { name: 'Exports & Reports', href: '/exports', icon: 'Receipt', desc: 'Export student & financial data' },
    ]
  },
  {
    category: 'People & Operations',
    items: [
      { name: 'Students', href: '/students', icon: 'Users', desc: 'Student directory & admissions' },
      { name: 'Teachers', href: '/teachers', icon: 'Users', desc: 'Faculty & staff profiles' },
      { name: 'Library', href: '/library', icon: 'BookOpen', desc: 'Book catalog & loans' },
      { name: 'Transport & Buses', href: '/transport', icon: 'Truck', desc: 'Bus routes & vehicle tracking' },
      { name: 'Hostel & Dorms', href: '/hostel', icon: 'Building', desc: 'Rooms & bed assignments' },
      { name: 'Cafeteria & Meals', href: '/cafeteria', icon: 'Utensils', desc: 'Meal plans & cafeteria menu' },
      { name: 'Front Desk & Visitors', href: '/front-desk', icon: 'Building', desc: 'Visitor log & admissions inquiry' },
      { name: 'Health & Physical Exams', href: '/physical-exams', icon: 'Heart', desc: 'Medical records & checkups' },
      { name: 'Clubs & Activities', href: '/clubs', icon: 'Users', desc: 'Extracurricular student clubs' },
    ]
  },
  {
    category: 'Communication & Portal',
    items: [
      { name: 'Announcements', href: '/announcements', icon: 'MessageSquare', desc: 'School-wide notice board' },
      { name: 'Broadcasts (SMS/Email)', href: '/broadcasts', icon: 'Mail', desc: 'Mass messages to parents' },
      { name: 'Messages & Chat', href: '/messages', icon: 'MessageCircle', desc: 'Internal messaging system' },
      { name: 'PTM Meetings', href: '/ptm', icon: 'Calendar', desc: 'Parent-Teacher conference schedule' },
      { name: 'Custom Forms', href: '/forms', icon: 'Form', desc: 'Surveys & application forms' },
      { name: 'Parent Forms', href: '/parent-forms', icon: 'Form', desc: 'Parent submission portal' },
      { name: 'My Children', href: '/children', icon: 'Users', desc: 'Parent view of enrolled children' },
    ]
  },
  {
    category: 'System & Administration',
    items: [
      { name: 'AI Insights', href: '/ai-insights', icon: 'Sparkles', desc: 'AI predictive analytics' },
      { name: 'Audit Logs', href: '/audit-logs', icon: 'Shield', desc: 'Security & system activity trail' },
      { name: 'Automations', href: '/automations', icon: 'Zap', desc: 'Scheduled robots & alerts' },
      { name: 'Roles & Permissions', href: '/roles', icon: 'Lock', desc: 'Access control configuration' },
      { name: 'Public Website', href: '/website', icon: 'Globe', desc: 'School public landing page builder' },
      { name: 'School Settings', href: '/settings', icon: 'Settings', desc: 'Branding, grading & terms' },
      { name: 'Platform Admin', href: '/platform', icon: 'Server', desc: 'Multi-tenant administration' },
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
  const [tenantColor, setTenantColor] = useState('#1e293b');
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('School');

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // All Modules Mega Menu state
  const [showModulesMenu, setShowModulesMenu] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const modulesMenuRef = useRef<HTMLDivElement>(null);

  // Reduced motion preference
  const reducedMotion = use_reducedMotion();

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
            setTenantName(tenant.name || 'School');
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

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-primary to-neutral-800 flex items-center justify-center text-white font-bold text-xl shadow-sm">
            S
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Workspace...</p>
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

  // Determine if user is on a dashboard sub-page
  const isDashboardPage = pathname.startsWith('/dashboard');
  const dashboardSection = isDashboardPage ? pathname.replace('/dashboard', '') || 'dashboard' : null;

  return (
    <div className="relative min-h-screen antialiased">
      <Toaster position="top-right" richColors />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-border dark:border-border-overlay">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">

            {/* Left: Brand Logo & School Name */}
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/dashboard" className="flex items-center gap-3 shrink-0 group">
                {tenantLogo ? (
                  <img
                    src={tenantLogo}
                    alt={tenantName}
                    className="w-10 h-10 rounded-lg object-contain transition-transform duration-200 hover:scale-105 shadow-sm"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-primary to-neutral-800 text-white flex items-center justify-center font-bold text-lg shadow-sm transition-transform duration-300 group-hover:scale-105"
                  >
                    {tenantName.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-extrabold text-neutral-900 text-sm sm:text-base leading-tight group-hover:text-brand-primary transition-colors tracking-tight">
                    {tenantName}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center gap-1.5 text-xs" />
                    <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-widest">
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-2">
                {primaryNavLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    href={link.href}
                    current={pathname}
                    reducedMotion={reducedMotion}>
                    {link.name}
                  </NavLink>
                ))}

                {/* "All Modules" Mega-Menu Popover */}
                {(isAdmin || isAccountant) && (
                  <div className="relative">
                    <button
                      onClick={() => setShowModulesMenu(!showModulesMenu)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${showModulesMenu ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                      title="All Modules"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span>All Modules</span>
                      <svg className={`w-3 h-3 transition-transform ${showModulesMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Mega-menu panel */}
                    {showModulesMenu && (
                      <div
                        className={`absolute left-0 mt-3 w-[920px] max-w-[96vw] rounded-2xl border border-border dark:border-border-overlay shadow-lg p-6 z-50 animate-in fade-in slide-in-from-top-3 duration-300`}
                      >
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border dark:border-border-overlay">
                          <div>
                            <h3 className="text-base font-extrabold text-neutral-900 tracking-tight">
                              Complete School Suite
                            </h3>
                            <p className="text-xs text-slate-400">Instant access to all modules, records, and services</p>
                          </div>
                          <span className="text-xs text-neutral-500">
                            <span className="flex items-center gap-1.5" />
                            40+ Integrated Features
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[75vh] overflow-y-auto pr-2">
                          {ALL_MODULES.map((category) => (
                            <div key={category.category} className="space-y-2">
                              <h4 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                                {category.category}
                              </h4>
                              <div className="space-y-1">
                                {category.items.map((item) => (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setShowModulesMenu(false)}
                                    className={`flex items-start gap-2 rounded-xl px-3 py-1.5 transition-all group ${pathname === item.href ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700'}`}
                                  >
                                    <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium group-hover:text-brand-primary transition-colors truncate">
                                        {item.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 truncate">
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

            {/* Right: Notifications, Profile & Logout */}
            <div className="flex items-center gap-2 sm:gap-3 flex-row-reverse shrink-0">
              {/* Notification Button */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className={`p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all relative flex items-center justify-center text-neutral-600 hover:text-neutral-900 shadow-sm`}
                  title="Notifications"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-primary text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popover */}
                {showNotifs && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-neutral-900/30 dark:bg-neutral-900/50 backdrop-blur-xs"
                      onClick={() => setShowNotifs(false)}
                    />
                    <div
                      className="absolute right-0 mt-3 w-80 rounded-2xl border dark:border-border-overlay shadow-lg overflow-hidden z-50 max-h-96"
                    >
                      <div className="p-4 border-b dark:border-border-overlay bg-neutral-950/50 flex justify-between items-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">System Notifications</span>
                        <button
                          onClick={() => setShowNotifs(false)}
                          className="text-xs text-neutral-500 hover:text-neutral-400"
                        >
                          Close
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto p-4 space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-center text-xs text-neutral-400 py-4">No new alerts</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className="p-3 rounded-lg bg-neutral-900/50 dark:bg-neutral-800/50 border border-border dark:border-border-overlay hover:bg-neutral-900/60 transition-colors"
                            >
                              <p className="text-xs font-medium text-neutral-900">{n.title}</p>
                              <p className="text-[10px] text-neutral-500 mt-0.5">{n.message}</p>
                              <p className="text-[9px] text-neutral-400 mt-1">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Profile Pill */}
              <div className="hidden sm:flex items-center gap-2 px-2 border-l border-border dark:border-border-overlay">
                <div
                  className={`w-8 h-8 rounded-full ${tenantLogo ? 'object-contain' : 'bg-gradient-to-br from-brand-primary to-neutral-800'} text-white font-bold text-xs flex items-center justify-center shadow-sm`}
                >
                  {tenantLogo
                    ? (
                      <img
                        src={tenantLogo}
                        alt={tenantName}
                        className="w-5 h-5 rounded-full"
                      />
                    )
                    : (
                      <span
                        className="line-clamp-1"
                        style={{ fontWeight: 600 }}
                        >{tenantName.charAt(0)}</span
                      >
                    )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-neutral-900 leading-none">
                    {userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName || ''}` : 'User'}
                  </span>
                  <span className="text-[10px] text-neutral-500 mt-0.5">{roleLabel}</span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-neutral-600 hover:text-brand-primary bg-white dark:bg-neutral-900 hover:bg-neutral-950 dark:hover:bg-neutral-800 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign out</span>
              </button>

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="lg:hidden rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-2 transition-all shadow-sm"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileNavOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 bg-neutral-50 dark:bg-neutral-900"
      >
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  current,
  children,
  reducedMotion,
}: {
  href: string;
  current: string;
  children: React.ReactNode;
  reducedMotion: boolean;
}) {
  const isActive = current === href || (href !== '/dashboard' && current.startsWith(href));

  // Apply reduced motion if preferred
  const baseClasses = `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap tracking-tight ${reducedMotion ? 'transition-none' : ''}`;
  const activeClasses = `${baseClasses} bg-brand-primary/10 text-brand-primary`;
  const defaultClasses = `${baseClasses} text-neutral-700 hover:text-brand-primary hover:bg-neutral-100 dark:hover:bg-neutral-700`;

  return (
    <Link
      href={href}
      className={isActive ? activeClasses : defaultClasses}
    >
      {children}
    </Link>
  );
}

