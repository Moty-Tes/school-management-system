import { Request, Response, NextFunction } from 'express';
import * as healthService from '../services/health.service.js';
import { AppError } from '../middleware/error.middleware.js';

export async function upsertHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new AppError('Tenant context required', 400, 'BAD_REQUEST');
    const result = await healthService.upsertHealthRecord(req.auth.tenantId, req.params.studentId, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) {
      throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
    }
    const result = await healthService.getHealthRecord(
      req.auth.tenantId,
      req.params.studentId,
      req.auth.sub,
      req.auth.roles || []
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function logVisitHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new AppError('Tenant context required', 400, 'BAD_REQUEST');
    const result = await healthService.logClinicVisit(req.auth.tenantId, req.params.studentId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function recentVisitsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new AppError('Tenant context required', 400, 'BAD_REQUEST');
    const result = await healthService.getRecentVisits(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function emergencyRequestHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) {
      throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
    }
    const { studentId, reason, locationNotes, urgency } = req.body;
    if (!studentId || !reason) {
      throw new AppError('Student ID and reason are required to trigger an emergency assistance lookup', 400, 'BAD_REQUEST');
    }
    const result = await healthService.requestEmergencyAssistance(
      req.auth.tenantId,
      req.auth.sub,
      studentId,
      { reason, locationNotes, urgency }
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
