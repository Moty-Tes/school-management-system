import { Request, Response, NextFunction } from 'express';
import * as exportService from '../services/export.service.js';
import { resolveAttendanceAccessScope } from './attendance.controller.js';
import { parseUtcDateOnly } from '../services/attendance.service.js';

export async function exportStudentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error('No tenant');
    const csv = await exportService.exportStudents(req.auth.tenantId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="students_export.csv"');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

export async function exportFinanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error('No tenant');
    const csv = await exportService.exportFinance(req.auth.tenantId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="finance_export.csv"');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

export async function exportAttendanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const rawDate =
      typeof req.query.date === 'string' && req.query.date.trim()
        ? req.query.date.trim()
        : new Date().toISOString().split('T')[0];

    const normalizedDate = parseUtcDateOnly(rawDate, 'date').toISOString().slice(0, 10);

    const resolved = await resolveAttendanceAccessScope(req.auth, {
      action: 'READ',
      dateString: normalizedDate,
    });

    const allowedClassIds =
      resolved.mode === 'CLASSES' ? resolved.classIds : undefined;

    const csv = await exportService.exportAttendance(
      req.auth!.tenantId,
      normalizedDate,
      allowedClassIds
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${normalizedDate}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}
