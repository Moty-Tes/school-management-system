import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createClass(tenantId: string, data: { name: string; section: string; capacity: number }) {
  // Check if class already exists
  const existing = await prisma.class.findFirst({
    where: { tenantId, name: data.name, section: data.section, deletedAt: null },
  });
  if (existing) throw new AppError('Class and section already exist', 409, 'CLASS_EXISTS');

  return prisma.class.create({
    data: { tenantId, ...data },
  });
}

export async function listClasses(tenantId: string) {
  return prisma.class.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  });
}
