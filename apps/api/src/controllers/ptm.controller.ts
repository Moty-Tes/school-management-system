import { Request, Response, NextFunction } from 'express';
import * as ptmService from '../services/ptm.service.js';

export async function createEventHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await ptmService.createEvent(req.auth.tenantId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listEventsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await ptmService.listEvents(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function createSlotsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await ptmService.createSlots(req.auth.tenantId, req.auth.sub, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function teacherSlotsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await ptmService.getTeacherSlots(req.auth.tenantId, req.auth.sub);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function availableSlotsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await ptmService.getAvailableSlots(req.auth.tenantId, req.query.eventId as string);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function bookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await ptmService.bookSlot(req.auth.tenantId, req.body.studentId, req.body.slotId, req.body.notes);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}