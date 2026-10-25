import { Request, Response, NextFunction } from 'express';
import * as financeService from '../services/finance.service.ts';
import { z } from 'zod';

const createInvoiceSchema = z.object({
  studentId: z.string().min(1),
  issueDate: z.string().optional(),
  dueDate: z.string(),
  amount: z.number().positive(),
  status: z.enum(['PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']).default('PENDING'),
});

const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentDate: z.string().optional(),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHECK', 'CREDIT_CARD']),
  reference: z.string().optional(),
});

export async function listInvoicesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    
    // Extract the studentId from the URL query parameters
    const studentId = req.query.studentId as string | undefined;
    
    const result = await financeService.listInvoices(req.auth.tenantId, studentId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function createInvoiceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const input = createInvoiceSchema.parse(req.body);

    const invoice = await financeService.createInvoice(
      req.auth.tenantId,
      {
        ...input,
        issueDate: input.issueDate ? new Date(input.issueDate) : undefined,
        dueDate: new Date(input.dueDate),
      }
    );

    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function recordPaymentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const { invoiceId } = req.params;
    const input = recordPaymentSchema.parse(req.body);

    await financeService.recordPayment(
      req.auth.tenantId,
      invoiceId,
      {
        ...input,
        paymentDate: input.paymentDate ? new Date(input.paymentDate) : undefined,
      }
    );

    res.status(200).json({ success: true, message: 'Payment recorded' });
  } catch (err) {
    next(err);
  }
}
const bulkInvoiceSchema = z.object({
  classId: z.string(),
  title: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.string(),
});

export async function bulkInvoiceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const input = bulkInvoiceSchema.parse(req.body);
    const result = await financeService.generateBulkInvoices(req.auth.tenantId, input);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}