import { Request, Response, NextFunction } from 'express';
import * as dailylogService from '../services/dailylog.service.js';

export async function upsertHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await dailylogService.upsertDailyLog(req.auth.tenantId, req.auth.sub, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await dailylogService.getStudentLogs(req.auth.tenantId, req.params.studentId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}