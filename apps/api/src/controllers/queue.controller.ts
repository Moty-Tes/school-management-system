import { Request, Response, NextFunction } from 'express';
import { BackgroundQueueEngine, JobType } from '../services/queue.service.js';
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
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
});

export async function enqueueJobHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const input = enqueueJobSchema.parse(req.body);

    const job = await BackgroundQueueEngine.enqueue(
      req.auth.tenantId,
      input.type as JobType,
      input.data,
      { priority: input.priority }
    );

    res.status(202).json({ success: true, data: job });
  } catch (err) { next(err); }
}

export async function getJobStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobId } = req.params;
    const job = BackgroundQueueEngine.getJob(jobId);

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.status(200).json({ success: true, data: job });
  } catch (err) { next(err); }
}

export async function listJobsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const jobs = BackgroundQueueEngine.listJobs(req.auth.tenantId);
    res.status(200).json({ success: true, data: jobs });
  } catch (err) { next(err); }
}
