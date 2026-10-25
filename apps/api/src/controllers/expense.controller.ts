import { Request, Response, NextFunction } from 'express';
import * as expenseService from '../services/expense.service.js';

export async function createHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await expenseService.createExpense(req.auth.tenantId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await expenseService.listExpenses(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function summaryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await expenseService.getExpenseSummary(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}