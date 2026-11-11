import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { createLog } from './audit.service.js';

export type AuditLogFn = (
  tenantId: string,
  userId: string,
  action: string,
  entity: string,
  details: string
) => Promise<void>;

export async function createInvoice(
  tenantId: string,
  data: { studentId: string; title: string; amount: number; dueDate: string },
  db: any = prisma
) {
  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    throw new AppError('Invoice amount must be greater than zero', 400, 'INVALID_INVOICE_AMOUNT');
  }

  const dueDate = new Date(data.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    throw new AppError('Invalid dueDate', 400, 'INVALID_DUE_DATE');
  }

  const student = await db.student.findFirst({
    where: { id: data.studentId, tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!student) {
    throw new AppError('Student not found in this tenant', 404, 'STUDENT_NOT_FOUND');
  }

  return db.invoice.create({
    data: {
      tenantId,
      studentId: data.studentId,
      title: data.title,
      amount: data.amount,
      dueDate,
    },
  });
}

/**
 * Records an invoice payment inside a PostgreSQL row-locked transaction (SELECT ... FOR UPDATE)
 * to prevent concurrent double-spend/overpayment races and maintain exact ETB ledger consistency.
 */
export async function recordPayment(
  tenantId: string,
  invoiceId: string,
  data: { amount: number; method: string; reference?: string },
  actorUserId?: string,
  db: any = prisma,
  logAudit: AuditLogFn = createLog
) {
  if (!invoiceId || !invoiceId.trim()) {
    throw new AppError('Invoice ID is required', 400, 'INVALID_INVOICE_ID');
  }

  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    throw new AppError('Payment amount must be greater than zero', 400, 'INVALID_PAYMENT_AMOUNT');
  }

  const trimmedRef = data.reference?.trim() || undefined;

  const { payment, newStatus } = await db.$transaction(async (tx: any) => {
    // Acquire row-level write lock on the invoice so concurrent payments serialize safely
    if (typeof tx.$queryRaw === 'function') {
      await tx.$queryRaw`SELECT "id" FROM "invoices" WHERE "id" = ${invoiceId} AND "tenantId" = ${tenantId} FOR UPDATE`;
    }

    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { payments: true },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'NOT_FOUND');
    }

    if (trimmedRef) {
      const existingWithRef = await tx.payment.findFirst({
        where: { tenantId, reference: trimmedRef },
        select: { id: true },
      });
      if (existingWithRef) {
        throw new AppError(
          'A payment with this reference has already been recorded',
          409,
          'DUPLICATE_PAYMENT_REFERENCE'
        );
      }
    }

    if (invoice.status === 'PAID') {
      throw new AppError('Invoice has already been fully paid', 400, 'INVOICE_ALREADY_PAID');
    }

    const invoiceAmount = Number(invoice.amount || 0);
    const existingPaid = (invoice.payments || []).reduce(
      (sum: number, p: { amount: unknown }) => sum + Number(p.amount),
      0
    );
    const remainingBalance = Math.max(0, invoiceAmount - existingPaid);

    // Enforce overpayment protection consistent with PaymentGatewayService
    if (data.amount > remainingBalance + 0.01) {
      throw new AppError(
        `Payment amount exceeds remaining invoice balance (${remainingBalance.toFixed(2)})`,
        400,
        'AMOUNT_EXCEEDS_BALANCE'
      );
    }

    const newTotalPaid = existingPaid + data.amount;
    let computedStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = 'UNPAID';
    if (newTotalPaid >= invoiceAmount - 0.01) {
      computedStatus = 'PAID';
    } else if (newTotalPaid > 0) {
      computedStatus = 'PARTIAL';
    }

    const createdPayment = await tx.payment.create({
      data: {
        tenantId,
        invoiceId,
        amount: data.amount,
        method: data.method,
        reference: trimmedRef,
      },
    });

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: computedStatus },
    });

    return { payment: createdPayment, newStatus: computedStatus };
  });

  if (actorUserId) {
    await logAudit(
      tenantId,
      actorUserId,
      'PAYMENT_RECORDED',
      `Invoice:${invoiceId}`,
      `Payment recorded via ${data.method}; status=${newStatus}`
    );
  }

  return payment;
}

export async function listInvoices(tenantId: string, studentId?: string, db: any = prisma) {
  return db.invoice.findMany({
    where: {
      tenantId,
      ...(studentId ? { studentId } : {}),
    },
    include: { student: true, payments: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function generateBulkInvoices(
  tenantId: string,
  data: { classId: string; title: string; amount: number; dueDate: string },
  db: any = prisma
) {
  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    throw new AppError('Invoice amount must be greater than zero', 400, 'INVALID_INVOICE_AMOUNT');
  }

  const dueDate = new Date(data.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    throw new AppError('Invalid dueDate', 400, 'INVALID_DUE_DATE');
  }

  const students = await db.student.findMany({
    where: { tenantId, classId: data.classId, deletedAt: null },
    select: { id: true },
  });

  if (students.length === 0) {
    throw new AppError('No students found in this class', 400, 'NO_STUDENTS');
  }

  const invoiceData = students.map((student: { id: string }) => ({
    tenantId,
    studentId: student.id,
    title: data.title,
    amount: data.amount,
    dueDate,
  }));

  return db.invoice.createMany({
    data: invoiceData,
    skipDuplicates: true,
  });
}

export async function getFinanceSummary(tenantId: string, db: any = prisma) {
  const [invoices, payments, expenses] = await Promise.all([
    db.invoice.findMany({
      where: { tenantId },
      select: {
        amount: true,
        status: true,
        payments: { select: { amount: true } },
      },
    }),
    db.payment.findMany({ where: { tenantId }, select: { amount: true, createdAt: true } }),
    db.expense.findMany({ where: { tenantId }, select: { amount: true, date: true } }),
  ]);

  const totalRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const totalInvoiced = invoices.reduce((sum: number, i: any) => sum + Number(i.amount), 0);

  // Reconcile pending amount by deducting partial payments already applied to unpaid invoices
  const pendingAmount = invoices.reduce((sum: number, inv: any) => {
    if (inv.status === 'PAID') return sum;
    const paidOnInvoice = (inv.payments || []).reduce(
      (pSum: number, p: any) => pSum + Number(p.amount),
      0
    );
    return sum + Math.max(0, Number(inv.amount) - paidOnInvoice);
  }, 0);

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((i: any) => i.status === 'PAID').length;
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

  // Group monthly for finance charts (last 6 months)
  const monthlyMap = new Map<string, { month: string; revenue: number; expenses: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthlyMap.set(key, { month: key, revenue: 0, expenses: 0 });
  }

  payments.forEach((p: any) => {
    const key = p.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
    const entry = monthlyMap.get(key);
    if (entry) entry.revenue += Number(p.amount);
  });

  expenses.forEach((e: any) => {
    const key = e.date.toLocaleString('default', { month: 'short', year: '2-digit' });
    const entry = monthlyMap.get(key);
    if (entry) entry.expenses += Number(e.amount);
  });

  return {
    totalRevenue,
    pendingAmount,
    totalInvoices,
    paidInvoices,
    totalInvoiced,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    collectionRate: totalInvoiced > 0 ? Math.round((totalRevenue / totalInvoiced) * 100) : 0,
    monthlyTrend: Array.from(monthlyMap.values()),
  };
}

export async function listPayments(tenantId: string, db: any = prisma) {
  return db.payment.findMany({
    where: { tenantId },
    include: {
      invoice: {
        include: {
          student: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}
