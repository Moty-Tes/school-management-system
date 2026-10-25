import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service.js';

export async function getNotificationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await notificationService.getMyNotifications(req.auth.tenantId, req.auth.sub);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function markReadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    await notificationService.markAsRead(req.auth.tenantId, req.params.id, req.auth.sub);
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
}

export async function markAllReadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    await notificationService.markAllAsRead(req.auth.tenantId, req.auth.sub);
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
}