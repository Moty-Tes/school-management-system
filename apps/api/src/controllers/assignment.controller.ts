import { Request, Response, NextFunction } from 'express';
import * as assignmentService from '../services/assignment.service.js';
import { z } from 'zod';

const createSchema = z.object({
  classId: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  dueDate: z.string(),
  attachmentUrl: z.string().optional(),
});

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const input = createSchema.parse(req.body);
    const result = await assignmentService.createAssignment(req.auth.tenantId, req.auth.sub, input);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await assignmentService.listAssignments(req.auth.tenantId, req.query.classId as string);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function submitHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await assignmentService.submitAssignment(req.auth.tenantId, req.auth.sub, req.params.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getSubmissionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await assignmentService.getSubmissions(req.auth.tenantId, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function gradeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await assignmentService.gradeSubmission(req.auth.tenantId, req.params.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}