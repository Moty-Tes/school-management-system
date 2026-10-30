import { Request, Response, NextFunction } from 'express';
import * as broadcastService from '../services/broadcast.service.js';
import { z } from 'zod';

const broadcastSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  targetGroup: z.string(),
  channel: z.enum(['SMS', 'EMAIL']),
});

export async function sendHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const input = broadcastSchema.parse(req.body);
    const result = await broadcastService.sendBroadcast(req.auth.tenantId, input as any);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await broadcastService.listBroadcasts(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}