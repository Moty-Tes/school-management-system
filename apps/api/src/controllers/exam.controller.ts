import { Request, Response, NextFunction } from 'express';
import * as examService from '../services/exam.service.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createRoomHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new AppError('Tenant context required', 400, 'BAD_REQUEST');
    const result = await examService.createRoom(req.auth.tenantId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listRoomsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new AppError('Tenant context required', 400, 'BAD_REQUEST');
    const result = await examService.listRooms(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function createScheduleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new AppError('Tenant context required', 400, 'BAD_REQUEST');
    const result = await examService.createExamSchedule(req.auth.tenantId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listSchedulesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new AppError('Tenant context required', 400, 'BAD_REQUEST');
    const result = await examService.listExamSchedules(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function generateSeatingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new AppError('Tenant context required', 400, 'BAD_REQUEST');
    const result = await examService.generateSeatingPlan(req.auth.tenantId, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getSeatingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new AppError('Tenant context required', 400, 'BAD_REQUEST');
    const result = await examService.getSeatingPlan(req.auth.tenantId, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getMySeatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) {
      throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
    }
    const result = await examService.getMyExamSeats(
      req.auth.tenantId,
      req.auth.sub,
      req.auth.roles || []
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}
