import { prisma } from '../lib/prisma.js';

export async function sendBroadcast(tenantId: string, data: { title: string, content: string, targetGroup: string, channel: string }) {
  // 1. Calculate how many people are receiving this
  let recipientCount = 0;

  if (data.targetGroup === 'TEACHERS') {
    recipientCount = await prisma.teacherProfile.count({ where: { tenantId } });
  } else if (data.targetGroup === 'PARENTS') {
    recipientCount = await prisma.parentProfile.count({ where: { tenantId } });
  } else if (data.targetGroup === 'STUDENTS') {
    recipientCount = await prisma.student.count({ where: { tenantId, deletedAt: null } });
  } else {
    // ALL
    const [teachers, parents, students] = await Promise.all([
      prisma.teacherProfile.count({ where: { tenantId } }),
      prisma.parentProfile.count({ where: { tenantId } }),
      prisma.student.count({ where: { tenantId, deletedAt: null } })
    ]);
    recipientCount = teachers + parents + students;
  }

  // 2. Save the broadcast log to the database
  const broadcast = await prisma.broadcast.create({
    data: {
      tenantId,
      title: data.title,
      content: data.content,
      targetGroup: data.targetGroup,
      channel: data.channel,
      recipientCount,
    },
  });

  // 3. In a real app, this is where you would call Twilio, Afromessage, or SendGrid.
  // For our demo, we simulate a successful API call.
  console.log(`[SIMULATED ${data.channel}] Sending to ${recipientCount} ${data.targetGroup}: ${data.title}`);

  return broadcast;
}

export async function listBroadcasts(tenantId: string) {
  return prisma.broadcast.findMany({
    where: { tenantId },
    orderBy: { sentAt: 'desc' },
  });
}