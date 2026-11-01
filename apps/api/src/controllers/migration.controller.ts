import { Request, Response, NextFunction } from 'express';
import { DataMigrationService } from '../services/data-migration.service.js';
import { z } from 'zod';

const dryRunSchema = z.object({
  fileName: z.string().min(1),
  rows: z.array(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
      gender: z.string(),
      dateOfBirth: z.string().optional(),
      guardianName: z.string(),
      guardianPhone: z.string(),
      className: z.string().optional(),
      admissionNumber: z.string().optional(),
    })
  ).min(1),
});

const commitSchema = z.object({
  batchId: z.string().min(1),
  rows: z.array(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
      gender: z.string(),
      dateOfBirth: z.string().optional(),
      guardianName: z.string(),
      guardianPhone: z.string(),
      className: z.string().optional(),
      admissionNumber: z.string().optional(),
    })
  ).min(1),
});

export async function validateAndDryRunHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId || !req.auth?.sub) throw new Error("Unauthorized");
    const input = dryRunSchema.parse(req.body);

    const report = await DataMigrationService.validateAndDryRunStudentImport(
      req.auth.tenantId,
      req.auth.sub,
      input.fileName,
      input.rows as any
    );

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

export async function commitImportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("Unauthorized");
    const input = commitSchema.parse(req.body);

    const result = await DataMigrationService.commitStudentImport(
      req.auth.tenantId,
      input.batchId,
      input.rows as any
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
