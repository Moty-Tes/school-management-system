import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/password.js';
import { AppError } from '../middleware/error.middleware.js';

export interface CreateTeacherInput {
  email: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  specialization?: string;
  qualification?: string;
}

export async function createTeacher(tenantId: string, input: CreateTeacherInput) {
  // 1. Check if email exists
  const existingUser = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existingUser) throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');

  // 2. Find the TEACHER role
  const teacherRole = await prisma.role.findFirst({ where: { slug: 'TEACHER', tenantId: null } });
  if (!teacherRole) throw new AppError('TEACHER role missing. Run db:seed', 500, 'NOT_SEEDED');

  // 3. Hash a default password
  const defaultHash = await hashPassword('Teacher123!');

  // 4. Create everything in a Transaction
  const teacher = await prisma.$transaction(async (tx) => {
    // Create User
    const user = await tx.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: defaultHash,
        status: 'ACTIVE',
        profile: {
          create: { firstName: input.firstName, lastName: input.lastName },
        },
      },
    });

    // Link to Tenant
    const userTenant = await tx.userTenant.create({
      data: { userId: user.id, tenantId, status: 'ACTIVE' },
    });

    // Assign Role
    await tx.userTenantRole.create({
      data: { userTenantId: userTenant.id, roleId: teacherRole.id },
    });

    // Create Teacher Profile
    const profile = await tx.teacherProfile.create({
      data: {
        tenantId,
        userId: user.id,
        employeeId: input.employeeId,
        specialization: input.specialization,
        qualification: input.qualification,
      },
      include: { user: { include: { profile: true } } },
    });

    return profile;
  });

  return teacher;
}

export async function listTeachers(tenantId: string) {
  return prisma.teacherProfile.findMany({
    where: { tenantId, deletedAt: null },
    include: { user: { include: { profile: true } } },
    orderBy: { joinDate: 'desc' },
  });
}