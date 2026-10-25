import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

// Get all available permissions in the system
export async function listPermissionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { slug: 'asc' }]
    });
    res.status(200).json({ success: true, data: permissions });
  } catch (err) { next(err); }
}

// Get all custom roles for this school
export async function listRolesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const roles = await prisma.role.findMany({
      where: { tenantId: req.auth.tenantId },
      include: { _count: { select: { userTenantRoles: true } }, permissions: true },
    });
    res.status(200).json({ success: true, data: roles });
  } catch (err) { next(err); }
}

// Create a new custom role
export async function createRoleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const { name, description, permissionIds } = req.body;

    const role = await prisma.role.create({
      data: {
        tenantId: req.auth.tenantId,
        name,
        slug: name.toUpperCase().replace(/\s+/g, '_'),
        description,
        isSystem: false,
        permissions: {
          create: permissionIds.map((id: string) => ({ permissionId: id }))
        }
      }
    });

    res.status(201).json({ success: true, data: role });
  } catch (err) { next(err); }
}