import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function upsertDailyLog(tenantId: string, teacherUserId: string, data: any) {
  const teacher = await prisma.teacherProfile.findFirst({ where: { tenantId, userId: teacherUserId } });
  if (!teacher) throw new AppError('Only teachers can log diary entries', 403, 'FORBIDDEN');

  const dateObj = new Date(data.date);
  dateObj.setUTCHours(0, 0, 0, 0);

  return prisma.dailyLog.upsert({
    where: { studentId_date: { studentId: data.studentId, date: dateObj } },
    update: {
      mood: data.mood,
      appetite: data.appetite,
      participation: data.participation,
      homework: data.homework,
      notes: data.notes,
    },
    create: {
      tenantId,
      teacherId: teacher.id,
      studentId: data.studentId,
      date: dateObj,
      mood: data.mood,
      appetite: data.appetite,
      participation: data.participation,
      homework: data.homework,
      notes: data.notes,
    },
  });
}

export async function getStudentLogs(tenantId: string, studentId: string) {
  return prisma.dailyLog.findMany({
    where: { tenantId, studentId },
    include: { teacher: { include: { user: { include: { profile: true } } } } },
    orderBy: { date: 'desc' },
    take: 30, // Last 30 days
  });
}