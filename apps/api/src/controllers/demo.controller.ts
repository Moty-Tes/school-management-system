import type { Request, Response, NextFunction } from 'express';
import * as demoService from '../services/demo.service.js';

export async function getDemoInfoHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await demoService.getDemoInfo();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getDemoPersonasHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.status(200).json({
      success: true,
      data: {
        tenantCode: demoService.DEMO_TENANT_CODE,
        personas: demoService.DEMO_PERSONAS,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function resetDemoHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await demoService.resetDemoTenant();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
