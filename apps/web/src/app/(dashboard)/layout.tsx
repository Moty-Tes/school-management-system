'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getMe, logout } from '@/lib/auth';
import { api } from '@/lib/api';
import { Toaster } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [roles, setRoles] = useState<string[]>([]);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);

  // Branding states - tenant's primary color with Tailwind built-in color support
  const [tenantColor, setTenantColor] = useState('#1a1a2e');
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('SMS');

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  async function loadNotifications() {
    try {
      const data = await api.get<any[]>('/api/v1/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }

  async function handleMarkRead(id: string, link?: string) {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      await loadNotifications();
      if (link) router.push(link);
      setShowNotifs(false);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
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

        if (settingsData) {
          setEnabledModules(settingsData.enabledModules || []);

          // Use tenant's primary color with fallback
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
      alert('Demo has been reset!');
      window.location.reload();
    } catch { alert('Failed to reset demo data'); }
  }

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col antialiased">
      {/* Premium gradient header */}
      <header className="bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200 sticky top-0 z-50 shadow-2xl shadow-slate-50/30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            <div className="flex items-center gap-6 flex-1 min-w-0">
              <Link href="/dashboard" className="flex items-center gap-2 shrink-0 group">
                {tenantLogo ? (
                  <img src={tenantLogo} alt={tenantName} className="w-8 h-8 object-contain rounded-lg transition-transform duration-300 hover:scale-105" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-500 text-primary-50 flex items-center justify-center font-bold text-sm transition-colors hover:text-primary-400">
                    {tenantName.charAt(0)}
                  </div>
                )}
                <span className="font-semibold text-slate-900 hidden lg:block truncate max-w-[120px] transition-colors group-hover:text-primary-600">{tenantName}</span>
              </Link>

              {/* Modern nav with premium animations */}
              <nav className="hidden md:flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide py-2" aria-label="Main navigation">
                <ul className="flex items-center gap-2 space-x-2 px-2">
                  <li>
                    <NavLink href="/dashboard" current={pathname} className="relative p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      pathname === '/dashboard' ? 'bg-primary-50 text-primary font-medium' : 'text-slate-600 hover:text-primary-500 hover:bg-primary-50/20'
                    }">
                      <span className="inline-block">Dashboard</span>
                      <span className="absolute -inset-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink href="/students" current={pathname} className="relative p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      pathname?.includes('/students') ? 'bg-primary-50 text-primary font-medium' : 'text-slate-600 hover:text-primary-500 hover:bg-primary-50/20'
                    }">
                      Students
                    </NavLink>
                  </li>
                  <li>
                    <NavLink href="/classes" current={pathname} className="relative p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      pathname?.includes('/classes') ? 'bg-primary-50 text-primary font-medium' : 'text-slate-600 hover:text-primary-500 hover:bg-primary-50/20'
                    }">
                      Classes
                    </NavLink>
                  </li>
                  <li>
                    <NavLink href="/finance" current={pathname} className="relative p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      pathname?.includes('/finance') ? 'bg-primary-50 text-primary font-medium' : 'text-slate-600 hover:text-primary-500 hover:bg-primary-50/20'
                    }">
                      Finance
                    </NavLink>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Enhanced action buttons with premium design */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-4">
              <div className="relative">
                <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-slate-50 relative flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600 transition-colors group-hover:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" role="alert">{unreadCount} New</span>}
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                {showNotifs && (
                  <>
                    <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowNotifs(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300 max-h-96">
                      <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-900">Notifications</span>
                        <button onClick={() => setShowNotifs(false)} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Close</button>
                      </div>
                      <div className="max-h-80 overflow-y-auto space-y-2 p-4">
                        {notifications.length === 0 ? (
                          <p className="text-center text-sm text-slate-500">No notifications yet.</p>
                        ) : (
                          <div className="space-y-1">
                            {notifications.map(n => (
                              <div key={n.id} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                                <div className="flex items-start gap-3">
                                  <p className="text-sm font-medium text-slate-900 flex-1">{n.title}</p>
                                  <p className="text-xs text-slate-500 line-clamp-1">{n.message}</p>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <button onClick={handleResetDemo} className="text-xs font-medium text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-md transition-all duration-200 hidden sm:block">Reset Demo</button>
                <button onClick={handleLogout} className="text-sm font-medium text-slate-600 hover:text-slate-900 font-medium transition-colors whitespace-nowrap hover:underline">Sign out</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50 min-h-fit">
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
        isActive ? 'bg-primary-50 text-primary font-medium shadow-sm' : 'text-slate-600 hover:text-primary-500 hover:bg-primary-50/20 transition-colors'
      }`}
    >
      {children}
    </Link>
  );
}