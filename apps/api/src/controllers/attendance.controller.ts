import { Request, Response, NextFunction } from 'express';
import * as attendanceService from '../services/attendance.service.js';
import { z } from 'zod';

const saveAttendanceSchema = z.object({
  classId: z.string().min(1),
  date: z.string(), // YYYY-MM-DD
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
    })
  ),
});

export async function saveAttendanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const input = saveAttendanceSchema.parse(req.body);
    
    await attendanceService.saveAttendance(req.auth.tenantId, input.classId, input.date, input.records);
    
    res.status(200).json({ success: true, message: 'Attendance saved' });
  } catch (err) {
    next(err);
  }
}

export async function getAttendanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const { classId, date } = req.query;
    
    if (!classId || !date) throw new Error("Missing classId or date");
    
    const records = await attendanceService.getAttendanceForDate(
      req.auth.tenantId, 
      classId as string, 
      date as string
    );
    
    res.status(200).json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
}