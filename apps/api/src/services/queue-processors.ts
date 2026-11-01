import { DurableQueueEngine } from './durable-queue.service.js';
import { BackgroundQueueEngine } from './queue.service.js';
import { prisma } from '../lib/prisma.js';
import * as notificationService from './notification.service.js';

/**
 * Register background task processors with the Durable Database Queue
 */
export function initializeQueueProcessors() {
  // Start the background durable worker polling loop
  DurableQueueEngine.startWorker();

  // 1. DURABLE: BULK INVOICE GENERATION
  DurableQueueEngine.registerHandler(
    'BULK_INVOICE_GENERATION',
    async (jobId, tenantId, data, updateProgress) => {
      const { classId, title, amount, dueDate } = data as any;

      const students = await prisma.student.findMany({
        where: { tenantId, classId, deletedAt: null },
      });

      if (students.length === 0) {
        return { count: 0, message: 'No students found in the specified class.' };
      }

      let generated = 0;
      const total = students.length;
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
        await updateProgress((generated / total) * 100);
      }

      return {
        count: generated,
        classId,
        completedAt: new Date().toISOString(),
      };
    }
  );

  // 2. DURABLE: FEE REMINDERS BROADCAST
  DurableQueueEngine.registerHandler(
    'FEE_REMINDERS_BROADCAST',
    async (jobId, tenantId, _data, updateProgress) => {
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          status: { in: ['UNPAID', 'PARTIAL'] },
        },
        include: {
          student: {
            include: {
              parents: { include: { parent: true } },
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
        await updateProgress(((i + 1) / total) * 100);
      }

      return { remindersSent: sentCount, totalInvoicesProcessed: total };
    }
  );

  // Also maintain fast in-process registration for ephemeral non-critical tasks
  BackgroundQueueEngine.registerProcessor('ATTENDANCE_ANOMALY_SWEEP', async (job, updateProgress) => {
    updateProgress(100);
    return { completed: true };
  });
}
