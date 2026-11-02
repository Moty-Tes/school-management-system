import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service.js';
import { AppError } from '../middleware/error.middleware.js';

export async function getStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) {
      throw new AppError('Tenant context required to retrieve dashboard statistics', 400, 'BAD_REQUEST');
    }

    const stats = await dashboardService.getDashboardStats(req.auth.tenantId);
    
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

export async function getPulseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) {
      throw new AppError('Tenant and user context required for operational pulse briefing', 401, 'UNAUTHENTICATED');
    }

    const pulse = await dashboardService.getSchoolPulse(
      req.auth.tenantId,
      req.auth.sub,
      req.auth.roles || []
    );

    res.status(200).json({ success: true, data: pulse });
  } catch (err) {
    next(err);
  }
}
