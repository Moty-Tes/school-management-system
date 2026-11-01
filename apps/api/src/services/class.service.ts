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
  const classes = await prisma.class.findMany({
    where: { tenantId, deletedAt: null },
    include: {
      _count: {
        select: { students: true },
      },
    },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  });

  return classes.map((c) => ({
    id: c.id,
    name: c.name,
    section: c.section,
    capacity: c.capacity,
    studentCount: c._count.students,
    teacher: 'Department Faculty',
    grade: c.name,
    status: 'active',
  }));
}
