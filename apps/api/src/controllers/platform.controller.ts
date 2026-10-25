import { Request, Response, NextFunction } from 'express';
import * as platformService from '../services/platform.service.js';
import { prisma } from '../lib/prisma.js';


export async function getStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await platformService.getPlatformStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}
export async function updateTenantModulesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = req.params;
    const { enabledModules } = req.body;

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { enabledModules },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}