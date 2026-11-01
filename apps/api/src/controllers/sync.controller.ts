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

const resolveConflictSchema = z.object({
  resolution: z.enum(['ACCEPT_CLIENT', 'KEEP_SERVER']),
  notes: z.string().min(3),
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

export async function listConflictsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("Authentication required");
    const result = await OfflineSyncService.listUnresolvedConflicts(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function resolveConflictHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) throw new Error("Authentication required");
    const { id } = req.params;
    const input = resolveConflictSchema.parse(req.body);

    const result = await OfflineSyncService.resolveConflict(
      req.auth.tenantId,
      id,
      req.auth.sub,
      input.resolution,
      input.notes
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}
