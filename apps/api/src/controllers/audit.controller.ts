import { Request, Response, NextFunction } from 'express';
import * as auditService from '../services/audit.service.js';

export async function getActivityHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const search = req.query.search as string | undefined;
    const actionFilter = req.query.action as string | undefined;
    
    const result = await auditService.getRecentActivity(req.auth.tenantId, search, actionFilter);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}