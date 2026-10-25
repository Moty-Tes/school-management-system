// announcement.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as announcementService from '../services/announcement.service.js';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  classId: z.string().optional().nullable(),
});

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const input = createSchema.parse(req.body);
    const result = await announcementService.createAnnouncement(req.auth.tenantId, input);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const classId = req.query.classId as string | undefined;
    const result = await announcementService.listAnnouncements(req.auth.tenantId, classId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}