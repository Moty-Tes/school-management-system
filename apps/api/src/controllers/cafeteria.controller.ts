import { Request, Response, NextFunction } from 'express';
import * as cafeteriaService from '../services/cafeteria.service.js';

export async function createMenuHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await cafeteriaService.createMenuItem(req.auth.tenantId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listMenuHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await cafeteriaService.listMenu(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getWalletHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await cafeteriaService.getWallet(req.auth.tenantId, req.params.studentId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function topUpHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await cafeteriaService.topUpWallet(req.auth.tenantId, req.body.studentId, req.body.amount);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function purchaseHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await cafeteriaService.purchaseMeal(req.auth.tenantId, req.body.admissionNumber, req.body.menuItemId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}