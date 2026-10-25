import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export async function verifyStudentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        tenant: { select: { name: true, logoUrl: true } },
        class: { select: { name: true, section: true } },
      },
    });

    if (!student || student.deletedAt) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'This document is invalid or the student record no longer exists.' }
      });
      return;
    }

    // Return only safe, non-sensitive data
    res.status(200).json({
      success: true,
      data: {
        isValid: true,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        status: student.status,
        class: student.class ? `${student.class.name} - ${student.class.section}` : 'Alumni / Unassigned',
        schoolName: student.tenant.name,
        schoolLogo: student.tenant.logoUrl,
        verifiedAt: new Date().toISOString(),
      }
    });
  } catch (err) {
    next(err);
  }
}