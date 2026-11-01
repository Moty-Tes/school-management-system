import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { EthiopianPayrollEngine } from './payroll-engine.service.js';

export async function generatePayroll(tenantId: string, month: number, year: number) {
  const teachers = await prisma.teacherProfile.findMany({
    where: { tenantId },
  });

  if (teachers.length === 0) throw new AppError('No staff found', 404, 'NOT_FOUND');

  // Use a transaction to ensure we don't half-generate payroll
  return prisma.$transaction(async (tx) => {
    let generatedCount = 0;

    for (const teacher of teachers) {
      // Check if already generated for this month
      const existing = await tx.payslip.findUnique({
        where: { teacherId_month_year: { teacherId: teacher.id, month, year } },
      });

      if (existing) continue; // Skip if already generated

      // Real Ethiopian Proclamation 979/2016 statutory tax & pension calculation
      const baseSalary = teacher.baseSalary || 12000;
      const calc = EthiopianPayrollEngine.calculate({
        baseSalary,
        transportAllowance: 1500,
      });

      await tx.payslip.create({
        data: {
          tenantId,
          teacherId: teacher.id,
          month,
          year,
          baseSalary: calc.baseSalary,
          deductions: calc.deductions.totalEmployeeDeductions,
          netPay: calc.netPay,
        },
      });
      generatedCount++;
    }

    return { count: generatedCount };
  });
}

export async function getPayrollList(tenantId: string, month: number, year: number) {
  const slips = await prisma.payslip.findMany({
    where: { tenantId, month, year },
    include: { teacher: { include: { user: { include: { profile: true } } } } },
    orderBy: { netPay: 'desc' },
  });

  // Attach enriched statutory tax breakdown for frontend viewing
  return slips.map((slip) => {
    const calc = EthiopianPayrollEngine.calculate({
      baseSalary: slip.baseSalary,
      transportAllowance: 1500,
    });
    return {
      ...slip,
      statutoryDetails: calc,
    };
  });
}

export async function getMyPayslips(tenantId: string, userId: string) {
  const teacher = await prisma.teacherProfile.findFirst({
    where: { tenantId, userId },
  });
  if (!teacher) throw new AppError('Teacher profile not found', 404, 'NOT_FOUND');

  const slips = await prisma.payslip.findMany({
    where: { tenantId, teacherId: teacher.id },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });

  return slips.map((slip) => {
    const calc = EthiopianPayrollEngine.calculate({
      baseSalary: slip.baseSalary,
      transportAllowance: 1500,
    });
    return {
      ...slip,
      statutoryDetails: calc,
    };
  });
}

export async function markAsPaid(tenantId: string, payslipId: string) {
  return prisma.payslip.update({
    where: { id: payslipId, tenantId },
    data: { status: 'PAID', paidAt: new Date() },
  });
}

export async function calculateTaxPreview(baseSalary: number, transportAllowance = 0) {
  return EthiopianPayrollEngine.calculate({ baseSalary, transportAllowance });
}
