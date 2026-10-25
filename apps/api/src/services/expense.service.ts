import { prisma } from '../lib/prisma.js';

export async function createExpense(tenantId: string, data: any) {
  return prisma.expense.create({
    data: {
      tenantId,
      title: data.title,
      category: data.category,
      amount: data.amount,
      vendorName: data.vendorName,
      date: data.date ? new Date(data.date) : new Date(),
      notes: data.notes,
    },
  });
}

export async function listExpenses(tenantId: string) {
  return prisma.expense.findMany({
    where: { tenantId },
    orderBy: { date: 'desc' },
  });
}

export async function getExpenseSummary(tenantId: string) {
  // Aggregate expenses by category
  const grouped = await prisma.expense.groupBy({
    by: ['category'],
    where: { tenantId },
    _sum: { amount: true },
  });

  const total = grouped.reduce((acc, curr) => acc + Number(curr._sum.amount || 0), 0);

  return {
    total,
    byCategory: grouped.map(g => ({
      category: g.category,
      total: Number(g._sum.amount || 0),
    })),
  };
}