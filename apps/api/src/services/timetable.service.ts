import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createSubject(tenantId: string, data: { name: string, code: string }) {
  return prisma.subject.create({ data: { tenantId, ...data } });
}

export async function listSubjects(tenantId: string) {
  return prisma.subject.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
}

export async function createTimetableEntry(tenantId: string, data: {
  classId: string, subjectId: string, teacherId: string, dayOfWeek: number, startTime: string, endTime: string
}) {
  // THE MAGIC: Conflict Detection
  // Check if the teacher is already booked at this time on this day
  const conflict = await prisma.timetable.findFirst({
    where: {
      tenantId,
      teacherId: data.teacherId,
      dayOfWeek: data.dayOfWeek,
      // Overlap logic: (StartA < EndB) AND (EndA > StartB)
      startTime: { lt: data.endTime },
      endTime: { gt: data.startTime },
    },
  });

  if (conflict) {
    throw new AppError('Teacher is already booked during this time slot!', 409, 'SCHEDULE_CONFLICT');
  }

  // Check if the class is already booked at this time
  const classConflict = await prisma.timetable.findFirst({
    where: {
      tenantId,
      classId: data.classId,
      dayOfWeek: data.dayOfWeek,
      startTime: { lt: data.endTime },
      endTime: { gt: data.startTime },
    },
  });

  if (classConflict) {
    throw new AppError('This class already has another subject scheduled during this time!', 409, 'CLASS_CONFLICT');
  }

  return prisma.timetable.create({
    data: { tenantId, ...data },
    include: { subject: true, teacher: { include: { user: { include: { profile: true } } } } },
  });
}

export async function getTimetable(tenantId: string, classId: string) {
  return prisma.timetable.findMany({
    where: { tenantId, classId },
    include: { 
      subject: true, 
      teacher: { include: { user: { include: { profile: true } } } } 
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}