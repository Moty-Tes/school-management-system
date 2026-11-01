import { Request, Response, NextFunction } from 'express';
import { DurableQueueEngine } from '../services/durable-queue.service.js';
import { z } from 'zod';

const enqueueJobSchema = z.object({
  type: z.enum([
    'BULK_INVOICE_GENERATION',
    'FEE_REMINDERS_BROADCAST',
    'STUDENT_REPORT_CARD_BATCH',
    'ATTENDANCE_ANOMALY_SWEEP',
    'MASS_SMS_DISPATCH',
  ]),
  data: z.record(z.any()),
  priority: z.number().int().min(1).max(4).optional(),
});

export async function enqueueJobHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const input = enqueueJobSchema.parse(req.body);

    const job = await DurableQueueEngine.enqueue(
      req.auth.tenantId,
      input.type,
      input.data,
      { priority: (input.priority as any) || 2 }
    );

    res.status(202).json({ success: true, data: job });
  } catch (err) { next(err); }
}

export async function getJobStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const { jobId } = req.params;
    const job = await DurableQueueEngine.getJob(req.auth.tenantId, jobId);

    if (!job) {
      return res.status(404).json({ success: false, error: 'Durable job not found' });
    }

    res.status(200).json({ success: true, data: job });
  } catch (err) { next(err); }
}

export async function listJobsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const status = req.query.status as string | undefined;
    const jobs = await DurableQueueEngine.listJobs(req.auth.tenantId, status);
    res.status(200).json({ success: true, data: jobs });
  } catch (err) { next(err); }
}
