import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analytics.service.js';

// For Admins: Gets school-wide financial and demographic data
export async function getAnalyticsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const data = await analyticsService.getDashboardAnalytics(req.auth.tenantId);
    res.status(200).json({ success: true, data });
  } catch (err) { 
    next(err); 
  }
}

// For Students/Parents: Gets personal academic data
export async function getPersonalDashboardHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const data = await analyticsService.getPersonalDashboard(req.auth.tenantId, req.auth.sub);
    res.status(200).json({ success: true, data });
  } catch (err) { 
    next(err); 
  }
}