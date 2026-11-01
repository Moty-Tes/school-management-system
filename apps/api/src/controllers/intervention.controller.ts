import { Request, Response, NextFunction } from 'express';
import { InterventionService } from '../services/intervention.service.js';
import { z } from 'zod';

const createReferralSchema = z.object({
  studentId: z.string().min(1),
  category: z.enum(['ACADEMIC', 'ATTENDANCE', 'WELLBEING', 'ACCESSIBILITY', 'FINANCIAL']),
  urgency: z.enum(['LOW', 'NORMAL', 'URGENT']).optional(),
  reason: z.string().min(10),
  baselineData: z.record(z.any()).optional(),
});

const createPlanSchema = z.object({
  studentId: z.string().min(1),
  referralId: z.string().optional(),
  ownerId: z.string().min(1),
  title: z.string().min(3),
  category: z.string().min(2),
  objectives: z.array(z.object({
    target: z.string().min(2),
    baseline: z.string().min(1),
    timeline: z.string().min(1),
  })).min(1),
  targetOutcomes: z.string().min(5),
  startDate: z.string(),
  reviewDate: z.string(),
  aiRecommendationSource: z.string().optional(),
});

const recordMeetingSchema = z.object({
  planId: z.string().min(1),
  meetingDate: z.string(),
  attendees: z.array(z.object({ name: z.string(), role: z.string() })).min(1),
  minutes: z.string().min(10),
  outcomeNotes: z.string().min(5),
  nextReviewDate: z.string().optional(),
});

export async function submitReferralHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) throw new Error("Authentication required");
    const input = createReferralSchema.parse(req.body);

    const result = await InterventionService.submitReferral(req.auth.tenantId, req.auth.sub, input as any);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listReferralsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("Authentication required");
    const status = req.query.status as string | undefined;

    const result = await InterventionService.listReferrals(req.auth.tenantId, status);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function createPlanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) throw new Error("Authentication required");
    const input = createPlanSchema.parse(req.body);

    const result = await InterventionService.createInterventionPlan(req.auth.tenantId, req.auth.sub, input as any);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function recordMeetingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("Authentication required");
    const input = recordMeetingSchema.parse(req.body);

    const result = await InterventionService.recordMeeting(req.auth.tenantId, input as any);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getStudentHistoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("Authentication required");
    const { studentId } = req.params;

    const result = await InterventionService.getStudentSupportHistory(req.auth.tenantId, studentId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}
