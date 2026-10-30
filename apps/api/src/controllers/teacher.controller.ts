import { Request, Response, NextFunction } from 'express';
import * as teacherService from '../services/teacher.service.js';
import { z } from 'zod';

const createTeacherSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  employeeId: z.string().min(1),
  specialization: z.string().optional(),
  qualification: z.string().optional(),
});

export async function createTeacherHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const input = createTeacherSchema.parse(req.body);
    const teacher = await teacherService.createTeacher(req.auth.tenantId, input as any);
    res.status(201).json({ success: true, data: teacher });
  } catch (err) {
    next(err);
  }
}

export async function listTeachersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const teachers = await teacherService.listTeachers(req.auth.tenantId);
    res.status(200).json({ success: true, data: teachers });
  } catch (err) {
    next(err);
  }
}