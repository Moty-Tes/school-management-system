import { Request, Response, NextFunction } from 'express';
import * as aiService from '../services/ai.service.js';
import { PredictiveRiskEngine } from '../services/predictive-risk.service.js';

export async function getRiskScoreHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await aiService.calculateRiskScore(req.auth.tenantId, req.params.studentId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getPredictiveRiskAnalysisHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await PredictiveRiskEngine.evaluateStudentRisk(req.auth.tenantId, req.params.studentId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getCohortRiskHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const classId = req.query.classId as string | undefined;
    const result = await PredictiveRiskEngine.evaluateCohort(req.auth.tenantId, classId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function generateCommentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await aiService.generateReportComment(req.auth.tenantId, req.params.studentId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}
