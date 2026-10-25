import { Request, Response, NextFunction } from 'express';
import * as leaveService from '../services/leave.service.js';
import { z } from 'zod';

const requestSchema = z.object({
  type: z.enum(['ANNUAL', 'SICK', 'MATERNITY', 'UNPAID']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(1),
});

export async function requestHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const input = requestSchema.parse(req.body);
    const result = await leaveService.requestLeave(req.auth.tenantId, req.auth.sub, input);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getMyLeavesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await leaveService.getMyLeaves(req.auth.tenantId, req.auth.sub);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getAllLeavesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await leaveService.getAllLeaves(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function updateStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const { status, adminNote } = req.body;
    const result = await leaveService.updateLeaveStatus(req.auth.tenantId, req.params.id, status, adminNote);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}