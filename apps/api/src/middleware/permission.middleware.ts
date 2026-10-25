import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export function requirePermission(requiredPermission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth?.tenantId || !req.auth?.sub) throw new Error("No auth");
      if (!req.auth.roles || req.auth.roles.length === 0) throw new Error("No roles");

      // Super Admin bypasses all checks
      if (req.auth.roles.includes('SUPER_ADMIN')) return next();

      // Fetch the user's permissions from the database
      const userTenant = await prisma.userTenant.findUnique({
        where: { userId_tenantId: { userId: req.auth.sub, tenantId: req.auth.tenantId } },
        include: {
          roles: {
            include: {
              role: {
                include: { permissions: { include: { permission: true } } }
              }
            }
          }
        }
      });

      if (!userTenant) throw new Error("User not found in tenant");

      // Flatten all permissions from all their roles
      const userPermissions = userTenant.roles.flatMap(utr => 
        utr.role.permissions.map(rp => rp.permission.slug)
      );

      // Check if they have the required permission
      if (!userPermissions.includes(requiredPermission)) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: `Missing permission: ${requiredPermission}` }
        });
        return;
      }

      next();
    } catch (err) {
      res.status(500).json({ success: false, error: { message: 'Permission check failed' } });
    }
  };
}