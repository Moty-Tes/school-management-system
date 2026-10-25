import { Request, Response, NextFunction } from 'express';
import * as behaviorService from '../services/behavior.service.js';
import { z } from 'zod';

const createSchema = z.object({
  studentId: z.string(),
  type: z.enum(['POSITIVE', 'NEGATIVE']),
  title: z.string().min(1),
  description: z.string().optional(),
});

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const input = createSchema.parse(req.body);
    const result = await behaviorService.createBehaviorLog(req.auth.tenantId, req.auth.sub, input);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await behaviorService.getStudentBehavior(req.auth.tenantId, req.params.studentId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}