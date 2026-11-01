import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export interface RawCsvStudentRow {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth?: string;
  guardianName: string;
  guardianPhone: string;
  className?: string;
  admissionNumber?: string;
}

export interface ValidationErrorItem {
  rowNumber: number;
  field: string;
  providedValue: string;
  error: string;
}

/**
 * World-Class Data Migration, Quality & Reversible Onboarding Engine
 */
export class DataMigrationService {
  /**
   * Stage and validate student CSV records (Dry Run)
   */
  static async validateAndDryRunStudentImport(
    tenantId: string,
    userId: string,
    fileName: string,
    rows: RawCsvStudentRow[]
  ) {
    if (!rows || rows.length === 0) {
      throw new AppError('Import file contains no student data rows', 400, 'EMPTY_FILE');
    }

    const errors: ValidationErrorItem[] = [];
    const validRows: RawCsvStudentRow[] = [];
    let duplicateCount = 0;

    // Pre-fetch existing students to detect duplicates
    const existingStudents = await prisma.student.findMany({
      where: { tenantId, deletedAt: null },
      select: { admissionNumber: true, firstName: true, lastName: true, guardianPhone: true },
    });

    const existingAdmissionSet = new Set(existingStudents.map(s => s.admissionNumber.toLowerCase()));
    const existingFullNamePhoneSet = new Set(
      existingStudents.map(s => `${s.firstName.toLowerCase()}_${s.lastName.toLowerCase()}_${s.guardianPhone}`)
    );

    // Pre-fetch classes for mapping
    const existingClasses = await prisma.class.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const classMap = new Map(existingClasses.map(c => [c.name.toLowerCase().trim(), c.id]));

    rows.forEach((row, index) => {
      const rowNum = index + 2; // Accounting for 1-based index + header row

      if (!row.firstName || row.firstName.trim().length < 2) {
        errors.push({ rowNumber: rowNum, field: 'firstName', providedValue: row.firstName || '', error: 'First name must be at least 2 characters' });
      }

      if (!row.lastName || row.lastName.trim().length < 2) {
        errors.push({ rowNumber: rowNum, field: 'lastName', providedValue: row.lastName || '', error: 'Last name must be at least 2 characters' });
      }

      const genderUpper = (row.gender || '').toUpperCase();
      if (!['MALE', 'FEMALE', 'OTHER'].includes(genderUpper)) {
        errors.push({ rowNumber: rowNum, field: 'gender', providedValue: row.gender || '', error: 'Gender must be MALE, FEMALE, or OTHER' });
      }

      if (!row.guardianName || row.guardianName.trim().length < 2) {
        errors.push({ rowNumber: rowNum, field: 'guardianName', providedValue: row.guardianName || '', error: 'Guardian name is required' });
      }

      if (!row.guardianPhone || row.guardianPhone.trim().length < 9) {
        errors.push({ rowNumber: rowNum, field: 'guardianPhone', providedValue: row.guardianPhone || '', error: 'Valid guardian phone number required' });
      }

      // Duplicate Check
      const comboKey = `${(row.firstName || '').toLowerCase()}_${(row.lastName || '').toLowerCase()}_${row.guardianPhone}`;
      if (existingFullNamePhoneSet.has(comboKey)) {
        duplicateCount++;
        errors.push({ rowNumber: rowNum, field: 'duplicate', providedValue: comboKey, error: 'Student with identical name and guardian phone already exists in system' });
      }

      if (row.admissionNumber && existingAdmissionSet.has(row.admissionNumber.toLowerCase())) {
        duplicateCount++;
        errors.push({ rowNumber: rowNum, field: 'admissionNumber', providedValue: row.admissionNumber, error: 'Admission number already assigned' });
      }

      if (errors.filter(e => e.rowNumber === rowNum).length === 0) {
        validRows.push(row);
      }
    });

    // Save migration batch record in database
    const batch = await prisma.migrationBatch.create({
      data: {
        tenantId,
        entityType: 'STUDENTS',
        fileName,
        totalRows: rows.length,
        validRows: validRows.length,
        invalidRows: rows.length - validRows.length,
        status: errors.length === 0 ? 'DRY_RUN_PASSED' : 'VALIDATED',
        summary: {
          duplicateCount,
          readyToCommit: validRows.length,
        },
        errorReport: errors as any,
        createdById: userId,
      },
    });

    return {
      batchId: batch.id,
      totalRows: rows.length,
      validRowsCount: validRows.length,
      invalidRowsCount: errors.length,
      duplicateCount,
      passedDryRun: errors.length === 0,
      errors: errors.slice(0, 50), // Preview top 50
    };
  }

  /**
   * Commit a validated batch into the database
   */
  static async commitStudentImport(tenantId: string, batchId: string, rows: RawCsvStudentRow[]) {
    const batch = await prisma.migrationBatch.findUnique({
      where: { id: batchId, tenantId },
    });

    if (!batch) throw new AppError('Migration batch not found', 404, 'NOT_FOUND');
    if (batch.status === 'COMMITTED') throw new AppError('Batch has already been committed', 400, 'ALREADY_COMMITTED');

    const existingClasses = await prisma.class.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const classMap = new Map(existingClasses.map(c => [c.name.toLowerCase().trim(), c.id]));

    return prisma.$transaction(async (tx) => {
      let createdCount = 0;

      for (const row of rows) {
        const admissionNumber = row.admissionNumber || `ADM-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        const classId = row.className ? classMap.get(row.className.toLowerCase().trim()) || null : null;

        await tx.student.create({
          data: {
            tenantId,
            admissionNumber,
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            gender: row.gender.toUpperCase() as any,
            dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
            guardianName: row.guardianName.trim(),
            guardianPhone: row.guardianPhone.trim(),
            classId,
            status: 'ACTIVE',
          },
        });
        createdCount++;
      }

      await tx.migrationBatch.update({
        where: { id: batchId },
        data: {
          status: 'COMMITTED',
          committedAt: new Date(),
        },
      });

      return {
        batchId,
        studentsImported: createdCount,
        committedAt: new Date().toISOString(),
      };
    });
  }
}
