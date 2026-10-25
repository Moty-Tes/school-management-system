import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createCampaign(tenantId: string, data: any) {
  return prisma.fundraisingCampaign.create({
    data: { tenantId, ...data, targetAmount: data.targetAmount },
  });
}

export async function listCampaigns(tenantId: string) {
  return prisma.fundraisingCampaign.findMany({
    where: { tenantId },
    include: { 
      _count: { select: { donations: true } },
      donations: { select: { amount: true } } // Fetch amounts to calculate total raised
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPublicCampaign(tenantCode: string, campaignId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { code: tenantCode } });
  if (!tenant) throw new AppError('School not found', 404, 'NOT_FOUND');

  const campaign = await prisma.fundraisingCampaign.findFirst({
    where: { id: campaignId, tenantId: tenant.id },
    include: {
      tenant: { select: { name: true, logoUrl: true } },
      donations: { orderBy: { createdAt: 'desc' }, take: 20 } // Show top 20 recent donors
    }
  });

  if (!campaign) throw new AppError('Campaign not found', 404, 'NOT_FOUND');
  return campaign;
}

export async function recordDonation(tenantCode: string, campaignId: string, data: any) {
  const tenant = await prisma.tenant.findUnique({ where: { code: tenantCode } });
  if (!tenant) throw new AppError('School not found', 404, 'NOT_FOUND');

  return prisma.donation.create({
    data: {
      tenantId: tenant.id,
      campaignId,
      donorName: data.isAnonymous ? 'Anonymous' : data.donorName,
      donorEmail: data.donorEmail,
      donorPhone: data.donorPhone,
      amount: data.amount,
      message: data.message,
      isAnonymous: data.isAnonymous,
    },
  });
}