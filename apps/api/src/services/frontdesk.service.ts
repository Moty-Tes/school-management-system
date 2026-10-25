import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function logVisitor(tenantId: string, data: { name: string, phone?: string, purpose: string, hostName?: string }) {
  return prisma.visitorLog.create({
    data: { tenantId, ...data },
  });
}

export async function checkoutVisitor(tenantId: string, visitorId: string) {
  return prisma.visitorLog.update({
    where: { id: visitorId, tenantId },
    data: { checkOutTime: new Date() },
  });
}

export async function listActiveVisitors(tenantId: string) {
  return prisma.visitorLog.findMany({
    where: { tenantId, checkOutTime: null },
    orderBy: { checkInTime: 'desc' },
  });
}

export async function createGatePass(tenantId: string, data: { admissionNumber: string, reason: string, releasedTo: string, approvedBy: string }) {
  // Find the student by admission number
  const student = await prisma.student.findFirst({
    where: { tenantId, admissionNumber: data.admissionNumber, deletedAt: null }
  });
  if (!student) throw new AppError('Student not found with this Admission Number', 404, 'NOT_FOUND');

  // Check if they already have an active gate pass (haven't returned yet)
  const activePass = await prisma.gatePass.findFirst({
    where: { tenantId, studentId: student.id, returnTime: null }
  });
  if (activePass) throw new AppError('Student is already out of school', 400, 'ALREADY_OUT');

  return prisma.gatePass.create({
    data: {
      tenantId,
      studentId: student.id,
      reason: data.reason,
      releasedTo: data.releasedTo,
      approvedBy: data.approvedBy,
    },
    include: { student: true }
  });
}

export async function returnStudent(tenantId: string, passId: string) {
  return prisma.gatePass.update({
    where: { id: passId, tenantId },
    data: { returnTime: new Date() },
    include: { student: true }
  });
}

export async function listActiveGatePasses(tenantId: string) {
  return prisma.gatePass.findMany({
    where: { tenantId, returnTime: null },
    include: { student: true },
    orderBy: { exitTime: 'desc' },
  });
}