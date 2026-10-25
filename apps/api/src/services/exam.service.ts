import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createRoom(tenantId: string, data: any) {
  return prisma.examRoom.create({ data: { tenantId, ...data } });
}

export async function listRooms(tenantId: string) {
  return prisma.examRoom.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
}

export async function createExamSchedule(tenantId: string, data: any) {
  return prisma.examSchedule.create({
    data: {
      tenantId,
      title: data.title,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      classIds: data.classIds,
    },
  });
}

export async function listExamSchedules(tenantId: string) {
  return prisma.examSchedule.findMany({
    where: { tenantId },
    orderBy: { date: 'desc' },
    include: { _count: { select: { seats: true } } }
  });
}

export async function generateSeatingPlan(tenantId: string, examId: string) {
  // 1. Verify Exam exists and has no seats yet
  const exam = await prisma.examSchedule.findFirst({ where: { id: examId, tenantId } });
  if (!exam) throw new AppError('Exam not found', 404, 'NOT_FOUND');

  const existingSeats = await prisma.examSeat.count({ where: { examId, tenantId } });
  if (existingSeats > 0) throw new AppError('Seating plan already generated for this exam', 400, 'ALREADY_GENERATED');

  // 2. Fetch all students in the target classes
  const students = await prisma.student.findMany({
    where: { tenantId, classId: { in: exam.classIds }, deletedAt: null },
    select: { id: true, classId: true }
  });

  if (students.length === 0) throw new AppError('No students found in the selected classes', 400, 'NO_STUDENTS');

  // 3. Fetch available rooms
  const rooms = await prisma.examRoom.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
  if (rooms.length === 0) throw new AppError('No exam rooms created', 400, 'NO_ROOMS');

  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  if (totalCapacity < students.length) throw new AppError('Total room capacity is less than the number of students', 400, 'NOT_ENOUGH_SEATS');

  // 4. ALGORITHM: Shuffle students (Fisher-Yates) so they are mixed up
  for (let i = students.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [students[i], students[j]] = [students[j], students[i]];
  }

  // 5. Distribute students into rooms
  const seatAssignments = [];
  let studentIndex = 0;

  for (const room of rooms) {
    if (studentIndex >= students.length) break; // All students assigned

    for (let seatNum = 1; seatNum <= room.capacity; seatNum++) {
      if (studentIndex >= students.length) break;

      seatAssignments.push({
        tenantId,
        examId,
        roomId: room.id,
        studentId: students[studentIndex].id,
        seatNumber: seatNum,
      });

      studentIndex++;
    }
  }

  // 6. Bulk insert the seating plan
  return prisma.examSeat.createMany({
    data: seatAssignments,
  });
}

export async function getSeatingPlan(tenantId: string, examId: string) {
  const seats = await prisma.examSeat.findMany({
    where: { tenantId, examId },
    include: {
      room: true,
      student: { include: { class: true } }
    },
    orderBy: [{ room: { name: 'asc' } }, { seatNumber: 'asc' }]
  });

  // Group by room for the frontend
  const grouped = seats.reduce((acc: any, seat) => {
    const roomName = seat.room.name;
    if (!acc[roomName]) acc[roomName] = [];
    acc[roomName].push(seat);
    return acc;
  }, {});

  return grouped;
}