import { Request, Response, NextFunction } from 'express';
import * as classService from '../services/class.service.js';
import { z } from 'zod';

const createClassSchema = z.object({
  name: z.string().min(1),
  section: z.string().min(1),
  capacity: z.number().int().min(1).default(40),
});

export async function createClassHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const input = createClassSchema.parse(req.body);
    const newClass = await classService.createClass(req.auth.tenantId, input);
    res.status(201).json({ success: true, data: newClass });
  } catch (err) {
    next(err);
  }
}

export async function listClassesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const classes = await classService.listClasses(req.auth.tenantId);
    res.status(200).json({ success: true, data: classes });
  } catch (err) {
    next(err);
  }
}