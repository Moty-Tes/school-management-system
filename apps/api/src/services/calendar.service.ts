import { prisma } from '../lib/prisma.js';

export async function createEvent(tenantId: string, data: any) {
  return prisma.schoolEvent.create({
    data: {
      tenantId,
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      type: data.type,
      color: data.color,
    },
  });
}

export async function listEvents(tenantId: string, month: number, year: number) {
  // Fetch events for the specific month
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  return prisma.schoolEvent.findMany({
    where: {
      tenantId,
      startDate: { lte: endOfMonth },
      endDate: { gte: startOfMonth },
    },
    orderBy: { startDate: 'asc' },
  });
}

export async function deleteEvent(tenantId: string, eventId: string) {
  return prisma.schoolEvent.delete({
    where: { id: eventId, tenantId },
  });
}