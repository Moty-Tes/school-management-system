import { Request, Response, NextFunction } from 'express';
import * as admissionService from '../services/admission.service.js';

export async function applyHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantCode, ...data } = req.body;
    if (!tenantCode) throw new Error("tenantCode is required");
    const result = await admissionService.submitApplication(tenantCode, data);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await admissionService.listApplications(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function reviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const { status, classId } = req.body;
    const result = await admissionService.reviewApplication(req.auth.tenantId, req.params.id, status, classId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}