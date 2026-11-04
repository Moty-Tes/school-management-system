import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createAssessment(
  tenantId: string,
  data: { classId: string; title: string; maxScore: number; date: string }
) {
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

export async function saveGrades(
  tenantId: string,
  assessmentId: string,
  records: { studentId: string; score: number }[],
  teacherUserId?: string,
  roles: string[] = []
) {
  // Verify assessment belongs to this tenant
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, tenantId },
  });
  if (!assessment) throw new AppError('Assessment not found', 404, 'NOT_FOUND');

  // Verify teacher authorization for this assessment's class
  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  const isAdmin = roles.includes('TENANT_ADMIN') || roles.includes('ADMIN');

  if (!isSuperAdmin && !isAdmin && roles.includes('TEACHER') && teacherUserId) {
    const teacher = await prisma.teacherProfile.findFirst({
      where: { tenantId, userId: teacherUserId },
    });

    if (!teacher) {
      throw new AppError('Faculty profile not found for this account', 403, 'FORBIDDEN');
    }

    const isAssigned = await prisma.timetable.findFirst({
      where: { tenantId, teacherId: teacher.id, classId: assessment.classId },
    });

    if (!isAssigned) {
      throw new AppError(
        'Forbidden: Teachers may only enter or edit grades for their assigned classes',
        403,
        'FORBIDDEN'
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    // Delete existing grades for this assessment
    await tx.grade.deleteMany({ where: { assessmentId } });

    // Insert new grades
    await tx.grade.createMany({
      data: records.map((r) => ({
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
