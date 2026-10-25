import { prisma } from '../lib/prisma.js';

// Get all uncovered classes for a specific date
export async function getUncoveredClasses(tenantId: string, dateStr: string) {
  const date = new Date(dateStr);
  date.setUTCHours(0, 0, 0, 0);
  const dayOfWeek = date.getUTCDay(); // 0 = Sun, 1 = Mon, etc.

  // 1. Find all teachers who are absent on this date (Approved Leave)
  const absentLeaves = await prisma.leaveRequest.findMany({
    where: {
      tenantId,
      status: 'APPROVED',
      startDate: { lte: date },
      endDate: { gte: date },
    },
    select: { teacherId: true }
  });
  const absentTeacherIds = absentLeaves.map(l => l.teacherId);

  if (absentTeacherIds.length === 0) return [];

  // 2. Find their timetable slots for this day of the week
  const affectedSlots = await prisma.timetable.findMany({
    where: {
      tenantId,
      teacherId: { in: absentTeacherIds },
      dayOfWeek: dayOfWeek === 0 ? 7 : dayOfWeek, // Assuming DB stores 1-5 for Mon-Fri
    },
    include: {
      class: true,
      subject: true,
      teacher: { include: { user: { include: { profile: true } } } },
      substituteAssignment: true
    }
  });

  // 3. Filter out slots that already have a substitute
  return affectedSlots.filter(slot => !slot.substituteAssignment);
}

// Suggest available teachers for a specific timetable slot
export async function getAvailableTeachers(tenantId: string, timetableId: string, dateStr: string) {
  const slot = await prisma.timetable.findUnique({ where: { id: timetableId } });
  if (!slot) throw new Error("Timetable slot not found");

  // 1. Find teachers who are busy at this exact time on this day
  const busySlots = await prisma.timetable.findMany({
    where: {
      tenantId,
      dayOfWeek: slot.dayOfWeek,
      OR: [
        { startTime: { lt: slot.endTime }, endTime: { gt: slot.startTime } } // Overlap logic
      ]
    },
    select: { teacherId: true }
  });
  const busyTeacherIds = busySlots.map(s => s.teacherId);

  // 2. Find teachers who are on approved leave
  const date = new Date(dateStr);
  const onLeave = await prisma.leaveRequest.findMany({
    where: { tenantId, status: 'APPROVED', startDate: { lte: date }, endDate: { gte: date } },
    select: { teacherId: true }
  });
  const onLeaveIds = onLeave.map(l => l.teacherId);

  // 3. Return all OTHER teachers
  return prisma.teacherProfile.findMany({
    where: {
      tenantId,
      id: { notIn: [...busyTeacherIds, ...onLeaveIds] } // Exclude busy and on-leave
    },
    include: { user: { include: { profile: true } } }
  });
}

export async function assignSubstitute(tenantId: string, data: { timetableId: string, absentTeacherId: string, coverTeacherId: string, date: string }) {
  return prisma.substituteAssignment.create({
    data: {
      tenantId,
      timetableId: data.timetableId,
      absentTeacherId: data.absentTeacherId,
      coverTeacherId: data.coverTeacherId,
      date: new Date(data.date),
    }
  });
}