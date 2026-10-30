import { Request, Response, NextFunction } from 'express';
import * as substituteService from '../services/substitute.service.js';
import { z } from 'zod';

const assignSchema = z.object({
  timetableId: z.string().min(1),
  absentTeacherId: z.string().min(1),
  coverTeacherId: z.string().min(1),
  date: z.string().min(1),
});

export async function getUncoveredHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const result = await substituteService.getUncoveredClasses(req.auth.tenantId, dateStr);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getAvailableHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const timetableId = req.query.timetableId as string;
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    if (!timetableId) {
      return res.status(400).json({ success: false, message: 'timetableId is required' });
    }
    const result = await substituteService.getAvailableTeachers(req.auth.tenantId, timetableId, dateStr);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function assignHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const input = assignSchema.parse(req.body);
    const result = await substituteService.assignSubstitute(req.auth.tenantId, input as any);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}
