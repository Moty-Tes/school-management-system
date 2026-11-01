import { Request, Response, NextFunction } from 'express';
import * as financeService from '../services/finance.service.js';
import { z } from 'zod';

const createInvoiceSchema = z.object({
  studentId: z.string().min(1),
  title: z.string().optional().default('Invoice'),
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
        studentId: input.studentId,
        title: input.title,
        amount: input.amount,
        dueDate: input.dueDate,
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
        amount: input.amount,
        method: input.method,
        reference: input.reference,
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
    const result = await financeService.generateBulkInvoices(req.auth.tenantId, input as any);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getSummaryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const result = await financeService.getFinanceSummary(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listPaymentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const result = await financeService.listPayments(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

const initializeGatewaySchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  gateway: z.enum(['CHAPA', 'TELEBIRR', 'CBE_BIRR']),
  payerEmail: z.string().email().optional(),
  payerName: z.string().optional(),
  payerPhone: z.string().optional(),
  returnUrl: z.string().url().optional(),
});

export async function initializeGatewayPaymentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const input = initializeGatewaySchema.parse(req.body);

    const { PaymentGatewayService } = await import('../services/payment-gateway.service.js');
    const result = await PaymentGatewayService.initializePayment({
      tenantId: req.auth.tenantId,
      invoiceId: input.invoiceId,
      amount: input.amount,
      gateway: input.gateway,
      payerEmail: input.payerEmail,
      payerName: input.payerName,
      payerPhone: input.payerPhone,
      returnUrl: input.returnUrl,
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function chapaWebhookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['x-chapa-signature'] as string | undefined;
    const { PaymentGatewayService } = await import('../services/payment-gateway.service.js');

    // In production, verify signature
    const isValid = PaymentGatewayService.verifyChapaWebhookSignature(
      JSON.stringify(req.body),
      signature
    );

    const { tx_ref, status } = req.body;
    if (status === 'success' || !process.env.CHAPA_SECRET_KEY) {
      // tx_ref format: TXN-CHAPA-<invoiceSlice>-<timestamp>
      const invoiceId = req.body.meta?.invoiceId || req.body.invoiceId;
      const tenantId = req.body.meta?.tenantId || (req as any).tenantId;

      if (invoiceId && tenantId) {
        await PaymentGatewayService.settleInvoicePayment({
          tenantId,
          invoiceId,
          amount: Number(req.body.amount || 0),
          method: 'CHAPA',
          reference: tx_ref || `CHAPA-WH-${Date.now()}`,
          metadata: req.body,
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (err) { next(err); }
}

export async function telebirrWebhookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { outTradeNo, totalAmount, tradeStatus, invoiceId, tenantId } = req.body;
    const { PaymentGatewayService } = await import('../services/payment-gateway.service.js');

    if (tradeStatus === 'Completed' || tradeStatus === 'SUCCESS') {
      if (invoiceId && tenantId) {
        await PaymentGatewayService.settleInvoicePayment({
          tenantId,
          invoiceId,
          amount: Number(totalAmount || 0),
          method: 'TELEBIRR',
          reference: outTradeNo || `TELEBIRR-WH-${Date.now()}`,
          metadata: req.body,
        });
      }
    }

    res.status(200).json({ code: 0, message: 'success' });
  } catch (err) { next(err); }
}