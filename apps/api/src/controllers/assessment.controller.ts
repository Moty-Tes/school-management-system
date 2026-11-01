import { Request, Response, NextFunction } from 'express';
import * as assessmentService from '../services/assessment.service.js';
import { AssessmentGovernanceService } from '../services/assessment-governance.service.js';
import { z } from 'zod';

const createAssessmentSchema = z.object({
  title: z.string().min(1),
  classId: z.string().min(1),
  maxScore: z.number().positive().default(100),
  date: z.string().optional().default(() => new Date().toISOString()),
});

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const input = createAssessmentSchema.parse(req.body);

    const assessment = await assessmentService.createAssessment(
      req.auth.tenantId,
      {
        classId: input.classId,
        title: input.title,
        maxScore: input.maxScore,
        date: input.date,
      }
    );

    res.status(201).json({ success: true, data: assessment });
  } catch (err) {
    next(err);
  }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const classId = req.query.classId as string | undefined;

    const assessments = await assessmentService.listAssessments(
      req.auth.tenantId,
      classId
    );

    res.status(200).json({ success: true, data: assessments });
  } catch (err) {
    next(err);
  }
}

export async function saveGradesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const assessmentId = req.params.assessmentId || req.params.id || req.body.assessmentId;
    if (!assessmentId) throw new Error("assessmentId is required");

    const rawGrades = req.body.grades || req.body.records || [];
    const formattedGrades = rawGrades.map((g: any) => ({
      studentId: g.studentId,
      score: Number(g.score !== undefined ? g.score : (g.scoreObtained ?? 0)),
    }));

    await assessmentService.saveGrades(
      req.auth.tenantId,
      assessmentId,
      formattedGrades
    );

    res.status(200).json({ success: true, message: 'Grades saved' });
  } catch (err) {
    next(err);
  }
}

export async function getGradesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const assessmentId = req.params.assessmentId || req.params.id || (req.query.assessmentId as string);
    if (!assessmentId) throw new Error("assessmentId is required");

    const grades = await assessmentService.getGrades(
      req.auth.tenantId,
      assessmentId
    );

    res.status(200).json({ success: true, data: grades });
  } catch (err) {
    next(err);
  }
}

// ---------------- Assessment Governance & Audit ----------------

const modifyGradeSchema = z.object({
  gradeId: z.string().min(1),
  newScore: z.number().min(0),
  reason: z.enum(['GRADING_ERROR', 'RECHECK_REQUEST', 'MODERATION_ADJUSTMENT', 'RETAKE', 'OTHER']),
  detailedExplanation: z.string().min(5),
  approvedById: z.string().optional(),
});

export async function modifyGradeWithAuditHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) throw new Error("Unauthorized");
    const input = modifyGradeSchema.parse(req.body);

    const result = await AssessmentGovernanceService.modifyGradeWithAudit(
      req.auth.tenantId,
      req.auth.sub,
      input as any
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getGradeAuditTrailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("Unauthorized");
    const { studentId, gradeId } = req.query;

    const trail = await AssessmentGovernanceService.getGradeAuditTrail(
      req.auth.tenantId,
      {
        studentId: studentId as string | undefined,
        gradeId: gradeId as string | undefined,
      }
    );

    res.status(200).json({ success: true, data: trail });
  } catch (err) {
    next(err);
  }
}

const registerAccommodationSchema = z.object({
  studentId: z.string().min(1),
  type: z.enum(['EXTRA_TIME', 'SCRIBE', 'ACCESSIBLE_FORMAT', 'SEPARATE_ROOM']),
  details: z.string().min(3),
  extraTimePercent: z.number().min(0).max(100).optional(),
  expiryDate: z.string().optional(),
});

export async function registerAccommodationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) throw new Error("Unauthorized");
    const input = registerAccommodationSchema.parse(req.body);

    const accommodation = await AssessmentGovernanceService.registerAccommodation(
      req.auth.tenantId,
      req.auth.sub,
      input as any
    );

    res.status(201).json({ success: true, data: accommodation });
  } catch (err) {
    next(err);
  }
}

export async function calculateAccommodatedDurationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("Unauthorized");
    const { studentId } = req.params;
    const standardMinutes = Number(req.query.standardMinutes) || 60;

    const result = await AssessmentGovernanceService.calculateAccommodatedDuration(
      req.auth.tenantId,
      studentId,
      standardMinutes
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

const submitModerationSchema = z.object({
  assessmentId: z.string().min(1),
  sampleSize: z.number().positive(),
  status: z.enum(['MODERATED', 'APPROVED', 'REJECTED']),
  feedback: z.string().min(3),
  scoreAdjustmentsApplied: z.boolean().optional(),
});

export async function submitModerationReviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) throw new Error("Unauthorized");
    const input = submitModerationSchema.parse(req.body);

    const result = await AssessmentGovernanceService.submitModerationReview(
      req.auth.tenantId,
      req.auth.sub,
      input as any
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
