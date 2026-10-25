import { prisma } from '../lib/prisma.js';

const PRICE_PER_STUDENT = 50; // Your business model: 50 ETB per student

export async function getPlatformStats() {
  // 1. Get all active tenants
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE', code: { not: '_system' } }, // Exclude the system tenant
    include: {
      _count: {
        select: { userTenants: true }, // Assuming userTenants holds students/staff
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Calculate total students and revenue across the whole platform
  let totalStudents = 0;
  let totalRevenue = 0;

  // We need to fetch actual student counts, not just users.
  // Let's do a grouped query for efficiency.
  const studentCounts = await prisma.student.groupBy({
    by: ['tenantId'],
    where: { deletedAt: null },
    _count: { id: true },
  });

  const tenantData = tenants.map((tenant) => {
    const studentCount = studentCounts.find((s) => s.tenantId === tenant.id)?._count.id || 0;
    const monthlyBill = studentCount * PRICE_PER_STUDENT;
    
    totalStudents += studentCount;
    totalRevenue += monthlyBill;

    return {
      id: tenant.id,
      name: tenant.name,
      code: tenant.code,
      status: tenant.status,
      studentCount,
      monthlyBill,
      joinedAt: tenant.createdAt,
    };
  });

  return {
    overview: {
      totalSchools: tenants.length,
      totalStudents,
      monthlyRevenue: totalRevenue,
      annualRevenue: totalRevenue * 12,
    },
    tenants: tenantData,
  };
}