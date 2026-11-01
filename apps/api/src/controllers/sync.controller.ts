import { Request, Response, NextFunction } from 'express';
import { OfflineSyncService, SyncBatchRequest } from '../services/offline-sync.service.js';
import { z } from 'zod';

const syncBatchSchema = z.object({
  deviceId: z.string().min(1),
  clientTime: z.string(),
  mutations: z.array(
    z.object({
      mutationId: z.string().min(1),
      entityType: z.enum(['ATTENDANCE', 'GRADE', 'DAILY_LOG']),
      action: z.enum(['UPSERT', 'DELETE']),
      clientTimestamp: z.number(),
      payload: z.record(z.any()),
    })
  ),
});

export async function processSyncBatchHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) {
      throw new Error("Authentication required for sync batch");
    }

    const input = syncBatchSchema.parse(req.body) as SyncBatchRequest;
    const result = await OfflineSyncService.processSyncBatch(
      req.auth.tenantId,
      req.auth.sub,
      input
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}
