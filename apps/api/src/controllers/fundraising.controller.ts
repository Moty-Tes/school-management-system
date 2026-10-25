import { Request, Response, NextFunction } from 'express';
import * as fundraisingService from '../services/fundraising.service.js';

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await fundraisingService.createCampaign(req.auth.tenantId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await fundraisingService.listCampaigns(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function publicCampaignHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantCode, id } = req.params;
    const result = await fundraisingService.getPublicCampaign(tenantCode, id);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function donateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantCode, id } = req.params;
    const result = await fundraisingService.recordDonation(tenantCode, id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}