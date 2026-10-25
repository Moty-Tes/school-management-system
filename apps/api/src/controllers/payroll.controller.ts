import { Request, Response, NextFunction } from 'express';
import * as payrollService from '../services/payroll.service.js';

export async function generateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const { month, year } = req.body;
    const result = await payrollService.generatePayroll(req.auth.tenantId, Number(month), Number(year));
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const { month, year } = req.query;
    const result = await payrollService.getPayrollList(req.auth.tenantId, Number(month), Number(year));
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function myPayslipsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await payrollService.getMyPayslips(req.auth.tenantId, req.auth.sub);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function payHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await payrollService.markAsPaid(req.auth.tenantId, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}