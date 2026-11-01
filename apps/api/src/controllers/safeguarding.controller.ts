import { Request, Response, NextFunction } from 'express';
import { SafeguardingService } from '../services/safeguarding.service.js';
import { z } from 'zod';

const reportConcernSchema = z.object({
  studentId: z.string().min(1),
  concernType: z.enum(['ABUSE_NEGLECT', 'BULLYING', 'MENTAL_HEALTH', 'DOMESTIC_VIOLENCE', 'EXPLOITATION', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'IMMEDIATE_DANGER']),
  details: z.string().min(10),
  actionsTaken: z.string().optional(),
  designatedLeadId: z.string().optional(),
});

const getIncidentSchema = z.object({
  accessReason: z.string().min(5),
});

const registerPickupSchema = z.object({
  studentId: z.string().min(1),
  fullName: z.string().min(2),
  relationship: z.string().min(2),
  phone: z.string().min(6),
  idCardNumber: z.string().optional(),
  photoUrl: z.string().optional(),
  securityPin: z.string().optional(),
  emergencyPriority: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
});

const verifyPickupSchema = z.object({
  studentId: z.string().min(1),
  fullName: z.string().min(1),
  securityPin: z.string().optional(),
});

export async function reportConcernHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) throw new Error("Authentication required");
    const input = reportConcernSchema.parse(req.body);

    const result = await SafeguardingService.reportConcern(
      req.auth.tenantId,
      req.auth.sub,
      input as any
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getIncidentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) throw new Error("Authentication required");
    const { id } = req.params;
    const { accessReason } = getIncidentSchema.parse(req.query);

    const result = await SafeguardingService.getIncidentConfidential(
      req.auth.tenantId,
      req.auth.sub,
      req.auth.roles || [],
      id,
      accessReason,
      req.ip
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listIncidentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("Authentication required");
    const status = req.query.status as string | undefined;

    const result = await SafeguardingService.listIncidents(
      req.auth.tenantId,
      req.auth?.roles || [],
      status
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function registerPickupHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("Authentication required");
    const input = registerPickupSchema.parse(req.body);

    const result = await SafeguardingService.registerApprovedPickup(req.auth.tenantId, input as any);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function verifyPickupHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("Authentication required");
    const input = verifyPickupSchema.parse(req.body);

    const result = await SafeguardingService.verifyPickupAuthorization(
      req.auth.tenantId,
      input.studentId,
      input.fullName,
      input.securityPin
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}
