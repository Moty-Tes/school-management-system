import { Request, Response, NextFunction } from 'express';
import * as substituteService from '../services/substitute.service.js';

export async function getUncoveredHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    const result = await substituteService.getUncoveredClasses(req.auth.tenantId, date);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getAvailableHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const { timetableId, date } = req.query;
    const result = await substituteService.getAvailableTeachers(req.auth.tenantId, timetableId as string, date as string);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function assignHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await substituteService.assignSubstitute(req.auth.tenantId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}