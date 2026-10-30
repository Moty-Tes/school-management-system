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