import { prisma } from '../lib/prisma.js';

export async function getDashboardStats(tenantId: string) {
  // Promise.all runs all these database queries in parallel for speed
  const [totalStudents, activeStudents, totalUsers, recentStudents] = await Promise.all([
    // 1. Count all students in this school
    prisma.student.count({
      where: { tenantId, deletedAt: null },
    }),
    
    // 2. Count active students
    prisma.student.count({
      where: { tenantId, status: 'ACTIVE', deletedAt: null },
    }),

    // 3. Count how many staff/admin users belong to this school
    prisma.userTenant.count({
      where: { tenantId, status: 'ACTIVE' },
    }),

    // 4. Get the 5 newest students
    prisma.student.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        class: { select: { name: true } },
        createdAt: true,
      },
    }),
  ]);

  return {
    totalStudents,
    activeStudents,
    totalUsers,
    recentStudents,
  };
}