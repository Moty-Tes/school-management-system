import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createAssessment(tenantId: string, data: { classId: string, title: string, maxScore: number, date: string }) {
  return prisma.assessment.create({
    data: {
      tenantId,
      classId: data.classId,
      title: data.title,
      maxScore: data.maxScore,
      date: new Date(data.date),
    },
  });
}

export async function listAssessments(tenantId: string, classId?: string) {
  return prisma.assessment.findMany({
    where: { tenantId, deletedAt: null, ...(classId ? { classId } : {}) },
    include: { class: true, _count: { select: { grades: true } } },
    orderBy: { date: 'desc' },
  });
}

export async function saveGrades(tenantId: string, assessmentId: string, records: { studentId: string, score: number }[]) {
  // Verify assessment belongs to this tenant
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, tenantId },
  });
  if (!assessment) throw new AppError('Assessment not found', 404, 'NOT_FOUND');    
  await auditService.createLog(
      tenantId,
      userId, // Again, update signature to accept userId
      'SAVE_GRADES',
      'Assessment',
      `Entered grades for assessment ID: ${assessmentId}`
    );
  

  return prisma.$transaction(async (tx) => {
    // Delete existing grades for this assessment
    await tx.grade.deleteMany({ where: { assessmentId } });

    // Insert new grades
    await tx.grade.createMany({
      data: records.map(r => ({
        tenantId,
        assessmentId,
        studentId: r.studentId,
        score: r.score,
      })),
    });
  });
}

export async function getGrades(tenantId: string, assessmentId: string) {
  return prisma.grade.findMany({
    where: { tenantId, assessmentId },
    select: { studentId: true, score: true },
  });
}