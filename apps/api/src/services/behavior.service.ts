import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import * as notificationService from './notification.service.js';

export async function createBehaviorLog(tenantId: string, teacherUserId: string, data: {
  studentId: string, type: 'POSITIVE' | 'NEGATIVE', title: string, description?: string
}) {
  // 1. Find the teacher profile
  const teacher = await prisma.teacherProfile.findFirst({
    where: { tenantId, userId: teacherUserId },
  });
  if (!teacher) throw new AppError('Only teachers can log behavior', 403, 'FORBIDDEN');

  // 2. Create the log
  const log = await prisma.behaviorLog.create({
    data: {
      tenantId,
      studentId: data.studentId,
      teacherId: teacher.id,
      type: data.type,
      title: data.title,
      description: data.description,
    },
    include: { student: true }
  });

  // 3. NOTIFY PARENTS
  // Find all parents linked to this student
  const parentLinks = await prisma.parentStudent.findMany({
    where: { studentId: data.studentId },
    include: { parent: { include: { user: true } } }
  });

  const emoji = data.type === 'POSITIVE' ? '🌟' : '⚠️';
  const notifTitle = data.type === 'POSITIVE' ? 'Positive Behavior Note' : 'Behavior Incident Alert';
  const notifMessage = `${emoji} ${log.student.firstName}: ${data.title}`;

  for (const link of parentLinks) {
    await notificationService.createNotification(tenantId, {
      userId: link.parent.userId,
      title: notifTitle,
      message: notifMessage,
      type: data.type === 'POSITIVE' ? 'SUCCESS' : 'WARNING',
      link: `/students/${data.studentId}` // Clicking the notification takes them to the student profile
    });
  }

  return log;
}

export async function getStudentBehavior(tenantId: string, studentId: string) {
  return prisma.behaviorLog.findMany({
    where: { tenantId, studentId },
    include: { teacher: { include: { user: { include: { profile: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
}