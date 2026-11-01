import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export interface CreateReferralInput {
  studentId: string;
  category: 'ACADEMIC' | 'ATTENDANCE' | 'WELLBEING' | 'ACCESSIBILITY' | 'FINANCIAL';
  urgency?: 'LOW' | 'NORMAL' | 'URGENT';
  reason: string;
  baselineData?: Record<string, any>;
}

export interface CreateInterventionPlanInput {
  studentId: string;
  referralId?: string;
  ownerId: string; // Case manager / assigned educator
  title: string;
  category: string;
  objectives: { target: string; baseline: string; timeline: string }[];
  targetOutcomes: string;
  startDate: string;
  reviewDate: string;
  aiRecommendationSource?: string;
}

export interface RecordMeetingInput {
  planId: string;
  meetingDate: string;
  attendees: { name: string; role: string }[];
  minutes: string;
  outcomeNotes: string;
  nextReviewDate?: string;
}

/**
 * World-Class Student Support, Human-in-the-Loop Intervention Tracking Engine
 */
export class InterventionService {
  /**
   * Submit a structured teacher referral for academic or wellbeing support
   */
  static async submitReferral(tenantId: string, staffUserId: string, data: CreateReferralInput) {
    const student = await prisma.student.findUnique({
      where: { id: data.studentId, tenantId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!student) throw new AppError('Student not found for referral', 404, 'NOT_FOUND');

    return prisma.supportReferral.create({
      data: {
        tenantId,
        studentId: data.studentId,
        referredById: staffUserId,
        category: data.category,
        urgency: data.urgency || 'NORMAL',
        reason: data.reason,
        baselineData: data.baselineData,
        status: 'PENDING_REVIEW',
      },
    });
  }

  /**
   * List referrals for a school
   */
  static async listReferrals(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return prisma.supportReferral.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, class: { select: { name: true } } } },
        plans: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create an Individualized Intervention Plan (IIP) with mandatory human staff sign-off.
   * If derived from an AI risk recommendation, records the attribution but requires staff review.
   */
  static async createInterventionPlan(
    tenantId: string,
    approverUserId: string,
    data: CreateInterventionPlanInput
  ) {
    const student = await prisma.student.findUnique({
      where: { id: data.studentId, tenantId },
    });

    if (!student) throw new AppError('Student not found for intervention plan', 404, 'NOT_FOUND');

    // Create plan inside transaction and link to referral if present
    return prisma.$transaction(async (tx) => {
      const plan = await tx.interventionPlan.create({
        data: {
          tenantId,
          studentId: data.studentId,
          referralId: data.referralId,
          ownerId: data.ownerId,
          title: data.title,
          category: data.category,
          objectives: data.objectives as any,
          targetOutcomes: data.targetOutcomes,
          startDate: new Date(data.startDate),
          reviewDate: new Date(data.reviewDate),
          status: 'ACTIVE',
          aiRecommendationSource: data.aiRecommendationSource || null,
          staffSignedById: approverUserId, // MANDATORY HUMAN SIGN-OFF
          staffSignedAt: new Date(),
        },
      });

      if (data.referralId) {
        await tx.supportReferral.update({
          where: { id: data.referralId },
          data: { status: 'ACCEPTED' },
        });
      }

      return plan;
    });
  }

  /**
   * Record a formal case review meeting with minutes and updated review date
   */
  static async recordMeeting(tenantId: string, data: RecordMeetingInput) {
    const plan = await prisma.interventionPlan.findUnique({
      where: { id: data.planId, tenantId },
    });

    if (!plan) throw new AppError('Intervention plan not found', 404, 'NOT_FOUND');

    return prisma.$transaction(async (tx) => {
      const meeting = await tx.interventionMeeting.create({
        data: {
          tenantId,
          planId: data.planId,
          meetingDate: new Date(data.meetingDate),
          attendees: data.attendees as any,
          minutes: data.minutes,
          outcomeNotes: data.outcomeNotes,
          nextReviewDate: data.nextReviewDate ? new Date(data.nextReviewDate) : null,
        },
      });

      if (data.nextReviewDate) {
        await tx.interventionPlan.update({
          where: { id: data.planId },
          data: { reviewDate: new Date(data.nextReviewDate), status: 'ACTIVE' },
        });
      }

      return meeting;
    });
  }

  /**
   * Get full student support dossier (referrals, plans, meetings, historical outcomes)
   */
  static async getStudentSupportHistory(tenantId: string, studentId: string) {
    const [referrals, plans] = await Promise.all([
      prisma.supportReferral.findMany({
        where: { tenantId, studentId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.interventionPlan.findMany({
        where: { tenantId, studentId },
        include: {
          meetings: { orderBy: { meetingDate: 'desc' } },
        },
        orderBy: { startDate: 'desc' },
      }),
    ]);

    return {
      studentId,
      totalReferrals: referrals.length,
      activePlans: plans.filter(p => p.status === 'ACTIVE').length,
      achievedPlans: plans.filter(p => p.status === 'ACHIEVED').length,
      referrals,
      plans,
    };
  }
}
