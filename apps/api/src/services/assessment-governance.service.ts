import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export interface ModifyGradeInput {
  gradeId: string;
  newScore: number;
  reason: 'GRADING_ERROR' | 'RECHECK_REQUEST' | 'MODERATION_ADJUSTMENT' | 'RETAKE' | 'OTHER';
  detailedExplanation: string;
  approvedById?: string;
}

export interface RegisterAccommodationInput {
  studentId: string;
  type: 'EXTRA_TIME' | 'SCRIBE' | 'ACCESSIBLE_FORMAT' | 'SEPARATE_ROOM';
  details: string;
  extraTimePercent?: number; // e.g. 25 for +25%
  expiryDate?: string;
}

export interface SubmitModerationInput {
  assessmentId: string;
  sampleSize: number;
  status: 'MODERATED' | 'APPROVED' | 'REJECTED';
  feedback: string;
  scoreAdjustmentsApplied?: boolean;
}

/**
 * World-Class Assessment Governance, Moderation & Immutable Grade Audit Engine
 */
export class AssessmentGovernanceService {
  /**
   * Modify student grade with mandatory immutable audit trail
   */
  static async modifyGradeWithAudit(tenantId: string, modifierUserId: string, data: ModifyGradeInput) {
    const existingGrade = await prisma.grade.findUnique({
      where: { id: data.gradeId, tenantId },
      include: {
        assessment: true,
        student: { select: { firstName: true, lastName: true } },
      },
    });

    if (!existingGrade) {
      throw new AppError('Grade record not found', 404, 'NOT_FOUND');
    }

    if (data.newScore < 0 || data.newScore > existingGrade.assessment.maxScore) {
      throw new AppError(`Score must be between 0 and maximum possible (${existingGrade.assessment.maxScore})`, 400, 'INVALID_SCORE');
    }

    const previousScore = existingGrade.score;

    return prisma.$transaction(async (tx) => {
      // 1. Update the grade record
      const updatedGrade = await tx.grade.update({
        where: { id: data.gradeId },
        data: { score: data.newScore },
      });

      // 2. Insert immutable audit log
      const auditEntry = await tx.gradeAuditLog.create({
        data: {
          tenantId,
          gradeId: data.gradeId,
          studentId: existingGrade.studentId,
          assessmentId: existingGrade.assessmentId,
          previousScore,
          newScore: data.newScore,
          reason: `${data.reason}: ${data.detailedExplanation}`,
          changedById: modifierUserId,
          approvedById: data.approvedById,
        },
      });

      return {
        grade: updatedGrade,
        auditLog: auditEntry,
        delta: Math.round((data.newScore - previousScore) * 100) / 100,
      };
    });
  }

  /**
   * Get complete grade change audit history for a student or specific assessment
   */
  static async getGradeAuditTrail(tenantId: string, options: { studentId?: string; gradeId?: string }) {
    const where: any = { tenantId };
    if (options.studentId) where.studentId = options.studentId;
    if (options.gradeId) where.gradeId = options.gradeId;

    return prisma.gradeAuditLog.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Register academic accommodation (IEP / Extra Time / Accessibility)
   */
  static async registerAccommodation(tenantId: string, staffUserId: string, data: RegisterAccommodationInput) {
    return prisma.assessmentAccommodation.create({
      data: {
        tenantId,
        studentId: data.studentId,
        type: data.type,
        details: data.details,
        extraTimePercent: data.extraTimePercent || 25,
        isActive: true,
        approvedById: staffUserId,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      },
    });
  }

  /**
   * Calculate student-specific allowed exam duration accounting for active accommodations
   */
  static async calculateAccommodatedDuration(tenantId: string, studentId: string, standardMinutes: number): Promise<{
    durationMinutes: number;
    extraTimePercent: number;
    accommodations: string[];
  }> {
    const now = new Date();
    const activeAccommodations = await prisma.assessmentAccommodation.findMany({
      where: {
        tenantId,
        studentId,
        isActive: true,
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: now } },
        ],
      },
    });

    let extraTimePercent = 0;
    const accommodationTypes: string[] = [];

    for (const acc of activeAccommodations) {
      accommodationTypes.push(acc.type);
      if (acc.type === 'EXTRA_TIME' && acc.extraTimePercent > extraTimePercent) {
        extraTimePercent = acc.extraTimePercent;
      }
    }

    const durationMinutes = Math.round(standardMinutes * (1 + extraTimePercent / 100));

    return {
      durationMinutes,
      extraTimePercent,
      accommodations: accommodationTypes,
    };
  }

  /**
   * Submit formal assessment moderation review
   */
  static async submitModerationReview(tenantId: string, moderatorUserId: string, data: SubmitModerationInput) {
    return prisma.assessmentModeration.create({
      data: {
        tenantId,
        assessmentId: data.assessmentId,
        moderatedById: moderatorUserId,
        sampleSize: data.sampleSize,
        status: data.status,
        feedback: data.feedback,
        scoreAdjustmentsApplied: !!data.scoreAdjustmentsApplied,
      },
    });
  }
}
