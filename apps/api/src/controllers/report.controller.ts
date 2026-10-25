import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service.ts';
import { z } from 'zod';

export async function downloadReportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const { studentId } = req.params;

    const report = await reportService.generateStudentReportCard(
      req.auth.tenantId,
      studentId
    );

    // Set headers for PDF download
    res.setHeader(
      'Content-Type',
      'application/pdf'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report-card-${studentId}.pdf`
    );

    // Send the PDF data
    res.send(report);
  } catch (err) {
    next(err);
  }
}
export async function downloadIdCardHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const { id } = req.params;

    const pdfBuffer = await reportService.generateIdCard(req.auth.tenantId, id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=id-card-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}
export async function downloadTranscriptHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const { id } = req.params;

    const pdfBuffer = await reportService.generateTranscript(req.auth.tenantId, id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=transcript-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}
export async function downloadCertificateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant context");
    const { id } = req.params; // student ID
    const { title, description } = req.query;

    // Fetch student and tenant details for the certificate
    const student = await prisma.student.findUnique({ where: { id }, include: { tenant: true } });
    if (!student) throw new Error("Student not found");

    const pdfBuffer = await reportService.generateCertificatePDF(
      req.auth.tenantId,
      {
        studentName: `${student.firstName} ${student.lastName}`,
        title: title as string || 'Certificate of Achievement',
        description: description as string || 'For outstanding dedication and hard work.',
        date: new Date().toISOString(),
        schoolName: student.tenant.name,
      }
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${student.firstName}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}