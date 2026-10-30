import { Request, Response, NextFunction } from 'express';
import * as studentService from '../services/student.service.js';
import { z } from 'zod';

const createStudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.enum(['MALE', 'FEMALE']),
  dateOfBirth: z.string().optional(),
  classId: z.string().min(1, 'Class is required'), // Changed from gradeLevel
  guardianName: z.string().min(1),
  guardianPhone: z.string().min(1),
});

export async function createStudentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const input = createStudentSchema.parse(req.body);
    const student = await studentService.createStudent(req.auth.tenantId, input as any);
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
}

export async function listStudentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const students = await studentService.listStudents(req.auth.tenantId);
    res.status(200).json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
}

export async function updateStudentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const { id } = req.params;
    const input = createStudentSchema.partial().parse(req.body); 
    const student = await studentService.updateStudent(req.auth.tenantId, id, input);
    res.status(200).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
}

export async function deleteStudentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const { id } = req.params;
    await studentService.deleteStudent(req.auth.tenantId, id);
    res.status(200).json({ success: true, data: { message: 'Student deleted' } });
  } catch (err) {
    next(err);
  }
}
const bulkStudentSchema = z.array(createStudentSchema);

export async function bulkCreateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    
    // Validate that the request body is an array of valid students
    const input = bulkStudentSchema.parse(req.body);
    
    const result = await studentService.bulkCreateStudents(req.auth.tenantId, input as any);
    
    res.status(201).json({ 
      success: true, 
      data: { count: result.count, message: `${result.count} students imported successfully.` } 
    });
  } catch (err) {
    next(err);
  }
}
export async function getProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const { id } = req.params;
    
    const profile = await studentService.getStudentProfile(req.auth.tenantId, id);
    
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}
const promoteSchema = z.object({
  sourceClassId: z.string(),
  targetClassId: z.string().nullable(),
  isGraduation: z.boolean(),
});

export async function promoteClassHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const input = promoteSchema.parse(req.body);
    const result = await studentService.promoteClass(
      req.auth.tenantId, 
      input.sourceClassId, 
      input.targetClassId, 
      input.isGraduation
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}