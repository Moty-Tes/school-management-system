import { Request, Response, NextFunction } from 'express';
import * as assessmentService from '../services/assessment.service.ts';
import { z } from 'zod';

const createAssessmentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  subjectId: z.string().min(1),
  assessmentType: z.enum(['QUIZ', 'TEST', 'EXAM', 'ASSIGNMENT', 'PROJECT', 'PRACTICAL']),
  maxScore: z.number().positive(),
  weight: z.number().positive().default(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const saveGradesSchema = z.object({
  grades: z.array(
    z.object({
      studentId: z.string().min(1),
      scoreObtained: z.number(),
      comments: z.string().optional(),
    })
  ),
});

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const input = createAssessmentSchema.parse(req.body);

    const assessment = await assessmentService.createAssessment(
      req.auth.tenantId,
      {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
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
    const { subjectId } = req.query;

    const assessments = await assessmentService.getAssessments(
      req.auth.tenantId,
      subjectId ? { subjectId } : undefined
    );

    res.status(200).json({ success: true, data: assessments });
  } catch (err) {
    next(err);
  }
}

export async function saveGradesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const { assessmentId } = req.params;
    const input = saveGradesSchema.parse(req.body);

    await assessmentService.saveGrades(
      req.auth.tenantId,
      assessmentId,
      input.grades
    );

    res.status(200).json({ success: true, message: 'Grades saved' });
  } catch (err) {
    next(err);
  }
}

export async function getGradesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const { assessmentId } = req.params;

    const grades = await assessmentService.getGrades(
      req.auth.tenantId,
      assessmentId
    );

    res.status(200).json({ success: true, data: grades });
  } catch (err) {
    next(err);
  }
}