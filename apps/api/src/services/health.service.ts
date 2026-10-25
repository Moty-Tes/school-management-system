import { prisma } from '../lib/prisma.js';
import * as notificationService from './notification.service.js';

export async function upsertHealthRecord(tenantId: string, studentId: string, data: any) {
  return prisma.healthRecord.upsert({
    where: { studentId },
    update: { ...data },
    create: { tenantId, studentId, ...data },
  });
}

export async function getHealthRecord(tenantId: string, studentId: string) {
  return prisma.healthRecord.findUnique({
    where: { studentId },
  });
}

export async function logClinicVisit(tenantId: string, studentId: string, data: { symptoms: string, treatment: string, medication?: string }) {
  const visit = await prisma.clinicVisit.create({
    data: { tenantId, studentId, ...data },
    include: { student: true }
  });

  // NOTIFY PARENTS
  const parentLinks = await prisma.parentStudent.findMany({
    where: { studentId },
    include: { parent: { include: { user: true } } }
  });

  const notifMessage = `${visit.student.firstName} visited the clinic for: ${data.symptoms}. Treatment: ${data.treatment}`;

  for (const link of parentLinks) {
    await notificationService.createNotification(tenantId, {
      userId: link.parent.userId,
      title: 'School Clinic Visit 🏥',
      message: notifMessage,
      type: 'WARNING',
      link: `/students/${studentId}`
    });
  }

  return visit;
}

export async function getRecentVisits(tenantId: string) {
  return prisma.clinicVisit.findMany({
    where: { tenantId },
    include: { student: true },
    orderBy: { visitedAt: 'desc' },
    take: 50
  });
}