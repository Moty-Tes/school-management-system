import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createAssignment(tenantId: string, teacherUserId: string, data: any) {
  // Find the teacher profile using the logged-in User ID
  const teacher = await prisma.teacherProfile.findFirst({
    where: { tenantId, userId: teacherUserId },
  });
  if (!teacher) throw new AppError('Only teachers can create assignments', 403, 'FORBIDDEN');

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
  // Note: We are assuming the student's UserProfile matches the Student record (as done in previous parts)
  const user = await prisma.user.findUnique({ where: { id: studentUserId }, include: { profile: true } });
  const student = await prisma.student.findFirst({
    where: { tenantId, firstName: user?.profile?.firstName, lastName: user?.profile?.lastName }
  });
  if (!student) throw new AppError('Student profile not found', 404, 'NOT_FOUND');

  // Upsert: Update if they are resubmitting, create if it's new
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