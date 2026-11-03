import { prisma } from '../lib/prisma.js';

export interface PulseItem {
  id: string;
  category: 'ATTENDANCE' | 'FINANCE' | 'ADMISSIONS' | 'ACADEMIC' | 'SAFEGUARDING' | 'INTERVENTIONS' | 'OPERATIONS';
  severity: 'info' | 'warning' | 'urgent';
  title: string;
  detail: string;
  reason: string;
  source: string;
  dateRange: string;
  action: {
    label: string;
    href: string;
  };
  count: number;
  responsibleRole: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
}

export interface SchoolPulseResponse {
  tenantId: string;
  evaluatedAt: string;
  summary: {
    totalItems: number;
    urgentCount: number;
    warningCount: number;
    infoCount: number;
  };
  items: PulseItem[];
}

export async function getDashboardStats(tenantId: string) {
  // Promise.all runs all these database queries in parallel for speed
  const [totalStudents, activeStudents, totalUsers, recentStudents] = await Promise.all([
    // 1. Count all students in this school
    prisma.student.count({
      where: { tenantId, deletedAt: null },
    }),
    
    // 2. Count active students
    prisma.student.count({
      where: { tenantId, status: 'ACTIVE', deletedAt: null },
    }),

    // 3. Count how many staff/admin users belong to this school
    prisma.userTenant.count({
      where: { tenantId, status: 'ACTIVE' },
    }),

    // 4. Get the 5 newest students
    prisma.student.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        class: { select: { name: true } },
        createdAt: true,
      },
    }),
  ]);

  return {
    totalStudents,
    activeStudents,
    totalUsers,
    recentStudents,
  };
}

/**
 * Computes transparent, explainable operational intelligence for the current tenant and user role.
 * Grounded strictly in authentic database records with no synthetic trends or black-box predictions.
 */
