import { prisma } from '../lib/prisma.js';
import { getIO } from '../lib/socket.js';
import os from 'os';

export type DurableJobHandler<TData = any, TResult = any> = (
  jobId: string,
  tenantId: string,
  data: TData,
  updateProgress: (progress: number) => Promise<void>
) => Promise<TResult>;

/**
 * World-Class Durable Database-Backed Asynchronous Task Queue
 * - Jobs are persisted directly in PostgreSQL (survives crashes, reboots, scale-downs)
 * - Distributed locking with lease expiry watchdog
 * - Priority-aware dequeuing (CRITICAL > HIGH > NORMAL > LOW)
 * - Exponential backoff with jitter on failure
 * - Dead Letter Queue (DLQ) state machine
 */
export class DurableQueueEngine {
  private static handlers: Map<string, DurableJobHandler> = new Map();
  private static workerId = `${os.hostname()}_${process.pid}_${Math.random().toString(36).slice(2, 6)}`;
  private static isRunning = false;
  private static pollTimer: NodeJS.Timeout | null = null;
  private static tableVerified = false;

  /**
   * Automatically ensure durable_jobs table exists in PostgreSQL
   */
  static async ensureTableExists(): Promise<boolean> {
    if (this.tableVerified) return true;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "durable_jobs" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "tenantId" TEXT NOT NULL,
          "queueName" TEXT NOT NULL DEFAULT 'default',
          "jobType" TEXT NOT NULL,
          "payload" JSONB NOT NULL,
          "priority" INTEGER NOT NULL DEFAULT 2,
          "status" TEXT NOT NULL DEFAULT 'QUEUED',
          "attempts" INTEGER NOT NULL DEFAULT 0,
          "maxAttempts" INTEGER NOT NULL DEFAULT 3,
          "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "lockedAt" TIMESTAMP(3),
          "lockedBy" TEXT,
          "lastError" TEXT,
          "progress" INTEGER NOT NULL DEFAULT 0,
          "result" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "completedAt" TIMESTAMP(3)
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "durable_jobs_tenantId_status_runAt_idx" ON "durable_jobs"("tenantId", "status", "runAt");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "durable_jobs_status_runAt_priority_idx" ON "durable_jobs"("status", "runAt", "priority");
      `);
      this.tableVerified = true;
      console.log('✅ DurableQueue: Verified table "durable_jobs" in PostgreSQL.');
      return true;
    } catch (err: any) {
      console.warn('[DurableQueue] Notice during schema verification:', err.message);
      return false;
    }
  }

  /**
   * Register a job type handler
   */
  static registerHandler<TData, TResult>(jobType: string, handler: DurableJobHandler<TData, TResult>) {
    this.handlers.set(jobType, handler as DurableJobHandler);
  }

  /**
   * Enqueue a durable job to the database
   */
  static async enqueue<TData>(
    tenantId: string,
    jobType: string,
    payload: TData,
    options: {
      priority?: 1 | 2 | 3 | 4; // 1=LOW, 2=NORMAL, 3=HIGH, 4=CRITICAL
      queueName?: string;
      maxAttempts?: number;
      delayMs?: number;
    } = {}
  ) {
    const runAt = options.delayMs ? new Date(Date.now() + options.delayMs) : new Date();

    const job = await prisma.durableJob.create({
      data: {
        tenantId,
        queueName: options.queueName || 'default',
        jobType,
        payload: payload as any,
        priority: options.priority || 2,
        status: 'QUEUED',
        attempts: 0,
        maxAttempts: options.maxAttempts || 3,
        runAt,
        progress: 0,
      },
    });

    try {
      const io = getIO();
      io.to(`tenant:${tenantId}`).emit('queue:job_enqueued', {
        jobId: job.id,
        jobType: job.jobType,
        priority: job.priority,
        status: job.status,
      });
    } catch {}

    // Wake worker immediately
    setImmediate(() => this.processNextBatch());

    return job;
  }

  /**
   * Start worker processing loop with crash-recovery watchdog
   */
  static startWorker(pollIntervalMs = 3000) {
    if (this.isRunning) return;
    this.isRunning = true;

    // Immediately verify and create table if needed
    this.ensureTableExists().catch(() => {});

    // Start poll loop with existence checks & graceful error containment
    this.pollTimer = setInterval(async () => {
      if (!this.tableVerified) {
        const ready = await this.ensureTableExists();
        if (!ready) return;
      }
      try {
        await this.reclaimStaleLocks();
        await this.processNextBatch();
      } catch (err: any) {
        if (err?.message?.includes('does not exist') || err?.code === 'P2021') {
          this.tableVerified = false;
        }
      }
    }, pollIntervalMs);

    console.log(`🚀 Durable Database Queue Worker started [Worker ID: ${this.workerId}]`);
  }

  /**
   * Stop worker loop
   */
  static stopWorker() {
    this.isRunning = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Reclaim jobs whose worker lease expired (e.g. worker process crashed while job was running)
   */
  private static async reclaimStaleLocks() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const staleJobs = await prisma.durableJob.updateMany({
      where: {
        status: 'RUNNING',
        lockedAt: { lt: fiveMinutesAgo },
      },
      data: {
        status: 'QUEUED',
        lockedAt: null,
        lockedBy: null,
        lastError: 'Worker lease expired; reclaimed by watchdog for safe retry.',
      },
    });

    if (staleJobs.count > 0) {
      console.warn(`[DurableQueue] Watchdog reclaimed ${staleJobs.count} stale job lock(s).`);
    }
  }

  /**
   * Process next available job batch
   */
  private static async processNextBatch() {
    const now = new Date();

    // 1. Fetch highest-priority queued job ready to run
    const candidates = await prisma.durableJob.findMany({
      where: {
        status: 'QUEUED',
        runAt: { lte: now },
      },
      orderBy: [
        { priority: 'desc' },
        { runAt: 'asc' },
      ],
      take: 1,
    });

    if (candidates.length === 0) return;

    const candidate = candidates[0];

    // 2. Atomic Lease Lock: ensure no other worker grabs the same job
    const lockedJob = await prisma.durableJob.updateMany({
      where: {
        id: candidate.id,
        status: 'QUEUED',
      },
      data: {
        status: 'RUNNING',
        lockedAt: now,
        lockedBy: this.workerId,
        attempts: { increment: 1 },
      },
    });

    if (lockedJob.count === 0) {
      // Another worker locked it first -> continue
      return;
    }

    const handler = this.handlers.get(candidate.jobType);

    if (!handler) {
      await prisma.durableJob.update({
        where: { id: candidate.id },
        data: {
          status: 'FAILED',
          lastError: `No registered handler for durable job type: ${candidate.jobType}`,
          completedAt: new Date(),
        },
      });
      return;
    }

    const updateProgress = async (progress: number) => {
      const sanitized = Math.min(100, Math.max(0, Math.round(progress)));
      await prisma.durableJob.update({
        where: { id: candidate.id },
        data: { progress: sanitized },
      });
      try {
        const io = getIO();
        io.to(`tenant:${candidate.tenantId}`).emit('queue:job_progress', {
          jobId: candidate.id,
          progress: sanitized,
        });
      } catch {}
    };

    try {
      const result = await handler(candidate.id, candidate.tenantId, candidate.payload as any, updateProgress);

      await prisma.durableJob.update({
        where: { id: candidate.id },
        data: {
          status: 'COMPLETED',
          progress: 100,
          result: result as any,
          completedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
        },
      });

      try {
        const io = getIO();
        io.to(`tenant:${candidate.tenantId}`).emit('queue:job_completed', {
          jobId: candidate.id,
          jobType: candidate.jobType,
          result,
        });
      } catch {}
    } catch (err: any) {
      const currentAttempts = candidate.attempts + 1;
      const errorMsg = err?.message || 'Unknown processing error';

      if (currentAttempts < candidate.maxAttempts) {
        // Exponential backoff with jitter
        const backoffMs = Math.pow(2, currentAttempts) * 2000 + Math.random() * 1000;
        const nextRun = new Date(Date.now() + backoffMs);

        await prisma.durableJob.update({
          where: { id: candidate.id },
          data: {
            status: 'QUEUED',
            runAt: nextRun,
            lockedAt: null,
            lockedBy: null,
            lastError: errorMsg,
          },
        });
      } else {
        // Exceeded max retries -> Move to Dead Letter Queue (DLQ)
        await prisma.durableJob.update({
          where: { id: candidate.id },
          data: {
            status: 'FAILED',
            lastError: `DLQ: Exceeded max attempts (${candidate.maxAttempts}). Last error: ${errorMsg}`,
            completedAt: new Date(),
            lockedAt: null,
            lockedBy: null,
          },
        });

        try {
          const io = getIO();
          io.to(`tenant:${candidate.tenantId}`).emit('queue:job_failed', {
            jobId: candidate.id,
            jobType: candidate.jobType,
            error: errorMsg,
            deadLettered: true,
          });
        } catch {}
      }
    }
  }

  /**
   * Get job status and diagnostics
   */
  static async getJob(tenantId: string, jobId: string) {
    return prisma.durableJob.findUnique({
      where: { id: jobId, tenantId },
    });
  }

  /**
   * List jobs with optional status filter
   */
  static async listJobs(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return prisma.durableJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
