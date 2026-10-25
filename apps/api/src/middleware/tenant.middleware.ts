import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from './error.middleware.js';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantCode?: string;
    }
  }
}


export async function resolveTenant(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Priority 1: If authenticated, tenantId is already in req.auth
    if (req.auth?.tenantId) {
      req.tenantId = req.auth.tenantId;
      return next();
    }

    // Priority 2: Look at the header
    const tenantCode = req.headers['x-tenant-code'];
    if (typeof tenantCode === 'string' && tenantCode.trim()) {
      const tenant = await prisma.tenant.findUnique({
        where: { code: tenantCode.trim().toLowerCase() },
        select: { id: true, code: true, status: true, deletedAt: true },
      });

      if (!tenant || tenant.deletedAt || tenant.status !== 'ACTIVE') {
        throw new AppError('Tenant not found or inactive', 404, 'TENANT_NOT_FOUND');
      }

      req.tenantId = tenant.id;
      req.tenantCode = tenant.code;
    }

    next();
  } catch (err) {
    next(err);
  }
}