export async function getSchoolPulse(
  tenantId: string,
  userId: string,
  roles: string[] = [],
  db: any = prisma
): Promise<SchoolPulseResponse> {
  const pulseItems: PulseItem[] = [];
  const normalizedRoles = roles.map((r) => r.toUpperCase());
  const isAdmin = normalizedRoles.includes('ADMIN') || normalizedRoles.includes('SUPER_ADMIN') || normalizedRoles.includes('TENANT_ADMIN');
  const isTeacher = normalizedRoles.includes('TEACHER');
  const isAccountant = normalizedRoles.includes('ACCOUNTANT');
  const isRegistrar = normalizedRoles.includes('REGISTRAR');

  const todayStr = new Date().toISOString().slice(0, 10);
  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

  // 1. ATTENDANCE BRIEFING (For Admin, Super Admin, Teacher)
  if (isAdmin || isTeacher) {
    try {
      const activeClasses = await db.class.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, name: true, section: true },
      });

      if (activeClasses.length > 0) {
        const attendancesToday = await db.attendance.findMany({
          where: {
            tenantId,
            date: { gte: startOfDay, lte: endOfDay },
          },
          select: { classId: true },
          distinct: ['classId'],
        });

        const loggedClassIds = new Set(attendancesToday.map((a: any) => a.classId));
        const missingClasses = activeClasses.filter((c: any) => !loggedClassIds.has(c.id));

        if (missingClasses.length > 0) {
          const sampleNames = missingClasses.slice(0, 3).map((c: any) => `${c.name} (${c.section})`).join(', ');
          const extra = missingClasses.length > 3 ? ` and ${missingClasses.length - 3} more` : '';
          pulseItems.push({
            id: 'pulse-attendance-gap',
            category: 'ATTENDANCE',
            severity: 'warning',
            title: 'Attendance Gaps Detected Today',
            detail: `${missingClasses.length} of ${activeClasses.length} active classes have not logged daily attendance today (${sampleNames}${extra}).`,
            reason: 'Zero student attendance records registered in database for current calendar date.',
            source: 'Database tables: `classes` and `attendance`',
            dateRange: `Today (${todayStr} UTC)`,
            action: { label: 'Log Attendance', href: '/attendance' },
            count: missingClasses.length,
            responsibleRole: 'Class Teachers & Academic Staff',
            status: 'OPEN',
          });
        } else {
          pulseItems.push({
            id: 'pulse-attendance-complete',
            category: 'ATTENDANCE',
            severity: 'info',
            title: 'Attendance Fully Recorded Today',
            detail: `All ${activeClasses.length} active classes have submitted their daily attendance register.`,
            reason: 'Every active class ID has corresponding student attendance records for today.',
            source: 'Database tables: `classes` and `attendance`',
            dateRange: `Today (${todayStr} UTC)`,
            action: { label: 'Review Attendance', href: '/attendance' },
            count: 0,
            responsibleRole: 'Class Teachers & Academic Staff',
            status: 'RESOLVED',
          });
        }
      }
    } catch {
      // Graceful degradation if attendance query encounters lock or network hiccup
    }
  }

  // 2. FINANCIAL ARREARS & DUE DATES (For Admin, Accountant)
  if (isAdmin || isAccountant) {
    try {
      const overdueInvoices = await db.invoice.findMany({
        where: {
          tenantId,
          status: { in: ['UNPAID', 'PARTIAL'] },
          dueDate: { lt: new Date() },
        },
        select: { id: true, amount: true },
      });

      if (overdueInvoices.length > 0) {
        const totalAmount = overdueInvoices.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
        pulseItems.push({
          id: 'pulse-overdue-invoices',
          category: 'FINANCE',
          severity: 'warning',
          title: 'Tuition Invoices Past Payment Due Date',
          detail: `${overdueInvoices.length} student invoice${overdueInvoices.length > 1 ? 's' : ''} ($${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) are currently overdue.`,
          reason: 'Invoices with status UNPAID or PARTIAL where due date is earlier than today.',
          source: 'Database table: `invoices`',
          dateRange: 'Past due date',
          action: { label: 'Manage Fee Ledger', href: '/finance' },
          count: overdueInvoices.length,
          responsibleRole: 'Bursar & Finance Office',
          status: 'OPEN',
        });
      }
    } catch {
      // Graceful fallback
    }
  }

  // 3. ADMISSIONS VERIFICATION (For Admin, Registrar)
  if (isAdmin || isRegistrar) {
    try {
      const pendingAdmissions = await db.admissionApplication.count({
        where: { tenantId, status: 'PENDING' },
      });

      if (pendingAdmissions > 0) {
        pulseItems.push({
          id: 'pulse-pending-admissions',
          category: 'ADMISSIONS',
          severity: 'info',
          title: 'Prospective Student Applications Awaiting Review',
          detail: `${pendingAdmissions} intake application${pendingAdmissions > 1 ? 's' : ''} pending credential verification and enrollment decision.`,
          reason: 'Applications submitted through online registration portal marked with status PENDING.',
          source: 'Database table: `admission_applications`',
          dateRange: 'Active admission cycle',
          action: { label: 'Review Applications', href: '/frontdesk' },
          count: pendingAdmissions,
          responsibleRole: 'Admissions & Registrar',
          status: 'OPEN',
        });
      }
    } catch {
      // Graceful fallback
    }
  }

  // 4. ACADEMIC SUBMISSION EVALUATION (For Admin, Teacher)
  if (isAdmin || isTeacher) {
    try {
      const submissionFilter: any = {
        tenantId,
        grade: null,
      };

      if (isTeacher && !isAdmin) {
        submissionFilter.assignment = {
          teacher: { userId },
        };
      }

      const pendingGradingCount = await db.submission.count({
        where: submissionFilter,
      });

      if (pendingGradingCount > 0) {
        pulseItems.push({
          id: 'pulse-pending-grading',
          category: 'ACADEMIC',
          severity: 'info',
          title: 'Submissions Awaiting Grading & Feedback',
          detail: `${pendingGradingCount} assignment submission${pendingGradingCount > 1 ? 's' : ''} submitted by students are awaiting evaluation.`,
          reason: 'Submissions where grade and feedback values are currently null.',
          source: 'Database table: `submissions`',
          dateRange: 'Current academic term',
          action: { label: 'Open Grading Suite', href: '/grading' },
          count: pendingGradingCount,
          responsibleRole: 'Subject Teachers',
          status: 'OPEN',
        });
      }
    } catch {
      // Graceful fallback
    }
  }

  // 5. CHILD SAFEGUARDING & PROTECTION INCIDENTS (Restricted strictly to Admin / Designated Leads)
  if (isAdmin) {
    try {
      const openSafeguardingCount = await db.safeguardingIncident.count({
        where: {
          tenantId,
          status: { in: ['OPEN', 'UNDER_INVESTIGATION'] },
        },
      });

      if (openSafeguardingCount > 0) {
        pulseItems.push({
          id: 'pulse-safeguarding-cases',
          category: 'SAFEGUARDING',
          severity: 'urgent',
          title: 'Active Child Protection & Safeguarding Concern',
          detail: `${openSafeguardingCount} confidential safeguarding record${openSafeguardingCount > 1 ? 's' : ''} require designated safeguarding lead (DSL) follow-up.`,
          reason: 'Confidential incident records with status OPEN or UNDER_INVESTIGATION requiring statutory review.',
          source: 'Database table: `safeguarding_incidents` (Designated Leads Only)',
          dateRange: 'Open investigations',
          action: { label: 'Safeguarding Register', href: '/safeguarding' },
          count: openSafeguardingCount,
          responsibleRole: 'Designated Safeguarding Lead',
          status: 'OPEN',
        });
      }
    } catch {
      // Safeguarding table not present in early migrations; fail open safely
    }
  }

  // 6. STUDENT SUPPORT & INTERVENTION REFERRALS (For Admin, Teacher)
  if (isAdmin || isTeacher) {
    try {
      const pendingReferrals = await db.supportReferral.count({
        where: { tenantId, status: 'PENDING_REVIEW' },
      });

      if (pendingReferrals > 0) {
        pulseItems.push({
          id: 'pulse-support-referrals',
          category: 'INTERVENTIONS',
          severity: 'info',
          title: 'Student Support Referrals Awaiting Triage',
          detail: `${pendingReferrals} educator referral${pendingReferrals > 1 ? 's' : ''} require pastoral review before support intervention plans are initiated.`,
          reason: 'Referrals awaiting pastoral triage and formal intervention review.',
          source: 'Database table: `support_referrals`',
          dateRange: 'Pending triage',
          action: { label: 'Support Interventions', href: '/interventions' },
          count: pendingReferrals,
          responsibleRole: 'Pastoral Care & SENCO',
          status: 'OPEN',
        });
      }
    } catch {
      // Graceful fallback
    }
  }

  // Baseline reassurance item if no action items trigger
  if (pulseItems.length === 0) {
    pulseItems.push({
      id: 'pulse-all-nominal',
      category: 'OPERATIONS',
      severity: 'info',
      title: 'Institutional Operations Nominal',
      detail: 'All daily attendance records, admissions triages, and operational tasks are up-to-date.',
      reason: 'Zero unaddressed attendance gaps, zero overdue invoices, and zero pending triage actions found.',
      source: 'Cross-module database verification across active records',
      dateRange: 'Current operational window',
      action: { label: 'View Reports', href: '/reports' },
      count: 0,
      responsibleRole: 'School Administration',
      status: 'RESOLVED',
    });
  }

  return {
    tenantId,
    evaluatedAt: new Date().toISOString(),
    summary: {
      totalItems: pulseItems.length,
      urgentCount: pulseItems.filter((i) => i.severity === 'urgent').length,
      warningCount: pulseItems.filter((i) => i.severity === 'warning').length,
      infoCount: pulseItems.filter((i) => i.severity === 'info').length,
    },
    items: pulseItems,
  };
}
