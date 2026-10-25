import { prisma } from '../lib/prisma.js';
import * as notificationService from './notification.service.js';
export async function createAnnouncement(tenantId: string, data: { title: string, content: string, classId?: string }) {
  const announcement = await prisma.announcement.create({
    data: { tenantId, title: data.title, content: data.content, classId: data.classId || null },
  });

  // AUTO-GENERATE NOTIFICATION
  await notificationService.createNotification(tenantId, {
    title: 'New Announcement',
    message: data.title,
    type: 'INFO',
    link: '/announcements',
  });

  return announcement;
}

export async function listAnnouncements(tenantId: string, classId?: string) {
  return prisma.announcement.findMany({
    where: { 
      tenantId,
      // If classId is provided, get announcements for that class OR whole school
      ...(classId ? { OR: [{ classId }, { classId: null }] } : {}) 
    },
    include: { class: true },
    orderBy: { createdAt: 'desc' },
  });
}
