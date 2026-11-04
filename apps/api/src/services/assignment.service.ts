import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createAssignment(
  tenantId: string,
  teacherUserId: string,
  data: any,
  roles: string[] = ['TEACHER']
) {
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

  // Verify that this teacher is assigned to this class in the timetable (unless Super Admin)
  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  if (!isSuperAdmin) {
    const isAssigned = await prisma.timetable.findFirst({
      where: { tenantId, teacherId: teacher.id, classId: data.classId },
    });

    if (!isAssigned) {
      throw new AppError(
        'Forbidden: Teachers may only create assignments for their assigned classes.',
        403,
        'FORBIDDEN'
      );
    }
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
      _count: { select: { submissions: true } },
    },
    orderBy: { dueDate: 'asc' },
  });
}

export async function submitAssignment(
  tenantId: string,
  studentUserId: string,
  assignmentId: string,
  data: { content?: string; fileUrl?: string }
) {
  // Find the student profile using the logged-in User ID
  const user = await prisma.user.findUnique({ where: { id: studentUserId }, include: { profile: true } });
  const student = await prisma.student.findFirst({
    where: {
      tenantId,
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      deletedAt: null,
    },
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
    orderBy: { submittedAt: 'desc' },
  });
}

export async function gradeSubmission(
  tenantId: string,
  submissionId: string,
  data: { grade: number; feedback?: string },
  teacherUserId?: string,
  roles: string[] = []
) {
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, tenantId },
    include: { assignment: true },
  });

  if (!submission) throw new AppError('Submission not found', 404, 'NOT_FOUND');

  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  const isAdmin = roles.includes('TENANT_ADMIN') || roles.includes('ADMIN');

  if (!isSuperAdmin && !isAdmin && teacherUserId) {
    const teacher = await prisma.teacherProfile.findFirst({
      where: { tenantId, userId: teacherUserId },
    });

    if (!teacher || teacher.id !== submission.assignment.teacherId) {
      throw new AppError(
        'Forbidden: Teachers may only grade submissions for their assigned assignments',
        403,
        'FORBIDDEN'
      );
    }
  }

  return prisma.submission.update({
    where: { id: submissionId },
    data: { grade: data.grade, feedback: data.feedback },
  });
}
