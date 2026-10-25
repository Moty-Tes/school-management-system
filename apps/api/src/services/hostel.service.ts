import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createBlock(tenantId: string, data: any) {
  return prisma.hostelBlock.create({ data: { tenantId, ...data } });
}

export async function createRoom(tenantId: string, blockId: string, data: any) {
  return prisma.hostelRoom.create({ data: { tenantId, blockId, ...data } });
}

export async function allocateStudent(tenantId: string, data: { studentId: string, roomId: string, bedNumber: number }) {
  return prisma.$transaction(async (tx) => {
    // 1. Check capacity
    const room = await tx.hostelRoom.findUnique({ 
      where: { id: data.roomId },
      include: { _count: { select: { allocations: true } } }
    });
    if (!room) throw new AppError('Room not found', 404, 'NOT_FOUND');
    if (room._count.allocations >= room.capacity) throw new AppError('Room is full', 400, 'ROOM_FULL');

    // 2. Check if bed is taken
    const bedTaken = await tx.hostelAllocation.findFirst({
      where: { roomId: data.roomId, bedNumber: data.bedNumber }
    });
    if (bedTaken) throw new AppError(`Bed ${data.bedNumber} is already taken`, 400, 'BED_TAKEN');

    // 3. Check if student already has a bed
    const existing = await tx.hostelAllocation.findUnique({ where: { studentId: data.studentId } });
    if (existing) throw new AppError('Student is already allocated to a hostel', 400, 'ALREADY_ALLOCATED');

    // 4. Create allocation
    return tx.hostelAllocation.create({
      data: { tenantId, ...data },
      include: { student: true, room: { include: { block: true } } }
    });
  });
}

export async function getHostelData(tenantId: string) {
  const [blocks, allocations] = await Promise.all([
    prisma.hostelBlock.findMany({
      where: { tenantId },
      include: {
        rooms: {
          include: {
            allocations: { include: { student: true } }
          }
        }
      }
    }),
    prisma.hostelAllocation.count({ where: { tenantId } })
  ]);
  return { blocks, totalAllocated: allocations };
}

export async function logCheckIn(tenantId: string, data: { allocationId: string, status: string, date: string }) {
  const dateObj = new Date(data.date);
  dateObj.setUTCHours(0, 0, 0, 0);

  return prisma.hostelCheckIn.upsert({
    where: { allocationId_date: { allocationId: data.allocationId, date: dateObj } },
    update: { status: data.status },
    create: { tenantId, allocationId: data.allocationId, status: data.status, date: dateObj }
  });
}