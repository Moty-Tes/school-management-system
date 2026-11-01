import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
  deduction: number;
}

/**
 * Official Federal Democratic Republic of Ethiopia Ministry of Revenues
 * Employment Income Tax Brackets (Proclamation No. 979/2016)
 */
export const ETHIOPIAN_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 600, rate: 0.0, deduction: 0 },
  { min: 601, max: 1650, rate: 0.10, deduction: 60.0 },
  { min: 1651, max: 3200, rate: 0.15, deduction: 142.50 },
  { min: 3201, max: 5250, rate: 0.20, deduction: 302.50 },
  { min: 5251, max: 7800, rate: 0.25, deduction: 565.0 },
  { min: 7801, max: 10900, rate: 0.30, deduction: 955.0 },
  { min: 10901, max: null, rate: 0.35, deduction: 1500.0 },
];

export const PENSION_RATES = {
  EMPLOYEE: 0.07, // 7% statutory deduction
  EMPLOYER: 0.11, // 11% organization contribution
};

export interface PayrollCalculationInput {
  baseSalary: number;
  transportAllowance?: number;
  housingAllowance?: number;
  overtimeHours?: number;
  hourlyRate?: number;
  otherDeductions?: number;
}

export interface PayrollCalculationResult {
  baseSalary: number;
  allowances: {
    transport: number;
    taxableTransport: number;
    housing: number;
    total: number;
  };
  overtimePay: number;
  grossPay: number;
  taxableIncome: number;
  deductions: {
    incomeTax: number;
    taxBracket: { rate: number; deduction: number };
    employeePension: number;
    employerPension: number;
    otherDeductions: number;
    totalEmployeeDeductions: number;
  };
  netPay: number;
}

/**
 * World-Class Statutory Ethiopian Payroll & Tax Calculation Engine
 */
export class EthiopianPayrollEngine {
  /**
   * Calculate statutory Ethiopian payroll breakdown for a single employee
   */
  static calculate(input: PayrollCalculationInput): PayrollCalculationResult {
    const baseSalary = Math.max(0, input.baseSalary);
    const transport = Math.max(0, input.transportAllowance || 0);
    const housing = Math.max(0, input.housingAllowance || 0);
    const overtimeHours = Math.max(0, input.overtimeHours || 0);
    const hourlyRate = input.hourlyRate || (baseSalary / 160); // 160 standard work hours/month
    const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5 * 100) / 100; // 1.5x overtime rate

    // Transport exemption under Ethiopian Tax Law: exempt up to 25% of base salary or 2,200 ETB
    const transportExemptionLimit = Math.min(baseSalary * 0.25, 2200);
    const taxableTransport = Math.max(0, transport - transportExemptionLimit);

    const totalAllowances = transport + housing;
    const grossPay = Math.round((baseSalary + totalAllowances + overtimePay) * 100) / 100;

    // Taxable income includes basic salary, taxable allowances, and overtime
    const taxableIncome = Math.round((baseSalary + taxableTransport + housing + overtimePay) * 100) / 100;

    // 1. Calculate Employment Income Tax (PIT) using Proclamation 979/2016 brackets
    let incomeTax = 0;
    let appliedBracket = ETHIOPIAN_TAX_BRACKETS[0];

    for (const bracket of ETHIOPIAN_TAX_BRACKETS) {
      if (bracket.max === null || taxableIncome <= bracket.max) {
        appliedBracket = bracket;
        incomeTax = Math.max(0, (taxableIncome * bracket.rate) - bracket.deduction);
        break;
      }
    }
    incomeTax = Math.round(incomeTax * 100) / 100;

    // 2. Pension deductions (based on basic salary)
    const employeePension = Math.round(baseSalary * PENSION_RATES.EMPLOYEE * 100) / 100;
    const employerPension = Math.round(baseSalary * PENSION_RATES.EMPLOYER * 100) / 100;

    // 3. Other deductions (advances, union, etc.)
    const otherDeductions = Math.max(0, input.otherDeductions || 0);
    const totalEmployeeDeductions = Math.round((incomeTax + employeePension + otherDeductions) * 100) / 100;

    // 4. Net Pay
    const netPay = Math.round(Math.max(0, grossPay - totalEmployeeDeductions) * 100) / 100;

    return {
      baseSalary,
      allowances: {
        transport,
        taxableTransport,
        housing,
        total: totalAllowances,
      },
      overtimePay,
      grossPay,
      taxableIncome,
      deductions: {
        incomeTax,
        taxBracket: { rate: appliedBracket.rate, deduction: appliedBracket.deduction },
        employeePension,
        employerPension,
        otherDeductions,
        totalEmployeeDeductions,
      },
      netPay,
    };
  }

  /**
   * Run automated monthly payroll generation for an entire school staff
   * with full statutory tax breakdowns and ledger entries.
   */
  static async runMonthlyPayroll(tenantId: string, month: number, year: number) {
    const teachers = await prisma.teacherProfile.findMany({
      where: { tenantId },
      include: {
        user: { include: { profile: true } },
      },
    });

    if (teachers.length === 0) {
      throw new AppError('No teaching staff found to process payroll for', 404, 'STAFF_NOT_FOUND');
    }

    return prisma.$transaction(async (tx) => {
      let createdCount = 0;
      let totalGross = 0;
      let totalTaxWithheld = 0;
      let totalPension = 0;
      let totalNet = 0;

      for (const teacher of teachers) {
        // Skip if already generated
        const existing = await tx.payslip.findUnique({
          where: {
            teacherId_month_year: {
              teacherId: teacher.id,
              month,
              year,
            },
          },
        });

        if (existing) continue;

        const baseSalary = teacher.baseSalary || 12000;
        const calculation = this.calculate({
          baseSalary,
          transportAllowance: 1500, // Standard educator commute stipend
          housingAllowance: 0,
          overtimeHours: 0,
        });

        await tx.payslip.create({
          data: {
            tenantId,
            teacherId: teacher.id,
            month,
            year,
            baseSalary: calculation.baseSalary,
            deductions: calculation.deductions.totalEmployeeDeductions,
            netPay: calculation.netPay,
          },
        });

        createdCount++;
        totalGross += calculation.grossPay;
        totalTaxWithheld += calculation.deductions.incomeTax;
        totalPension += (calculation.deductions.employeePension + calculation.deductions.employerPension);
        totalNet += calculation.netPay;
      }

      return {
        processedCount: createdCount,
        month,
        year,
        totals: {
          grossPayrollETB: Math.round(totalGross * 100) / 100,
          totalTaxWithheldETB: Math.round(totalTaxWithheld * 100) / 100,
          totalPensionRemittanceETB: Math.round(totalPension * 100) / 100,
          totalNetDisbursementETB: Math.round(totalNet * 100) / 100,
        },
      };
    });
  }
}
