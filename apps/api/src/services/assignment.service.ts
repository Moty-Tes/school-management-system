import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createAssignment(tenantId: string, teacherUserId: string, data: any) {
  // Verify that the user has an active teacher profile
  const teacher = await prisma.teacherProfile.findFirst({
    where: { tenantId, userId: teacherUserId },
  });

  if (!teacher) {
    throw new AppError(
      'Only authorized teachers with an active faculty profile may create classroom assignments.',
      403,
      'FORBIDDEN'
    );
  }

  return prisma.assignment.create({
    data: {
      tenantId,
      classId: data.classId,
      teacherId: teacher.id,
      title: data.title,
      description: data.description,
      dueDate: new Date(data.dueDate),
      attachmentUrl: data.attachmentUrl,
    },
  });
}

export async function listAssignments(tenantId: string, classId?: string) {
  return prisma.assignment.findMany({
    where: { tenantId, ...(classId ? { classId } : {}) },
    include: {
      class: true,
      teacher: { include: { user: { include: { profile: true } } } },
      _count: { select: { submissions: true } }
    },
    orderBy: { dueDate: 'asc' },
  });
}

export async function submitAssignment(tenantId: string, studentUserId: string, assignmentId: string, data: { content?: string, fileUrl?: string }) {
  // Find the student profile using the logged-in User ID
  const user = await prisma.user.findUnique({ where: { id: studentUserId }, include: { profile: true } });
  const student = await prisma.student.findFirst({
    where: { tenantId, firstName: user?.profile?.firstName || '', lastName: user?.profile?.lastName || '', deletedAt: null }
  });
  if (!student) throw new AppError('Student profile not found for this account', 404, 'NOT_FOUND');

  // Upsert: Update if resubmitting, create if new
  return prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
    update: { content: data.content, fileUrl: data.fileUrl, submittedAt: new Date() },
    create: { tenantId, assignmentId, studentId: student.id, content: data.content, fileUrl: data.fileUrl },
  });
}

export async function getSubmissions(tenantId: string, assignmentId: string) {
  return prisma.submission.findMany({
    where: { tenantId, assignmentId },
    include: { student: true },
    orderBy: { submittedAt: 'desc' }
  });
}

export async function gradeSubmission(tenantId: string, submissionId: string, data: { grade: number, feedback?: string }) {
  return prisma.submission.update({
    where: { id: submissionId },
    data: { grade: data.grade, feedback: data.feedback },
  });
}
