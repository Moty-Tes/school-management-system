import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export interface TierLimits {
  maxStudents: number;
  maxTeachers: number;
  storageMb: number;
  includedSmsCredits: number;
}

export const TIER_LIMITS: Record<string, TierLimits> = {
  SHARED: {
    maxStudents: 250,
    maxTeachers: 15,
    storageMb: 1024, // 1 GB
    includedSmsCredits: 500,
  },
  SCHEMA: {
    maxStudents: 1200,
    maxTeachers: 80,
    storageMb: 10240, // 10 GB
    includedSmsCredits: 5000,
  },
  DEDICATED_DB: {
    maxStudents: 10000,
    maxTeachers: 500,
    storageMb: 102400, // 100 GB
    includedSmsCredits: 50000,
  },
  DEDICATED_SERVER: {
    maxStudents: 100000,
    maxTeachers: 5000,
    storageMb: 1048576, // 1 TB
    includedSmsCredits: 500000,
  },
};

/**
 * World-Class Multi-Tenant SaaS Governance, Metering & Tier Management Engine
 */
export class SaasGovernanceService {
  /**
   * Enforce tenant student/staff quota before record creation
   */
  static async assertQuotaAvailable(tenantId: string, resource: 'STUDENT' | 'TEACHER') {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { tier: true, name: true },
    });

    if (!tenant) throw new AppError('Tenant not found', 404, 'NOT_FOUND');

    const limits = TIER_LIMITS[tenant.tier] || TIER_LIMITS.SHARED;

    if (resource === 'STUDENT') {
      const currentCount = await prisma.student.count({
        where: { tenantId, deletedAt: null },
      });
      if (currentCount >= limits.maxStudents) {
        throw new AppError(
          `Tenant "${tenant.name}" has reached its maximum student capacity (${limits.maxStudents} students) on the ${tenant.tier} plan. Please upgrade your subscription tier.`,
          403,
          'QUOTA_EXCEEDED'
        );
      }
    } else if (resource === 'TEACHER') {
      const currentCount = await prisma.teacherProfile.count({
        where: { tenantId },
      });
      if (currentCount >= limits.maxTeachers) {
        throw new AppError(
          `Tenant "${tenant.name}" has reached its staff quota (${limits.maxTeachers} teachers) on the ${tenant.tier} plan.`,
          403,
          'QUOTA_EXCEEDED'
        );
      }
    }
  }

  /**
   * Get comprehensive usage metrics and billing utilization for a tenant
   */
  static async getTenantMetrics(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            classes: true,
            invoices: true,
            payments: true,
            broadcasts: true,
          },
        },
      },
    });

    if (!tenant) throw new AppError('Tenant not found', 404, 'NOT_FOUND');

    const limits = TIER_LIMITS[tenant.tier] || TIER_LIMITS.SHARED;

    const studentUtilization = Math.round((tenant._count.students / limits.maxStudents) * 100);
    const teacherUtilization = Math.round((tenant._count.teachers / limits.maxTeachers) * 100);

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        code: tenant.code,
        tier: tenant.tier,
        status: tenant.status,
        enabledModules: tenant.enabledModules,
      },
      quota: {
        students: {
          used: tenant._count.students,
          limit: limits.maxStudents,
          utilizationPercent: studentUtilization,
          remaining: Math.max(0, limits.maxStudents - tenant._count.students),
        },
        teachers: {
          used: tenant._count.teachers,
          limit: limits.maxTeachers,
          utilizationPercent: teacherUtilization,
          remaining: Math.max(0, limits.maxTeachers - tenant._count.teachers),
        },
        storageMb: {
          limit: limits.storageMb,
          estimatedUsedMb: Math.round((tenant._count.students * 0.5) + (tenant._count.invoices * 0.05)),
        },
      },
      activitySummary: {
        classesCount: tenant._count.classes,
        invoicesCount: tenant._count.invoices,
        paymentsCount: tenant._count.payments,
        broadcastsCount: tenant._count.broadcasts,
      },
      subscriptionStatus: {
        isHealthy: studentUtilization < 95 && teacherUtilization < 95,
        upgradeRecommended: studentUtilization >= 80 || teacherUtilization >= 80,
      },
    };
  }

  /**
   * Update feature flag modules enabled for a school
   */
  static async updateEnabledModules(tenantId: string, modules: string[]) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data: {
        enabledModules: modules,
      },
      select: {
        id: true,
        name: true,
        enabledModules: true,
        tier: true,
      },
    });
  }
}
