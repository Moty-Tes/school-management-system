import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service.js';

export async function getStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");

    const stats = await dashboardService.getDashboardStats(req.auth.tenantId);
    
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}