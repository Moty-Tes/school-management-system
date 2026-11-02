'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getMe, logout } from '@/lib/auth';
import { api } from '@/lib/api';
import { Toaster } from 'sonner';
import {
  Users, CreditCard, BookOpen, Clock, Settings,
  BarChart3, DollarSign, Receipt, ArrowUpRight, CheckCircle2,
  AlertCircle, FileText, Calendar, PlusCircle, Sparkles, TrendingUp,
  Shield, GraduationCap, ArrowRight, Award, Layers,
  X, Menu, LogOut, Bell, Home, ChevronRight, ChevronDown, Check,
  LayoutGrid, Building2, Utensils, Heart, Mail, MessageSquare,
  MessageCircle, Truck, Lock, Globe, Server, Zap
} from 'lucide-react';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface ModuleItem {
  name: string;
  href: string;
  icon: string;
  desc: string;
  allowedRoles?: string[];
}

interface ModuleCategory {
  category: string;
  items: ModuleItem[];
}

const ALL_MODULES: ModuleCategory[] = [
  {
    category: 'Academics',
    items: [
      { name: 'Classes & Sections', href: '/classes', icon: 'Users', desc: 'Manage grades, arms & streams', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR', 'TEACHER'] },
      { name: 'Timetable', href: '/timetable', icon: 'Calendar', desc: 'Class schedules & periods', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR', 'TEACHER', 'STUDENT', 'PARENT'] },
      { name: 'Attendance', href: '/attendance', icon: 'Clock', desc: 'Daily attendance marking', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR', 'TEACHER', 'STUDENT', 'PARENT'] },
      { name: 'Assessments', href: '/assessments', icon: 'BookOpen', desc: 'Tests, exams & coursework', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR', 'TEACHER'] },
      { name: 'Grading & Reports', href: '/grading', icon: 'DollarSign', desc: 'Score sheets & report cards', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR', 'TEACHER'] },
      { name: 'Quizzes', href: '/quizzes', icon: 'Sparkles', desc: 'Interactive classroom quizzes', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'TEACHER', 'STUDENT'] },
      { name: 'CBT (Online Exams)', href: '/cbt', icon: 'Shield', desc: 'Computer-based examination system', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'TEACHER', 'STUDENT'] },
      { name: 'Assignments', href: '/assignments', icon: 'FileText', desc: 'Homework & submission tracking', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'TEACHER', 'STUDENT'] },
      { name: 'Calendar', href: '/calendar', icon: 'Calendar', desc: 'Academic terms & event dates', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR', 'TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT'] },
      { name: 'Certificates', href: '/certificates', icon: 'Award', desc: 'Print student certificates', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR'] },
      { name: 'Promotions', href: '/promotions', icon: 'Award', desc: 'End of year student promotions', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR'] },
      { name: 'Substitutes', href: '/substitutes', icon: 'Users', desc: 'Cover absent teachers', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'TEACHER'] },
    ]
  },
  {
    category: 'Finance & HR',
    items: [
      { name: 'Finance & Invoices', href: '/finance', icon: 'DollarSign', desc: 'Student fees & payment records', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'ACCOUNTANT', 'PARENT'] },
      { name: 'Expenses', href: '/expenses', icon: 'Receipt', desc: 'School operational expenditure', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'ACCOUNTANT'] },
      { name: 'Payroll', href: '/payroll', icon: 'CreditCard', desc: 'Salary slips & staff wages', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'ACCOUNTANT'] },
      { name: 'HR & Staff Leaves', href: '/hr', icon: 'Users', desc: 'Staff directory & leave requests', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'ACCOUNTANT', 'TEACHER'] },
      { name: 'Assets & Inventory', href: '/assets', icon: 'BookOpen', desc: 'School assets tracking', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'ACCOUNTANT'] },
      { name: 'Exports & Reports', href: '/exports', icon: 'Receipt', desc: 'Export student & financial data', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'ACCOUNTANT', 'REGISTRAR'] },
    ]
  },
  {
    category: 'People & Operations',
    items: [
      { name: 'Students', href: '/students', icon: 'Users', desc: 'Student directory & admissions', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR', 'ACCOUNTANT', 'TEACHER'] },
      { name: 'Teachers', href: '/teachers', icon: 'Users', desc: 'Faculty & staff profiles', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR'] },
      { name: 'Library', href: '/library', icon: 'BookOpen', desc: 'Book catalog & loans', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'TEACHER', 'STUDENT'] },
      { name: 'Transport & Buses', href: '/transport', icon: 'Truck', desc: 'Bus routes & vehicle tracking', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'PARENT', 'STUDENT'] },
      { name: 'Hostel & Dorms', href: '/hostel', icon: 'Building', desc: 'Rooms & bed assignments', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'STUDENT', 'PARENT'] },
      { name: 'Cafeteria & Meals', href: '/cafeteria', icon: 'Utensils', desc: 'Meal plans & cafeteria menu', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'STUDENT', 'PARENT', 'TEACHER'] },
      { name: 'Front Desk & Visitors', href: '/front-desk', icon: 'Building', desc: 'Visitor log & admissions inquiry', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR'] },
      { name: 'Health & Physical Exams', href: '/physical-exams', icon: 'Heart', desc: 'Medical records & checkups', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'TEACHER', 'PARENT'] },
      { name: 'Clubs & Activities', href: '/clubs', icon: 'Users', desc: 'Extracurricular student clubs', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'TEACHER', 'STUDENT'] },
    ]
  },
  {
    category: 'Communication & Portal',
    items: [
      { name: 'Announcements', href: '/announcements', icon: 'MessageSquare', desc: 'School-wide notice board', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT', 'REGISTRAR'] },
      { name: 'Broadcasts (SMS/Email)', href: '/broadcasts', icon: 'Mail', desc: 'Mass messages to parents', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR'] },
      { name: 'Messages & Chat', href: '/messages', icon: 'MessageCircle', desc: 'Internal messaging system', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT', 'REGISTRAR'] },
      { name: 'PTM Meetings', href: '/ptm', icon: 'Calendar', desc: 'Parent-Teacher conference schedule', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'TEACHER', 'PARENT'] },
      { name: 'Custom Forms', href: '/forms', icon: 'FileText', desc: 'Surveys & application forms', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR'] },
      { name: 'Parent Forms', href: '/parent-forms', icon: 'FileText', desc: 'Parent submission portal', allowedRoles: ['PARENT'] },
      { name: 'My Children', href: '/children', icon: 'Users', desc: 'Parent view of enrolled children', allowedRoles: ['PARENT'] },
    ]
  },
  {
    category: 'System & Administration',
    items: [
      { name: 'AI Insights', href: '/ai-insights', icon: 'Sparkles', desc: 'AI predictive analytics', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
      { name: 'Audit Logs', href: '/audit-logs', icon: 'Shield', desc: 'Security & system activity trail', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
      { name: 'Automations', href: '/automations', icon: 'Zap', desc: 'Scheduled robots & alerts', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
      { name: 'Roles & Permissions', href: '/roles', icon: 'Lock', desc: 'Access control configuration', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
      { name: 'Public Website', href: '/website', icon: 'Globe', desc: 'School public landing page builder', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
      { name: 'School Settings', href: '/settings', icon: 'Settings', desc: 'Branding, grading & terms', allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
      { name: 'Platform Admin', href: '/platform', icon: 'Server', desc: 'Multi-tenant administration', allowedRoles: ['SUPER_ADMIN'] },
    ]
  }
];

function getAuthorizedModules(categories: ModuleCategory[], userRoles: string[]): ModuleCategory[] {
  if (userRoles.includes('SUPER_ADMIN')) {
    return categories;
  }
  return categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => {
        if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
        return item.allowedRoles.some((role) => userRoles.includes(role));
      }),
    }))
    .filter((category) => category.items.length > 0);
}

function renderModuleIcon(iconName: string, className = "w-4 h-4 shrink-0") {
  switch (iconName) {
    case 'Users': return <Users className={className} />;
    case 'Calendar': return <Calendar className={className} />;
    case 'Clock': return <Clock className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'DollarSign': return <DollarSign className={className} />;
    case 'Receipt': return <Receipt className={className} />;
    case 'CreditCard': return <CreditCard className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'FileText': return <FileText className={className} />;
    case 'Award': return <Award className={className} />;
    case 'Settings': return <Settings className={className} />;
    case 'Truck': return <Truck className={className} />;
    case 'Building': return <Building2 className={className} />;
    case 'Utensils': return <Utensils className={className} />;
    case 'Heart': return <Heart className={className} />;
    case 'MessageSquare': return <MessageSquare className={className} />;
    case 'Mail': return <Mail className={className} />;
    case 'MessageCircle': return <MessageCircle className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Lock': return <Lock className={className} />;
    case 'Globe': return <Globe className={className} />;
    case 'Server': return <Server className={className} />;
    default: return <Layers className={className} />;
  }
}

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

  // All Modules Mega Menu & Mobile Drawer state
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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1B4F8C] to-neutral-800 flex items-center justify-center text-white font-bold text-xl shadow-sm">
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

  // Filter modules based on user roles
  const authorizedModules = getAuthorizedModules(ALL_MODULES, roles);

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
    <div className="relative min-h-screen antialiased flex flex-col bg-neutral-50 dark:bg-neutral-900">
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
                    className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1B4F8C] to-neutral-800 text-white flex items-center justify-center font-bold text-lg shadow-sm transition-transform duration-300 group-hover:scale-105"
                  >
                    {tenantName.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-neutral-900 dark:text-white text-sm sm:text-base leading-tight group-hover:text-brand-primary transition-colors tracking-tight truncate max-w-[160px] sm:max-w-[240px]">
                    {tenantName}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden lg:flex items-center gap-2 ml-4">
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
                {authorizedModules.length > 0 && (
                  <div className="relative" ref={modulesMenuRef}>
                    <button
                      onClick={() => setShowModulesMenu(!showModulesMenu)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${showModulesMenu ? 'bg-brand-primary/10 text-brand-primary' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
                      title="All Modules"
                    >
                      <LayoutGrid className="w-4 h-4 shrink-0 text-brand-primary" />
                      <span>All Modules</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showModulesMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Mega-menu panel */}
                    {showModulesMenu && (
                      <div
                        className="absolute left-0 mt-3 w-[920px] max-w-[96vw] rounded-2xl bg-white dark:bg-neutral-900 border border-border dark:border-border-overlay shadow-2xl p-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
                      >
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border dark:border-border-overlay">
                          <div>
                            <h3 className="text-base font-extrabold text-neutral-900 dark:text-white tracking-tight">
                              School Portal Directory
                            </h3>
                            <p className="text-xs text-slate-400">Authorized modules and services for your role</p>
                          </div>
                          <span className="text-xs font-semibold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full">
                            Role-Authorized
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto pr-2">
                          {authorizedModules.map((category) => (
                            <div key={category.category} className="space-y-2">
                              <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                                {category.category}
                              </h4>
                              <div className="space-y-1">
                                {category.items.map((item) => (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setShowModulesMenu(false)}
                                    className={`flex items-start gap-2.5 rounded-xl px-3 py-2 transition-all group ${pathname === item.href ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}
                                  >
                                    <div className="mt-0.5 text-brand-primary">
                                      {renderModuleIcon(item.icon, "w-4 h-4 shrink-0")}
                                    </div>
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

            {/* Right: Notifications, Profile, Logout & Mobile Hamburger */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Notification Button */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all relative flex items-center justify-center text-neutral-600 hover:text-neutral-900 shadow-sm"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
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
                      className="absolute right-0 mt-3 w-80 rounded-2xl bg-white dark:bg-neutral-900 border border-border dark:border-border-overlay shadow-xl overflow-hidden z-50 max-h-96"
                    >
                      <div className="p-4 border-b border-border dark:border-border-overlay bg-neutral-50 dark:bg-neutral-800 flex justify-between items-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">System Notifications</span>
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
                              className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-border dark:border-border-overlay hover:bg-neutral-100 transition-colors"
                            >
                              <p className="text-xs font-medium text-neutral-900 dark:text-white">{n.title}</p>
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

              {/* User Profile Pill (Desktop) */}
              <div className="hidden sm:flex items-center gap-2 px-2 border-l border-border dark:border-border-overlay">
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B4F8C] to-neutral-800 text-white font-bold text-xs flex items-center justify-center shadow-sm"
                >
                  {tenantLogo ? (
                    <img src={tenantLogo} alt={tenantName} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <span>{userProfile.firstName ? userProfile.firstName.charAt(0) : 'U'}</span>
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white leading-none">
                    {userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName || ''}` : 'User'}
                  </span>
                  <span className="text-[10px] text-neutral-500 mt-0.5">{roleLabel}</span>
                </div>
              </div>

              {/* Desktop Sign Out Button */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex text-xs font-medium text-neutral-600 hover:text-rose-600 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 px-3 py-1.5 rounded-lg border border-border dark:border-border-overlay transition-all items-center gap-1.5 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Sign out</span>
              </button>

              {/* Mobile Menu Hamburger (Opens Full Drawer) */}
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="lg:hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 p-2 text-neutral-700 dark:text-neutral-200 transition-all shadow-sm"
                aria-label="Toggle Navigation Menu"
              >
                {mobileNavOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer (For Android & Mobile Phones) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 right-0 w-[85vw] max-w-sm bg-white dark:bg-neutral-900 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border dark:border-border-overlay flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1B4F8C] to-neutral-800 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {tenantName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{tenantName}</p>
                  <p className="text-[10px] text-[#E86524] font-semibold uppercase tracking-wider">{roleLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="p-3 mx-3 mt-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/60 border border-border dark:border-border-overlay flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1B4F8C]/15 text-[#1B4F8C] font-bold text-sm flex items-center justify-center shrink-0">
                {userProfile.firstName ? userProfile.firstName.charAt(0) : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  {userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName || ''}` : 'School User'}
                </p>
                <p className="text-[10px] text-neutral-500 truncate">{userProfile.email || 'Active Account'}</p>
              </div>
            </div>

            {/* Scrollable Navigation List */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
              {/* Primary Quick Links */}
              <div>
                <p className="px-2 pb-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Main Navigation
                </p>
                <div className="space-y-1">
                  {primaryNavLinks.map((link) => {
                    const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileNavOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-[#1B4F8C] text-white shadow-sm'
                            : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-white' : 'bg-[#1B4F8C]'}`} />
                        <span className="truncate">{link.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Authorized School Modules */}
              {authorizedModules.length > 0 && (
                <div className="pt-2 border-t border-border dark:border-border-overlay">
                  <p className="px-2 pb-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    School Directory
                  </p>
                  <div className="space-y-3">
                    {authorizedModules.map((category) => (
                      <div key={category.category} className="space-y-1">
                        <p className="px-2 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                          {category.category}
                        </p>
                        <div className="grid grid-cols-1 gap-1">
                          {category.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileNavOpen(false)}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                                  isActive
                                    ? 'bg-[#1B4F8C]/10 text-[#1B4F8C] font-bold'
                                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                              >
                                <div className="text-[#1B4F8C]">
                                  {renderModuleIcon(item.icon, "w-4 h-4 shrink-0")}
                                </div>
                                <span className="truncate">{item.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer with Sign Out */}
            <div className="p-3 border-t border-border dark:border-border-overlay bg-neutral-50 dark:bg-neutral-800/60">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main
        className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 relative z-10"
      >
        {children}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar for Android / Mobile Phones */}
      <nav className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white/95 dark:bg-neutral-900/95 border-t border-border dark:border-border-overlay backdrop-blur-md px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            pathname === '/dashboard' ? 'text-[#1B4F8C] font-bold' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        {isParent ? (
          <Link
            href="/children"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              pathname.startsWith('/children') ? 'text-[#1B4F8C] font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Children</span>
          </Link>
        ) : isTeacher ? (
          <Link
            href="/attendance"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              pathname.startsWith('/attendance') ? 'text-[#1B4F8C] font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>Attendance</span>
          </Link>
        ) : isStudent ? (
          <Link
            href="/assignments"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              pathname.startsWith('/assignments') ? 'text-[#1B4F8C] font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Tasks</span>
          </Link>
        ) : (
          <Link
            href="/students"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              pathname.startsWith('/students') ? 'text-[#1B4F8C] font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Students</span>
          </Link>
        )}

        {isStudent ? (
          <Link
            href="/timetable"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              pathname.startsWith('/timetable') ? 'text-[#1B4F8C] font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Schedule</span>
          </Link>
        ) : (
          <Link
            href="/finance"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              pathname.startsWith('/finance') ? 'text-[#1B4F8C] font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span>Finance</span>
          </Link>
        )}

        {isTeacher ? (
          <Link
            href="/grading"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              pathname.startsWith('/grading') ? 'text-[#1B4F8C] font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Award className="w-5 h-5" />
            <span>Grades</span>
          </Link>
        ) : isStudent ? (
          <Link
            href="/cbt"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              pathname.startsWith('/cbt') ? 'text-[#1B4F8C] font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span>Exams</span>
          </Link>
        ) : (
          <Link
            href="/classes"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
              pathname.startsWith('/classes') ? 'text-[#1B4F8C] font-bold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Classes</span>
          </Link>
        )}

        <button
          onClick={() => setMobileNavOpen(true)}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            mobileNavOpen ? 'text-[#1B4F8C] font-bold' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span>Modules</span>
        </button>
      </nav>
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
  const activeClasses = `${baseClasses} bg-[#1B4F8C]/10 text-[#1B4F8C] font-bold`;
  const defaultClasses = `${baseClasses} text-neutral-700 dark:text-neutral-300 hover:text-[#1B4F8C] hover:bg-neutral-100 dark:hover:bg-neutral-700`;

  return (
    <Link
      href={href}
      className={isActive ? activeClasses : defaultClasses}
    >
      {children}
    </Link>
  );
}
