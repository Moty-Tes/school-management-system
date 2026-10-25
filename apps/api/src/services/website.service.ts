import { prisma } from '../lib/prisma.js';

export async function getWebsiteSettings(tenantId: string) {
  let website = await prisma.schoolWebsite.findUnique({ where: { tenantId } });
  
  // If no website exists yet, create a default one
  if (!website) {
    website = await prisma.schoolWebsite.create({ data: { tenantId } });
  }
  return website;
}

export async function updateWebsiteSettings(tenantId: string, data: any) {
  return prisma.schoolWebsite.upsert({
    where: { tenantId },
    update: data,
    create: { tenantId, ...data },
  });
}

export async function getPublicWebsite(tenantCode: string) {
  const website = await prisma.schoolWebsite.findFirst({
    where: { 
      tenant: { code: tenantCode },
      isPublished: true 
    },
    include: {
      tenant: { select: { name: true, logoUrl: true, primaryColor: true, slug: true } }
    }
  });
  return website;
}