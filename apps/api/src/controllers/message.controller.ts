import { Request, Response, NextFunction } from 'express';
import * as messageService from '../services/message.service.js';
import { z } from 'zod';

export async function getContactsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    // In a real app, you'd fetch the user's role from the DB. For simplicity, we assume req.auth has it, or we just pass a wildcard.
    // Let's fetch the user's role from the DB.
    const userRole = await prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId: req.auth.sub, tenantId: req.auth.tenantId } },
      include: { roles: { include: { role: true } } }
    });
    const roleSlug = userRole?.roles[0]?.role.slug || 'PARENT';

    const contacts = await messageService.getContacts(req.auth.tenantId, req.auth.sub, roleSlug);
    res.status(200).json({ success: true, data: contacts });
  } catch (err) { next(err); }
}

export async function getConversationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const { userId } = req.params;
    const messages = await messageService.getConversation(req.auth.tenantId, req.auth.sub, userId);
    res.status(200).json({ success: true, data: messages });
  } catch (err) { next(err); }
}

export async function sendMessageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const schema = z.object({ receiverId: z.string(), content: z.string().min(1) });
    const input = schema.parse(req.body);
    
    const message = await messageService.sendMessage(req.auth.tenantId, req.auth.sub, input.receiverId, input.content);
    res.status(201).json({ success: true, data: message });
  } catch (err) { next(err); }
}

export async function markReadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const { senderId } = req.params;
    await messageService.markConversationRead(req.auth.tenantId, req.auth.sub, senderId);
    res.status(200).json({ success: true });
  } catch (err) { next(err); }
}