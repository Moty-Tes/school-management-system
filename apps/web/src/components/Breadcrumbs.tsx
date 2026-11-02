'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, Building2 } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  students: 'Students Directory',
  classes: 'Classes & Sections',
  teachers: 'Teachers & Faculty',
  attendance: 'Attendance Management',
  finance: 'Finance & Invoices',
  expenses: 'Operating Expenses',
  payroll: 'Payroll & Compensation',
  timetable: 'Master Timetable',
  assignments: 'Assignments & LMS',
  grading: 'Gradebook & Reports',
  cbt: 'CBT Examination Portal',
  quizzes: 'Classroom Quizzes',
  assessments: 'Assessment Governance',
  announcements: 'Notice Board',
  messages: 'Communications',
  library: 'Library Catalog',
  transport: 'Transport & Fleet',
  hostel: 'Hostel & Residential',
  cafeteria: 'Cafeteria & Dining',
  'front-desk': 'Front Desk & Visitors',
  'physical-exams': 'Health & Physical Exams',
  clubs: 'Extracurricular Clubs',
  calendar: 'Academic Calendar',
  certificates: 'Certificates & Transcripts',
  promotions: 'Academic Promotions',
  substitutes: 'Substitute Coverage',
  ptm: 'Parent-Teacher Conferences',
  forms: 'Custom Forms & Surveys',
  'parent-forms': 'Parent Portal Submissions',
  children: 'Enrolled Children',
  'ai-insights': 'Predictive Risk & Analytics',
  'audit-logs': 'System Audit Trail',
  automations: 'Automated Operations',
  roles: 'Roles & Access Control',
  website: 'Public Portal Configuration',
  settings: 'School Institutional Settings',
  platform: 'Multi-Tenant Platform Admin',
};

interface BreadcrumbsProps {
  tenantName?: string;
}

export function Breadcrumbs({ tenantName }: BreadcrumbsProps) {
  const pathname = usePathname();

  // If on root dashboard, render a concise workspace status indicator
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0 || pathname === '/dashboard') {
    return (
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-200/60 dark:border-neutral-800/60 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
          <Building2 className="w-3.5 h-3.5 text-[#1B4F8C] shrink-0" aria-hidden="true" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">{tenantName || 'School Workspace'}</span>
          <span className="text-slate-300 dark:text-neutral-700">•</span>
          <span className="text-[11px] text-slate-500">Live Academic Operations</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>System Online</span>
        </div>
      </div>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="pb-4 mb-2 border-b border-slate-200/60 dark:border-neutral-800/60">
      <ol className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 hover:text-[#1B4F8C] dark:hover:text-blue-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const label = ROUTE_LABELS[segment] || segment.replace(/-/g, ' ');

          return (
            <React.Fragment key={href}>
              <li aria-hidden="true">
                <ChevronRight className="w-3 h-3 text-slate-300 dark:text-neutral-600 shrink-0" />
              </li>
              <li>
                {isLast ? (
                  <span
                    aria-current="page"
                    className="font-bold text-slate-900 dark:text-white capitalize"
                  >
                    {label}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="hover:text-[#1B4F8C] dark:hover:text-blue-400 transition-colors capitalize"
                  >
                    {label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
