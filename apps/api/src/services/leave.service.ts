import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function requestLeave(tenantId: string, userId: string, data: any) {
  const teacher = await prisma.teacherProfile.findFirst({
    where: { tenantId, userId },
  });
  if (!teacher) throw new AppError('Only staff can request leave', 403, 'FORBIDDEN');

  return prisma.leaveRequest.create({
    data: {
      tenantId,
      teacherId: teacher.id,
      type: data.type,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason,
    },
  });
}

export async function getMyLeaves(tenantId: string, userId: string) {
  const teacher = await prisma.teacherProfile.findFirst({
    where: { tenantId, userId },
  });
  if (!teacher) return [];

  return prisma.leaveRequest.findMany({
    where: { tenantId, teacherId: teacher.id },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllLeaves(tenantId: string) {
  return prisma.leaveRequest.findMany({
    where: { tenantId },
    include: { teacher: { include: { user: { include: { profile: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateLeaveStatus(tenantId: string, leaveId: string, status: 'APPROVED' | 'REJECTED', adminNote?: string) {
  const leave = await prisma.leaveRequest.findFirst({
    where: { id: leaveId, tenantId, status: 'PENDING' },
  });
  if (!leave) throw new AppError('Leave request not found or already processed', 404, 'NOT_FOUND');

  return prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status, adminNote },
  });
}