import { Request, Response, NextFunction } from 'express';
import * as assessmentService from '../services/assessment.service.js';
import { z } from 'zod';

const createAssessmentSchema = z.object({
  title: z.string().min(1),
  classId: z.string().min(1),
  maxScore: z.number().positive().default(100),
  date: z.string().optional().default(() => new Date().toISOString()),
});

const saveGradesSchema = z.object({
  grades: z.array(
    z.object({
      studentId: z.string().min(1),
      score: z.number(),
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
    const { assessmentId } = req.params;
    const input = saveGradesSchema.parse(req.body);

    await assessmentService.saveGrades(
      req.auth.tenantId,
      assessmentId,
      input.grades as any
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