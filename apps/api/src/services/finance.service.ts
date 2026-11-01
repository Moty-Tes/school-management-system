import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import * as auditService from './audit.service.js';

export async function createInvoice(tenantId: string, data: { studentId: string, title: string, amount: number, dueDate: string }) {
  return prisma.invoice.create({
    data: {
      tenantId,
      studentId: data.studentId,
      title: data.title,
      amount: data.amount,
      dueDate: new Date(data.dueDate),
    },
  });
}

export async function recordPayment(tenantId: string, invoiceId: string, data: { amount: number, method: string, reference?: string }) {
  // 1. Fetch the invoice and its existing payments
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    include: { payments: true },
  });

  if (!invoice) throw new AppError('Invoice not found', 404, 'NOT_FOUND');

  // 2. Calculate how much has been paid so far
  const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const newTotalPaid = totalPaid + data.amount;
  const invoiceAmount = Number(invoice.amount);

  // 3. Determine new status
  let newStatus = invoice.status;
  if (newTotalPaid >= invoiceAmount) {
    newStatus = 'PAID';
  } else if (newTotalPaid > 0) {
    newStatus = 'PARTIAL';
  }

  // 4. Transaction: Record payment and update invoice status
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        tenantId,
        invoiceId,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
      },
    });

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus },
    });

    return payment;
  });
}

export async function listInvoices(tenantId: string, studentId?: string) {
  return prisma.invoice.findMany({
    where: { 
      tenantId,
      // If a studentId is provided, only fetch invoices for that student
      ...(studentId ? { studentId } : {}) 
    },
    include: { student: true, payments: true },
    orderBy: { createdAt: 'desc' },
  });
}
export async function generateBulkInvoices(
  tenantId: string, 
  data: { classId: string, title: string, amount: number, dueDate: string }
) {
  // 1. Fetch all students in this class
  const students = await prisma.student.findMany({
    where: { tenantId, classId: data.classId, deletedAt: null },
    select: { id: true }
  });

  if (students.length === 0) {
    throw new AppError('No students found in this class', 400, 'NO_STUDENTS');
  }

  // 2. Prepare the invoice data for every student
  const invoiceData = students.map(student => ({
    tenantId,
    studentId: student.id,
    title: data.title,
    amount: data.amount,
    dueDate: new Date(data.dueDate),
  }));

  // 3. Create them all in one fast SQL query
  return prisma.invoice.createMany({
    data: invoiceData,
    skipDuplicates: true,
  });
}

export async function getFinanceSummary(tenantId: string) {
  const [invoices, payments, expenses] = await Promise.all([
    prisma.invoice.findMany({ where: { tenantId }, select: { amount: true, status: true } }),
    prisma.payment.findMany({ where: { tenantId }, select: { amount: true, createdAt: true } }),
    prisma.expense.findMany({ where: { tenantId }, select: { amount: true, date: true } }),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.amount), 0);
  const pendingAmount = invoices
    .filter((i) => i.status !== 'PAID')
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((i) => i.status === 'PAID').length;
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Group monthly for finance charts (last 6 months)
  const monthlyMap = new Map<string, { month: string; revenue: number; expenses: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthlyMap.set(key, { month: key, revenue: 0, expenses: 0 });
  }

  payments.forEach((p) => {
    const key = p.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
    const entry = monthlyMap.get(key);
    if (entry) entry.revenue += Number(p.amount);
  });

  expenses.forEach((e) => {
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

export async function listPayments(tenantId: string) {
  return prisma.payment.findMany({
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