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
  
  // Branding states
  const [tenantColor, setTenantColor] = useState('#4f46e5');
  const [tenantLogo, setTenantLogo] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('SMS');

  useEffect(() => {
    let mounted = true;
    
    // Fetch both user data and tenant branding settings
    Promise.all([
      getMe(),
      api.get<any>('/api/v1/tenant/settings')
    ]).then(([meData, settingsData]) => {
      if (mounted) {
        setAuthState('authenticated');
        setRoles(meData.roles || []);
        
        // Apply dynamic branding
        if (settingsData.primaryColor) setTenantColor(settingsData.primaryColor);
        if (settingsData.logoUrl) setTenantLogo(settingsData.logoUrl);
        if (settingsData.name) setTenantName(settingsData.name);
      }
    }).catch(() => {
      if (!mounted) return;
      setAuthState('unauthenticated');
      router.replace('/login');
    });
    
    return () => { mounted = false; };
  }, [router]);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Ignore errors
    }
    router.replace('/login');
  }

  async function handleResetDemo() {
    if (!window.confirm("Are you sure you want to reset the demo data? This will restore all original demo users.")) return;
    try {
      await api.post('/api/v1/demo/reset');
      alert('Demo has been reset!');
      window.location.reload(); 
    } catch (err) {
      alert('Failed to reset demo data');
    }
  }

  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return null;
  }

  // Role checks for navigation
  const isAdmin = roles.includes('TENANT_ADMIN') || roles.includes('SUPER_ADMIN');
  const isTeacher = roles.includes('TEACHER');
  const isParent = roles.includes('PARENT');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dynamic CSS for Tenant Branding */}
      <style>{`
        .bg-brand { background-color: ${tenantColor}; }
        .text-brand { color: ${tenantColor}; }
        .border-brand { border-color: ${tenantColor}; }
      `}</style>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Side: Logo & Nav Links */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                {tenantLogo ? (
                  <img src={tenantLogo} alt="Logo" className="w-8 h-8 object-contain rounded" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center font-bold text-sm">
                    {tenantName.charAt(0)}
                  </div>
                )}
                <span className="font-semibold text-slate-900 hidden sm:block">{tenantName}</span>
              </Link>
              
              <nav className="hidden md:flex items-center gap-1">
                <NavLink href="/dashboard" current={pathname}>Dashboard</NavLink>
                
                {/* Admin & Teachers see Students */}
                {(isAdmin || isTeacher) && (
                  <NavLink href="/students" current={pathname}>Students</NavLink>
                )}

                {/* Admin sees Teachers, Classes, Finance */}
                {isAdmin && <NavLink href="/teachers" current={pathname}>Teachers</NavLink>}
                {(isAdmin || isTeacher) && <NavLink href="/classes" current={pathname}>Classes</NavLink>}
                {(isAdmin || isTeacher) && <NavLink href="/attendance" current={pathname}>Attendance</NavLink>}
                {(isAdmin || isTeacher) && <NavLink href="/assessments" current={pathname}>Assessments</NavLink>}
                {isAdmin && <NavLink href="/finance" current={pathname}>Finance</NavLink>}
                {isAdmin && <NavLink href="/settings" current={pathname}>Settings</NavLink>}
                
                {/* Parents see My Children */}
                {isParent && <NavLink href="/my-children" current={pathname}>My Children</NavLink>}

                {/* Everyone sees Announcements */}
                <NavLink href="/announcements" current={pathname}>Announcements</NavLink>
              </nav>
            </div>

            {/* Right Side: Action Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleResetDemo}
                className="text-xs font-medium text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-md transition-colors hidden sm:block"
                title="Restore demo students to their default state"
              >
                Reset Demo
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                Sign out
              </button>
            </div>
            
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        isActive ? 'bg-brand text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      {children}
    </Link>
  );
}