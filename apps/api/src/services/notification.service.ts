import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createNotification(
  tenantId: string, 
  data: { title: string, message: string, type?: string, userId?: string, link?: string }
) {
  return prisma.notification.create({
    data: {
      tenantId,
      title: data.title,
      message: data.message,
      type: data.type || 'INFO',
      userId: data.userId || null, // null means broadcast to everyone
      link: data.link,
    }
  });
}

export async function getMyNotifications(tenantId: string, userId: string) {
  return prisma.notification.findMany({
    where: {
      tenantId,
      // Fetch notifications specifically for me OR broadcasts (userId is null)
      OR: [{ userId }, { userId: null }],
    },
    orderBy: { createdAt: 'desc' },
    take: 20, // Only get the latest 20
  });
}

export async function markAsRead(tenantId: string, notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, tenantId, OR: [{ userId }, { userId: null }] }
  });

  if (!notification) throw new AppError('Notification not found', 404, 'NOT_FOUND');

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}

export async function markAllAsRead(tenantId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { tenantId, userId, readAt: null },
    data: { readAt: new Date() },
  });
}