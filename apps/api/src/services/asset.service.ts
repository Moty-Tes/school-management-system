import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createAsset(tenantId: string, data: any) {
  return prisma.asset.create({
    data: {
      tenantId,
      name: data.name,
      category: data.category,
      serialNumber: data.serialNumber,
      purchaseDate: new Date(data.purchaseDate),
      purchasePrice: data.purchasePrice,
      status: 'AVAILABLE',
    },
  });
}

export async function listAssets(tenantId: string) {
  return prisma.asset.findMany({
    where: { tenantId },
    include: { assignedTo: { include: { profile: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function assignAsset(tenantId: string, assetId: string, userId: string, location?: string) {
  const asset = await prisma.asset.findFirst({ where: { id: assetId, tenantId } });
  if (!asset) throw new AppError('Asset not found', 404, 'NOT_FOUND');
  if (asset.status === 'ASSIGNED') throw new AppError('Asset is already assigned', 400, 'ALREADY_ASSIGNED');

  return prisma.asset.update({
    where: { id: assetId },
    data: { status: 'ASSIGNED', assignedToId: userId, location },
    include: { assignedTo: { include: { profile: true } } }
  });
}

export async function returnAsset(tenantId: string, assetId: string) {
  return prisma.asset.update({
    where: { id: assetId, tenantId },
    data: { status: 'AVAILABLE', assignedToId: null, location: null },
  });
}

export async function logMaintenance(tenantId: string, assetId: string, data: { description: string, cost: number }) {
  return prisma.$transaction(async (tx) => {
    await tx.asset.update({
      where: { id: assetId, tenantId },
      data: { status: 'IN_MAINTENANCE' }
    });
    
    return tx.assetMaintenance.create({
      data: { tenantId, assetId, description: data.description, cost: data.cost }
    });
  });
}

export async function getAssetStats(tenantId: string) {
  const assets = await prisma.asset.findMany({ where: { tenantId } });
  
  const totalValue = assets.reduce((sum, a) => sum + Number(a.purchasePrice), 0);
  const totalAssets = assets.length;
  const assigned = assets.filter(a => a.status === 'ASSIGNED').length;
  const maintenance = assets.filter(a => a.status === 'IN_MAINTENANCE' || a.status === 'BROKEN').length;

  return { totalValue, totalAssets, assigned, maintenance };
}