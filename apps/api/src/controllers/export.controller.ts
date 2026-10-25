import { Request, Response, NextFunction } from 'express';
import * as exportService from '../services/export.service.js';

export async function exportStudentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const csv = await exportService.exportStudents(req.auth.tenantId);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students_export.csv"');
    res.status(200).send(csv);
  } catch (err) { next(err); }
}

export async function exportFinanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const csv = await exportService.exportFinance(req.auth.tenantId);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="finance_export.csv"');
    res.status(200).send(csv);
  } catch (err) { next(err); }
}

export async function exportAttendanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
    const csv = await exportService.exportAttendance(req.auth.tenantId, dateStr);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${dateStr}.csv"`);
    res.status(200).send(csv);
  } catch (err) { next(err); }
}