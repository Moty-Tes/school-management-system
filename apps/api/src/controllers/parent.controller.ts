// parent.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as parentService from '../services/parent.service.js';

export async function getChildrenHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await parentService.getMyChildren(req.auth.tenantId, req.auth.sub);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}