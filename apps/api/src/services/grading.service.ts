import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createScale(tenantId: string, data: { name: string, rules: any[] }) {
  // If this is the first scale, make it the default
  const count = await prisma.gradingScale.count({ where: { tenantId } });
  
  return prisma.gradingScale.create({
    data: {
      tenantId,
      name: data.name,
      rules: data.rules,
      isDefault: count === 0,
    },
  });
}

export async function listScales(tenantId: string) {
  return prisma.gradingScale.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function setDefaultScale(tenantId: string, scaleId: string) {
  return prisma.$transaction(async (tx) => {
    // Remove default from all other scales
    await tx.gradingScale.updateMany({
      where: { tenantId },
      data: { isDefault: false },
    });
    
    // Set the new default
    return tx.gradingScale.update({
      where: { id: scaleId, tenantId },
      data: { isDefault: true },
    });
  });
}

export async function getDefaultScale(tenantId: string) {
  return prisma.gradingScale.findFirst({
    where: { tenantId, isDefault: true },
  });
}