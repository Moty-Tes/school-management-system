import { BackgroundQueueEngine } from './queue.service.js';
import { prisma } from '../lib/prisma.js';
import * as notificationService from './notification.service.js';

/**
 * Register core background task processors
 */
export function initializeQueueProcessors() {
  // 1. BULK INVOICE GENERATION
  BackgroundQueueEngine.registerProcessor(
    'BULK_INVOICE_GENERATION',
    async (job, updateProgress) => {
      const { classId, title, amount, dueDate } = job.data as any;
      const tenantId = job.tenantId;

      const students = await prisma.student.findMany({
        where: { tenantId, classId },
      });

      if (students.length === 0) {
        return { count: 0, message: 'No students found in the specified class.' };
      }

      let generated = 0;
      const total = students.length;

      // Chunk into batches of 25 to avoid overwhelming the database
      const chunkSize = 25;
      for (let i = 0; i < total; i += chunkSize) {
        const batch = students.slice(i, i + chunkSize);

        await prisma.$transaction(
          batch.map((student) =>
            prisma.invoice.create({
              data: {
                tenantId,
                studentId: student.id,
                title: title || 'Tuition Fee Invoice',
                amount: amount as any,
                dueDate: new Date(dueDate),
              },
            })
          )
        );

        generated += batch.length;
        updateProgress((generated / total) * 100);
      }

      return {
        count: generated,
        classId,
        completedAt: new Date().toISOString(),
      };
    }
  );

  // 2. FEE REMINDERS BROADCAST
  BackgroundQueueEngine.registerProcessor(
    'FEE_REMINDERS_BROADCAST',
    async (job, updateProgress) => {
      const tenantId = job.tenantId;

      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          status: { in: ['UNPAID', 'PARTIAL'] },
        },
        include: {
          student: {
            include: {
              parents: {
                include: { parent: true },
              },
            },
          },
        },
      });

      const total = unpaidInvoices.length;
      let sentCount = 0;

      for (let i = 0; i < total; i++) {
        const inv = unpaidInvoices[i];
        const parentUserId = inv.student.parents[0]?.parent?.userId;

        if (parentUserId) {
          await notificationService.createNotification(tenantId, {
            userId: parentUserId,
            title: 'Tuition Fee Payment Reminder 📢',
            message: `Reminder: Invoice "${inv.title}" for ${inv.amount} ETB is currently due. Please settle your balance promptly.`,
            type: 'WARNING',
            link: '/finance',
          });
          sentCount++;
        }
        updateProgress(((i + 1) / total) * 100);
      }

      return { remindersSent: sentCount, totalInvoicesProcessed: total };
    }
  );

  // 3. ATTENDANCE ANOMALY SWEEP
  BackgroundQueueEngine.registerProcessor(
    'ATTENDANCE_ANOMALY_SWEEP',
    async (job, updateProgress) => {
      const tenantId = job.tenantId;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const students = await prisma.student.findMany({
        where: { tenantId },
        include: {
          attendance: {
            where: { date: { gte: thirtyDaysAgo } },
          },
        },
      });

      const anomalies: { studentId: string; studentName: string; absenceRate: number }[] = [];
      const total = students.length;

      for (let i = 0; i < total; i++) {
        const s = students[i];
        const records = s.attendance;
        if (records.length >= 5) {
          const absences = records.filter(a => a.status === 'ABSENT').length;
          const rate = absences / records.length;
          if (rate >= 0.25) { // 25%+ absence rate in last 30 days
            anomalies.push({
              studentId: s.id,
              studentName: `${s.firstName} ${s.lastName}`,
              absenceRate: Math.round(rate * 100),
            });
          }
        }
        updateProgress(((i + 1) / total) * 100);
      }

      return {
        flaggedStudentsCount: anomalies.length,
        anomalies,
        sweptAt: new Date().toISOString(),
      };
    }
  );
}
