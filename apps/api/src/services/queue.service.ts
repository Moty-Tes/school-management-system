import { getIO } from '../lib/socket.js';

export type JobType =
  | 'BULK_INVOICE_GENERATION'
  | 'FEE_REMINDERS_BROADCAST'
  | 'STUDENT_REPORT_CARD_BATCH'
  | 'ATTENDANCE_ANOMALY_SWEEP'
  | 'MASS_SMS_DISPATCH';

export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface BackgroundJob<TData = any, TResult = any> {
  id: string;
  tenantId: string;
  type: JobType;
  status: JobStatus;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  data: TData;
  result?: TResult;
  error?: string;
  progress: number; // 0 to 100
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export type JobProcessor<TData = any, TResult = any> = (
  job: BackgroundJob<TData>,
  updateProgress: (progress: number) => void
) => Promise<TResult>;

/**
 * Enterprise Asynchronous Background Queue Engine
 * Provides priority queuing, exponential backoff retries with jitter,
 * concurrency limiting, Dead Letter Queue (DLQ), and real-time Socket.io updates.
 */
export class BackgroundQueueEngine {
  private static jobs: Map<string, BackgroundJob> = new Map();
  private static processors: Map<JobType, JobProcessor> = new Map();
  private static isProcessing = false;
  private static activeWorkers = 0;
  private static maxConcurrency = 3;

  /**
   * Register a job processor handler
   */
  static registerProcessor<TData, TResult>(type: JobType, processor: JobProcessor<TData, TResult>) {
    this.processors.set(type, processor as JobProcessor);
  }

  /**
   * Enqueue a new background job
   */
  static async enqueue<TData>(
    tenantId: string,
    type: JobType,
    data: TData,
    options: {
      priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
      maxAttempts?: number;
    } = {}
  ): Promise<BackgroundJob<TData>> {
    const id = `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const job: BackgroundJob<TData> = {
      id,
      tenantId,
      type,
      status: 'QUEUED',
      priority: options.priority || 'NORMAL',
      data,
      progress: 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date(),
    };

    this.jobs.set(id, job);

    this.emitEvent(tenantId, 'queue:job_enqueued', {
      jobId: id,
      type,
      priority: job.priority,
      status: job.status,
    });

    // Trigger process cycle
    setImmediate(() => this.processNext());

    return job;
  }

  /**
   * Retrieve job by ID
   */
  static getJob(id: string): BackgroundJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * List jobs for a tenant
   */
  static listJobs(tenantId: string, limit = 20): BackgroundJob[] {
    return Array.from(this.jobs.values())
      .filter(j => j.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Process next queued job adhering to concurrency limits and priority
   */
  private static async processNext() {
    if (this.activeWorkers >= this.maxConcurrency) return;

    // Priority ordering
    const priorityWeight: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1,
    };

    const queuedJobs = Array.from(this.jobs.values())
      .filter(j => j.status === 'QUEUED')
      .sort((a, b) => {
        const pDiff = (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
        if (pDiff !== 0) return pDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    if (queuedJobs.length === 0) return;

    const job = queuedJobs[0];
    const processor = this.processors.get(job.type);

    if (!processor) {
      job.status = 'FAILED';
      job.error = `No registered processor for job type: ${job.type}`;
      job.completedAt = new Date();
      return;
    }

    job.status = 'PROCESSING';
    job.startedAt = new Date();
    job.attempts++;
    this.activeWorkers++;

    this.emitEvent(job.tenantId, 'queue:job_started', {
      jobId: job.id,
      type: job.type,
      attempts: job.attempts,
    });

    const updateProgress = (progress: number) => {
      job.progress = Math.min(100, Math.max(0, Math.round(progress)));
      this.emitEvent(job.tenantId, 'queue:job_progress', {
        jobId: job.id,
        progress: job.progress,
      });
    };

    try {
      const result = await processor(job, updateProgress);
      job.status = 'COMPLETED';
      job.result = result;
      job.progress = 100;
      job.completedAt = new Date();

      this.emitEvent(job.tenantId, 'queue:job_completed', {
        jobId: job.id,
        type: job.type,
        result,
      });
    } catch (err: any) {
      job.error = err?.message || 'Unknown processing error';

      if (job.attempts < job.maxAttempts) {
        // Exponential backoff retry with jitter
        const backoffDelay = Math.pow(2, job.attempts) * 1000 + Math.random() * 500;
        job.status = 'QUEUED';
        setTimeout(() => this.processNext(), backoffDelay);
      } else {
        // Exhausted attempts -> Sent to Dead Letter Queue
        job.status = 'FAILED';
        job.completedAt = new Date();

        this.emitEvent(job.tenantId, 'queue:job_failed', {
          jobId: job.id,
          type: job.type,
          error: job.error,
          deadLettered: true,
        });
      }
    } finally {
      this.activeWorkers--;
      setImmediate(() => this.processNext());
    }
  }

  private static emitEvent(tenantId: string, event: string, payload: any) {
    try {
      const io = getIO();
      io.to(`tenant:${tenantId}`).emit(event, payload);
    } catch {
      // Socket.io optional broadcast fallback
    }
  }
}
