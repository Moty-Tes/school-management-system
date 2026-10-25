import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function submitApplication(tenantCode: string, data: any) {
  const tenant = await prisma.tenant.findUnique({ where: { code: tenantCode } });
  if (!tenant) throw new AppError('School not found', 404, 'NOT_FOUND');

  return prisma.admissionApplication.create({
    data: {
      tenantId: tenant.id,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      guardianEmail: data.guardianEmail,
      previousSchool: data.previousSchool,
    },
  });
}

export async function listApplications(tenantId: string) {
  return prisma.admissionApplication.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function reviewApplication(tenantId: string, applicationId: string, status: 'ACCEPTED' | 'REJECTED', classId?: string) {
  const app = await prisma.admissionApplication.findFirst({
    where: { id: applicationId, tenantId, status: 'PENDING' },
  });
  if (!app) throw new AppError('Application not found or already processed', 404, 'NOT_FOUND');

  if (status === 'ACCEPTED') {
    if (!classId) throw new AppError('Class ID is required to accept an application', 400, 'CLASS_REQUIRED');

    // TRANSACTION: Create Student AND Update Application Status
    return prisma.$transaction(async (tx) => {
      // 1. Generate admission number
      const count = await tx.student.count({ where: { tenantId } });
      const admissionNumber = `STU-${String(count + 1).padStart(4, '0')}`;

      // 2. Create the actual Student
      await tx.student.create({
        data: {
          tenantId,
          admissionNumber,
          firstName: app.firstName,
          lastName: app.lastName,
          gender: app.gender,
          dateOfBirth: app.dateOfBirth,
          classId: classId,
          guardianName: app.guardianName,
          guardianPhone: app.guardianPhone,
        },
      });

      // 3. Mark application as ACCEPTED
      return tx.admissionApplication.update({
        where: { id: applicationId },
        data: { status: 'ACCEPTED' },
      });
    });
  }

  // If REJECTED, just update the status
  return prisma.admissionApplication.update({
    where: { id: applicationId },
    data: { status: 'REJECTED' },
  });
}