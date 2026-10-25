import { Request, Response, NextFunction } from 'express';
import * as cbtService from '../services/cbt.service.js';
import { prisma } from '../lib/prisma.js';

export async function createExamHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await cbtService.createExam(req.auth.tenantId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function startExamHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    
    // Find student profile
    const user = await prisma.user.findUnique({ where: { id: req.auth.sub }, include: { profile: true } });
    const student = await prisma.student.findFirst({
      where: { tenantId: req.auth.tenantId, firstName: user?.profile?.firstName, lastName: user?.profile?.lastName }
    });
    if (!student) throw new Error("Student profile not found");

    const result = await cbtService.startExam(req.auth.tenantId, student.id, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function logCheatHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    await cbtService.logTabSwitch(req.auth.tenantId, req.body.attemptId);
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
}

export async function submitExamHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await cbtService.submitExam(req.auth.tenantId, req.body.attemptId, req.body.answers);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getResultsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await cbtService.getExamResults(req.auth.tenantId, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}