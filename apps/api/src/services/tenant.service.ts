import { prisma } from '../lib/prisma.js';

export async function getTenantSettings(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      primaryColor: true,
      locale: true,
      timezone: true,
      enabledModules: true, 
    },
  });
}

export async function updateTenantSettings(tenantId: string, data: { name?: string, logoUrl?: string, primaryColor?: string, enabledModules?: string[] }) {
  return prisma.tenant.update({
    where: { id: tenantId },
    data,
  });
}