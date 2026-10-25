import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createEvent(tenantId: string, data: { title: string, date: string }) {
  return prisma.pTMEvent.create({
    data: { tenantId, title: data.title, date: new Date(data.date) },
  });
}

export async function listEvents(tenantId: string) {
  return prisma.pTMEvent.findMany({
    where: { tenantId },
    orderBy: { date: 'desc' },
  });
}

// Generate 15-minute slots automatically
export async function createSlots(tenantId: string, userId: string, data: { eventId: string, startTime: string, endTime: string }) {
  const teacher = await prisma.teacherProfile.findFirst({ where: { tenantId, userId } });
  if (!teacher) throw new AppError('Only teachers can create slots', 403, 'FORBIDDEN');

  const slots = [];
  let current = new Date(`1970-01-01T${data.startTime}:00Z`);
  const end = new Date(`1970-01-01T${data.endTime}:00Z`);

  while (current < end) {
    const slotStart = current.toISOString().slice(11, 16);
    current.setMinutes(current.getMinutes() + 15);
    const slotEnd = current.toISOString().slice(11, 16);
    
    slots.push({
      tenantId,
      eventId: data.eventId,
      teacherId: teacher.id,
      startTime: slotStart,
      endTime: slotEnd,
    });
  }

  // Use createMany to insert all slots instantly
  return prisma.pTMSlot.createMany({
    data: slots,
    skipDuplicates: true,
  });
}

export async function getTeacherSlots(tenantId: string, userId: string) {
  const teacher = await prisma.teacherProfile.findFirst({ where: { tenantId, userId } });
  if (!teacher) return [];

  return prisma.pTMSlot.findMany({
    where: { tenantId, teacherId: teacher.id },
    include: { 
      event: true,
      booking: { include: { student: true } }
    },
    orderBy: [{ eventId: 'asc' }, { startTime: 'asc' }],
  });
}

export async function getAvailableSlots(tenantId: string, eventId: string) {
  return prisma.pTMSlot.findMany({
    where: { tenantId, eventId, isBooked: false },
    include: { teacher: { include: { user: { include: { profile: true } } } } },
    orderBy: { startTime: 'asc' },
  });
}

export async function bookSlot(tenantId: string, studentId: string, slotId: string, notes?: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Check if slot is still available
    const slot = await tx.pTMSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new AppError('Slot not found', 404, 'NOT_FOUND');
    if (slot.isBooked) throw new AppError('This time slot has already been booked', 400, 'ALREADY_BOOKED');

    // 2. Mark slot as booked
    await tx.pTMSlot.update({
      where: { id: slotId },
      data: { isBooked: true },
    });

    // 3. Create booking
    return tx.pTMBooking.create({
      data: { tenantId, slotId, studentId, notes },
    });
  });
}