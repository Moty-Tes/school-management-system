import { Request, Response, NextFunction } from 'express';
import * as quizService from '../services/quiz.service.js';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await quizService.createQuiz(req.auth.tenantId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await quizService.listQuizzes(req.auth.tenantId, req.query.classId as string);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getForStudentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    // Find student ID based on user
    const user = await prisma.user.findUnique({ where: { id: req.auth.sub }, include: { profile: true } });
    const student = await prisma.student.findFirst({
      where: { tenantId: req.auth.tenantId, firstName: user?.profile?.firstName, lastName: user?.profile?.lastName }
    });
    if (!student) throw new Error("Student profile not found");

    const result = await quizService.getQuizForStudent(req.auth.tenantId, req.params.id, student.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function submitHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const user = await prisma.user.findUnique({ where: { id: req.auth.sub }, include: { profile: true } });
    const student = await prisma.student.findFirst({
      where: { tenantId: req.auth.tenantId, firstName: user?.profile?.firstName, lastName: user?.profile?.lastName }
    });
    if (!student) throw new Error("Student profile not found");

    const result = await quizService.submitQuiz(req.auth.tenantId, req.params.id, student.id, req.body.answers);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function attemptsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await quizService.getAttempts(req.auth.tenantId, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}