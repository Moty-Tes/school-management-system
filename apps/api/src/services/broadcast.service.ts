import { prisma } from '../lib/prisma.js';
import { TelephonyService } from './telephony.service.js';

export async function sendBroadcast(
  tenantId: string,
  data: { title: string; content: string; targetGroup: string; channel: string }
) {
  // 1. Fetch targeted recipients with their contact info
  let phones: string[] = [];
  let emails: string[] = [];
  let userIds: string[] = [];

  if (data.targetGroup === 'TEACHERS' || data.targetGroup === 'ALL') {
    const teachers = await prisma.teacherProfile.findMany({
      where: { tenantId },
      include: { user: { include: { profile: true } } },
    });
    for (const t of teachers) {
      if (t.user.email) emails.push(t.user.email);
      if (t.user.profile?.phone) phones.push(t.user.profile.phone);
      userIds.push(t.userId);
    }
  }

  if (data.targetGroup === 'PARENTS' || data.targetGroup === 'ALL') {
    const parents = await prisma.parentProfile.findMany({
      where: { tenantId },
      include: { user: { include: { profile: true } } },
    });
    for (const p of parents) {
      if (p.user.email) emails.push(p.user.email);
      if (p.user.profile?.phone) phones.push(p.user.profile.phone);
      userIds.push(p.userId);
    }
  }

  if (data.targetGroup === 'STUDENTS' || data.targetGroup === 'ALL') {
    const students = await prisma.student.findMany({
      where: { tenantId, deletedAt: null },
      select: { guardianPhone: true },
    });
    for (const s of students) {
      if (s.guardianPhone) phones.push(s.guardianPhone);
    }
  }

  // Deduplicate
  phones = Array.from(new Set(phones.filter(Boolean)));
  emails = Array.from(new Set(emails.filter(Boolean)));
  userIds = Array.from(new Set(userIds.filter(Boolean)));

  const recipientCount = Math.max(phones.length, emails.length, userIds.length, 1);

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

  // 3. Real Dispatch via TelephonyService
  const channelUpper = (data.channel || 'IN_APP').toUpperCase();

  if (channelUpper === 'SMS' || channelUpper === 'ALL') {
    for (const phone of phones) {
      TelephonyService.sendSms({
        to: phone,
        message: `${data.title}: ${data.content}`,
      }).catch(err => console.error('SMS broadcast dispatch error:', err));
    }
  }

  if (channelUpper === 'EMAIL' || channelUpper === 'ALL') {
    for (const email of emails) {
      TelephonyService.sendEmail({
        to: email,
        subject: data.title,
        text: data.content,
      }).catch(err => console.error('Email broadcast dispatch error:', err));
    }
  }

  // Always create in-app notifications
  for (const uid of userIds) {
    prisma.notification.create({
      data: {
        tenantId,
        userId: uid,
        title: data.title,
        message: data.content,
        type: 'INFO',
        link: '/announcements',
      },
    }).catch(() => {});
  }

  return broadcast;
}

export async function listBroadcasts(tenantId: string) {
  return prisma.broadcast.findMany({
    where: { tenantId },
    orderBy: { sentAt: 'desc' },
  });
}
