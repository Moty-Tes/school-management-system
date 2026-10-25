import { Request, Response, NextFunction } from 'express';
import * as gradingService from '../services/grading.service.js';

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await gradingService.createScale(req.auth.tenantId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await gradingService.listScales(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function setDefaultHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await gradingService.setDefaultScale(req.auth.tenantId, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}