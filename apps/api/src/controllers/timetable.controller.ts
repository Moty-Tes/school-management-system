import { Request, Response, NextFunction } from 'express';
import * as timetableService from '../services/timetable.service.js';
import { z } from 'zod';

const subjectSchema = z.object({ name: z.string().min(1), code: z.string().min(1) });
const timetableSchema = z.object({
  classId: z.string(),
  subjectId: z.string(),
  teacherId: z.string(),
  dayOfWeek: z.number().min(1).max(5),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

export async function createSubjectHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const input = subjectSchema.parse(req.body);
    const result = await timetableService.createSubject(req.auth.tenantId, input);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listSubjectsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await timetableService.listSubjects(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function createTimetableHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const input = timetableSchema.parse(req.body);
    const result = await timetableService.createTimetableEntry(req.auth.tenantId, input);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getTimetableHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const classId = req.query.classId as string;
    if (!classId) throw new Error("classId is required");
    const result = await timetableService.getTimetable(req.auth.tenantId, classId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}