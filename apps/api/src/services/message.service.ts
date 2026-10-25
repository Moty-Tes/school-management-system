import { prisma } from '../lib/prisma.js';
import { getIO } from '../lib/socket.js'; // <-- Import the Radio Station

export async function getContacts(tenantId: string, currentUserId: string, role: string) {
  let allowedRoles = ['TENANT_ADMIN', 'SUPER_ADMIN'];
  if (role === 'PARENT') allowedRoles.push('TEACHER');
  if (role === 'TEACHER') allowedRoles.push('PARENT');

  return prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      tenantLinks: {
        some: {
          tenantId,
          status: 'ACTIVE',
          roles: { some: { role: { slug: { in: allowedRoles } } } }
        }
      }
    },
    select: {
      id: true,
      profile: { select: { firstName: true, lastName: true } },
      tenantLinks: {
        where: { tenantId },
        select: { roles: { select: { role: { select: { name: true } } } } }
      }
    }
  });
}

export async function getConversation(tenantId: string, userA: string, userB: string) {
  return prisma.message.findMany({
    where: {
      tenantId,
      OR: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function sendMessage(tenantId: string, senderId: string, receiverId: string, content: string) {
  const message = await prisma.message.create({
    data: { tenantId, senderId, receiverId, content },
  });

  // REALTIME MAGIC: Emit the message to the receiver and the sender instantly
  try {
    const io = getIO();
    io.to(receiverId).emit('new_message', message);
    io.to(senderId).emit('new_message', message);
  } catch (err) {
    console.error("Socket error:", err);
  }

  return message;
}

export async function markConversationRead(tenantId: string, receiverId: string, senderId: string) {
  return prisma.message.updateMany({
    where: { tenantId, receiverId, senderId, readAt: null },
    data: { readAt: new Date() },
  });
}