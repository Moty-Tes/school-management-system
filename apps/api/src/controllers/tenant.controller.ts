import { Request, Response, NextFunction } from 'express';
import * as tenantService from '../services/tenant.service.js';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid hex color').optional(),
});

export async function getSettingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const settings = await tenantService.getTenantSettings(req.auth.tenantId);
    res.status(200).json({ success: true, data: settings });
  } catch (err) { next(err); }
}

export async function updateSettingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const input = updateSchema.parse(req.body);
    const settings = await tenantService.updateTenantSettings(req.auth.tenantId, input);
    res.status(200).json({ success: true, data: settings });
  } catch (err) { next(err); }
}