import { Request, Response, NextFunction } from 'express';
import * as financeService from '../services/finance.service.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
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
    if (!req.auth?.tenantId || !req.auth?.sub) {
      throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
    }

    const tenantId = req.auth.tenantId;
    const userId = req.auth.sub;
    const roles = (req.auth.roles || []).map((r) => r.toUpperCase());
    const isStaff = roles.some((r) => ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'ACCOUNTANT'].includes(r));
    const isStudent = roles.includes('STUDENT');
    const isParent = roles.includes('PARENT');

    const requestedStudentId = req.query.studentId as string | undefined;

    // 1. Staff can view all invoices or filter by studentId
    if (isStaff) {
      const result = await financeService.listInvoices(tenantId, requestedStudentId);
      return res.status(200).json({ success: true, data: result });
    }

    // 2. Student can ONLY view their own invoices
    if (isStudent) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      const student = await prisma.student.findFirst({
        where: {
          tenantId,
          firstName: user?.profile?.firstName || '',
          lastName: user?.profile?.lastName || '',
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!student) {
        return res.status(200).json({ success: true, data: [] });
      }

      if (requestedStudentId && requestedStudentId !== student.id) {
        throw new AppError('Unauthorized access to external student invoice records', 403, 'FORBIDDEN');
      }

      const result = await financeService.listInvoices(tenantId, student.id);
      return res.status(200).json({ success: true, data: result });
    }

    // 3. Parent can ONLY view invoices for their linked children
    if (isParent) {
      const parentProfile = await prisma.parentProfile.findFirst({
        where: { tenantId, userId },
        include: { students: { select: { studentId: true } } },
      });

      const allowedStudentIds = parentProfile?.students.map((s) => s.studentId) || [];

      if (allowedStudentIds.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }

      if (requestedStudentId) {
        if (!allowedStudentIds.includes(requestedStudentId)) {
          throw new AppError('Unauthorized access: requested student is not registered under your parent account', 403, 'FORBIDDEN');
        }
        const result = await financeService.listInvoices(tenantId, requestedStudentId);
        return res.status(200).json({ success: true, data: result });
      }

      const result = await prisma.invoice.findMany({
        where: { tenantId, studentId: { in: allowedStudentIds } },
        include: { student: true, payments: true },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json({ success: true, data: result });
    }

    throw new AppError('Access denied', 403, 'FORBIDDEN');
  } catch (err) {
    next(err);
  }
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