import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import * as notificationService from './notification.service.js';
import { getIO } from '../lib/socket.js';

export function startAutomations() {
  console.log('⏰ Starting background automation engine...');

  // ---------------------------------------------------------
  // 1. ABSENCE ALERTS (Runs Every Day at 10:00 AM)
  // ---------------------------------------------------------
  cron.schedule('0 10 * * *', async () => {
    console.log('🤖 Running Daily Absence Alert Job...');
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const absences = await prisma.attendance.findMany({
        where: { date: today, status: 'ABSENT' },
        include: {
          student: {
            include: {
              parents: { include: { parent: { include: { user: true } } } }
            }
          }
        }
      });

      for (const record of absences) {
        for (const link of record.student.parents) {
          const parentUserId = link.parent.userId;
          const notif = await notificationService.createNotification(record.tenantId, {
            userId: parentUserId,
            title: 'Absence Alert ⚠️',
            message: `${record.student.firstName} was marked ABSENT today. Please contact the school.`,
            type: 'ALERT',
            link: `/students/${record.studentId}`
          });
          try { getIO().to(parentUserId).emit('new_notification', notif); } catch (err) {}
        }
      }
      console.log(`✅ Absence alerts sent for ${absences.length} students.`);
    } catch (error) {
      console.error('❌ Absence alert job failed:', error);
    }
  });

  // ---------------------------------------------------------
  // 2. FEE REMINDERS (Runs Every Day at 8:00 AM)
  // ---------------------------------------------------------
  cron.schedule('0 8 * * *', async () => {
    console.log('🤖 Running Daily Fee Reminder Job...');
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      threeDaysFromNow.setUTCHours(23, 59, 59, 999);

      const startOfTargetDay = new Date(threeDaysFromNow);
      startOfTargetDay.setUTCHours(0, 0, 0, 0);

      const dueInvoices = await prisma.invoice.findMany({
        where: {
          status: { not: 'PAID' },
          dueDate: { gte: startOfTargetDay, lte: threeDaysFromNow }
        },
        include: {
          student: {
            include: {
              parents: { include: { parent: { include: { user: true } } } }
            }
          }
        }
      });

      for (const invoice of dueInvoices) {
        for (const link of invoice.student.parents) {
          const parentUserId = link.parent.userId;
          const notif = await notificationService.createNotification(invoice.tenantId, {
            userId: parentUserId,
            title: 'Fee Payment Reminder 💰',
            message: `Reminder: Invoice for "${invoice.title}" (${invoice.amount} ETB) is due in 3 days.`,
            type: 'WARNING',
            link: `/finance`
          });
          try { getIO().to(parentUserId).emit('new_notification', notif); } catch (err) {}
        }
      }
      console.log(`✅ Fee reminders sent for ${dueInvoices.length} invoices.`);
    } catch (error) {
      console.error('❌ Fee reminder job failed:', error);
    }
  });

  // ---------------------------------------------------------
  // 3. HR CONTRACT EXPIRY ALERTS (Runs Every Day at 9:00 AM)
  // ---------------------------------------------------------
  cron.schedule('0 9 * * *', async () => {
    console.log('🤖 Running Daily HR Contract Expiry Check...');
    try {
      // Find contracts expiring in exactly 30 days
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30);
      targetDate.setUTCHours(23, 59, 59, 999);
      
      const startOfTargetDay = new Date(targetDate);
      startOfTargetDay.setUTCHours(0, 0, 0, 0);

      const expiringTeachers = await prisma.teacherProfile.findMany({
        where: {
          contractEndDate: {
            gte: startOfTargetDay,
            lte: targetDate
          }
        },
        include: { user: { include: { profile: true } }, tenant: true }
      });

      for (const teacher of expiringTeachers) {
        // Notify the Tenant Admin (we find the admins of this school)
        const admins = await prisma.userTenant.findMany({
          where: { tenantId: teacher.tenantId, roles: { some: { role: { slug: 'TENANT_ADMIN' } } } },
          select: { userId: true }
        });

        for (const admin of admins) {
          const notif = await notificationService.createNotification(teacher.tenantId, {
            userId: admin.userId,
            title: 'Contract Expiry Alert ⏳',
            message: `Teacher ${teacher.user.profile?.firstName} ${teacher.user.profile?.lastName} contract expires in 30 days.`,
            type: 'ALERT',
            link: `/hr`
          });
          try { getIO().to(admin.userId).emit('new_notification', notif); } catch (err) {}
        }
      }
      console.log(`✅ HR contract alerts sent for ${expiringTeachers.length} teachers.`);
    } catch (error) {
      console.error('❌ HR contract job failed:', error);
    }
  });

  // ---------------------------------------------------------
  // 4. BIRTHDAY WISHES (Runs Every Day at 7:00 AM)
  // ---------------------------------------------------------
  cron.schedule('0 7 * * *', async () => {
    console.log('🤖 Running Daily Birthday Wishes Job...');
    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1; // 1-12
      const currentDay = today.getDate();

      // Prisma doesn't easily query by "month and day" of a DateTime, so we fetch all students and filter in memory
      // (For a school with <10k students, this is perfectly fast for a background job)
      const students = await prisma.student.findMany({
        where: { deletedAt: null, dateOfBirth: { not: null } },
        include: {
          parents: { include: { parent: { include: { user: true } } } }
        }
      });

      let birthdayCount = 0;

      for (const student of students) {
        if (!student.dateOfBirth) continue;
        
        const dob = new Date(student.dateOfBirth);
        if (dob.getMonth() + 1 === currentMonth && dob.getDate() === currentDay) {
          birthdayCount++;
          
          for (const link of student.parents) {
            const parentUserId = link.parent.userId;
            const notif = await notificationService.createNotification(student.tenantId, {
              userId: parentUserId,
              title: 'Happy Birthday! 🎂',
              message: `All of us at the school wish ${student.firstName} a very Happy Birthday!`,
              type: 'SUCCESS',
              link: `/students/${student.id}`
            });
            try { getIO().to(parentUserId).emit('new_notification', notif); } catch (err) {}
          }
        }
      }
      console.log(`✅ Birthday wishes sent for ${birthdayCount} students.`);
    } catch (error) {
      console.error('❌ Birthday job failed:', error);
    }
  });

  console.log('✅ Automation engine initialized with 4 background robots.');
}