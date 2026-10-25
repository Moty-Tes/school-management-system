import { Request, Response, NextFunction } from 'express';
import * as websiteService from '../services/website.service.js';

export async function getSettingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await websiteService.getWebsiteSettings(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function updateSettingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await websiteService.updateWebsiteSettings(req.auth.tenantId, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getPublicHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await websiteService.getPublicWebsite(req.params.tenantCode);
    if (!result) {
      res.status(404).json({ success: false, error: { message: 'Website not found' } });
      return;
    }
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}