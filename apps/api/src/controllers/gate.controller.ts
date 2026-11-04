import { Request, Response, NextFunction } from 'express';
import * as gateService from '../services/gate.service.js';
import { AppError } from '../middleware/error.middleware.js';

export async function scanHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) {
      throw new AppError('Tenant and authenticated identity required', 401, 'UNAUTHENTICATED');
    }

    const { admissionNumber, scanType = 'ARRIVAL', isSimulation = true } = req.body;
    if (!admissionNumber) {
      throw new AppError('Student admission number or barcode is required', 400, 'BAD_REQUEST');
    }

    const result = await gateService.recordGateScan({
      tenantId: req.auth.tenantId,
      scannerUserId: req.auth.sub,
      admissionNumber,
      scanType,
      isSimulation,
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function listScansHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) {
      throw new AppError('Tenant context required', 400, 'BAD_REQUEST');
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const result = await gateService.getRecentGateScans(req.auth.tenantId, limit);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function graceCheckHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) {
      throw new AppError('Tenant context required', 400, 'BAD_REQUEST');
    }

    const graceMinutes = req.query.graceMinutes ? parseInt(req.query.graceMinutes as string, 10) : 5;
    const result = await gateService.checkPostDismissalGracePeriod(req.auth.tenantId, graceMinutes);

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
