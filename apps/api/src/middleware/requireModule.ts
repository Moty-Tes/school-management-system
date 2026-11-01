import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from './error.middleware.js';

/**
 * Feature Flag & Module Authorization Middleware
 * Verifies that the requested tenant has granted entitlement for the targeted module.
 */
export function requireModule(moduleName: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const tenantId = req.auth?.tenantId || (req as any).tenantId;
      if (!tenantId) {
        throw new AppError('Tenant context required', 400, 'NO_TENANT');
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, enabledModules: true, tier: true },
      });

      if (!tenant) {
        throw new AppError('Tenant not found', 404, 'TENANT_NOT_FOUND');
      }

      // Check if module is in enabledModules list
      const isEnabled = tenant.enabledModules.includes(moduleName) || tenant.enabledModules.includes('all');

      if (!isEnabled) {
        throw new AppError(
          `Module "${moduleName}" is not enabled on your school's current plan (${tenant.tier}). Please upgrade your tier or contact your Super Administrator.`,
          403,
          'MODULE_NOT_ENABLED'
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
