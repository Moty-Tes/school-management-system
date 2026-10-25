import { prisma } from '../lib/prisma.js';

export async function createLog(
  tenantId: string, 
  userId: string, 
  action: string, 
  entity: string, 
  details: string
) {
  try {
    await prisma.auditLog.create({
      data: { tenantId, userId, action, entity, details },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export async function getRecentActivity(tenantId: string, search?: string, actionFilter?: string) {
  const whereClause: any = { tenantId };
  
  if (search) {
    whereClause.OR = [
      { details: { contains: search, mode: 'insensitive' } },
      { user: { profile: { firstName: { contains: search, mode: 'insensitive' } } } },
      { user: { profile: { lastName: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  if (actionFilter && actionFilter !== 'ALL') {
    whereClause.action = actionFilter;
  }

  return prisma.auditLog.findMany({
    where: whereClause,
    include: {
      user: { select: { profile: { select: { firstName: true, lastName: true } }, email: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100, // Fetch the latest 100 logs
  });
}