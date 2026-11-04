import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth?: string;
  classId: string;
  guardianName: string;
  guardianPhone: string;
}

export async function createStudent(tenantId: string, input: CreateStudentInput) {
  const count = await prisma.student.count({ where: { tenantId } });
  const admissionNumber = `STU-${String(count + 1).padStart(4, '0')}`;

  const student = await prisma.student.create({
    data: {
      tenantId,
      admissionNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      gender: input.gender,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      classId: input.classId,
      guardianName: input.guardianName,
      guardianPhone: input.guardianPhone,
    },
    include: { class: true },
  });

  return student;
}

export async function listStudents(tenantId: string) {
  return prisma.student.findMany({
    where: { tenantId, deletedAt: null },
    include: { class: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateStudent(tenantId: string, id: string, data: Partial<CreateStudentInput>) {
  const existing = await prisma.student.findFirst({
    where: { id, tenantId, deletedAt: null },
  });
  if (!existing) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');

  return prisma.student.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      classId: data.classId,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
    },
    include: { class: true },
  });
}

export async function deleteStudent(tenantId: string, id: string) {
  const existing = await prisma.student.findFirst({
    where: { id, tenantId, deletedAt: null },
  });
  if (!existing) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND');

  return prisma.student.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function bulkCreateStudents(tenantId: string, students: CreateStudentInput[]) {
  const currentCount = await prisma.student.count({ where: { tenantId } });

  const dataToInsert = students.map((student, index) => ({
    tenantId,
    admissionNumber: `STU-${String(currentCount + index + 1).padStart(4, '0')}`,
    firstName: student.firstName,
    lastName: student.lastName,
    gender: student.gender,
    classId: student.classId,
    guardianName: student.guardianName,
    guardianPhone: student.guardianPhone,
    status: 'ACTIVE' as const,
  }));

  return prisma.student.createMany({
    data: dataToInsert,
    skipDuplicates: true,
  });
}

export async function getStudentProfile(
  tenantId: string,
  studentId: string,
  userId?: string,
  roles?: string[]
) {
  // Authorization boundary: if requester is PARENT or STUDENT, verify ownership
  if (roles && roles.length > 0) {
    const isStaff = roles.some((r) =>
      ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'TEACHER', 'REGISTRAR', 'ACCOUNTANT', 'SAFEGUARDING_LEAD'].includes(r)
    );

    if (!isStaff) {
      if (roles.includes('PARENT')) {
        const parentProfile = await prisma.parentProfile.findFirst({
          where: { tenantId, userId },
          include: { students: { select: { studentId: true } } },
        });
        const isLinkedChild = parentProfile?.students.some((s) => s.studentId === studentId);
        if (!isLinkedChild) {
          throw new AppError('Forbidden: Parents may only view records for their registered children', 403, 'FORBIDDEN');
        }
      } else if (roles.includes('STUDENT')) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true },
        });
        const selfStudent = await prisma.student.findFirst({
          where: {
            id: studentId,
            tenantId,
            firstName: user?.profile?.firstName || '',
            lastName: user?.profile?.lastName || '',
            deletedAt: null,
          },
        });
        if (!selfStudent) {
          throw new AppError('Forbidden: Students may only inspect their own profile', 403, 'FORBIDDEN');
        }
      }
    }
  }

  // 1. Fetch the basic student info, class, and fees
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, deletedAt: null },
    include: {
      class: true,
      invoices: {
        orderBy: { createdAt: 'desc' },
        include: { payments: true },
      },
    },
  });

  if (!student) throw new AppError('Student not found', 404, 'NOT_FOUND');

  // 2. Fetch attendance stats (Present vs Absent vs Late)
  const attendanceStats = await prisma.attendance.groupBy({
    by: ['status'],
    where: { studentId, tenantId },
    _count: { status: true },
  });

  // 3. Fetch recent grades
  const recentGrades = await prisma.grade.findMany({
    where: { studentId, tenantId },
    include: { assessment: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // 4. Calculate Fee Balance
  let totalBilled = 0;
  let totalPaid = 0;
  student.invoices.forEach((inv) => {
    totalBilled += Number(inv.amount);
    inv.payments.forEach((p) => {
      totalPaid += Number(p.amount);
    });
  });

  return {
    student,
    attendance: attendanceStats,
    recentGrades,
    finances: {
      totalBilled,
      totalPaid,
      balance: totalBilled - totalPaid,
    },
  };
}

export async function promoteClass(
  tenantId: string,
  sourceClassId: string,
  targetClassId: string | null,
  isGraduation: boolean
) {
  return prisma.$transaction(async (tx) => {
    const students = await tx.student.findMany({
      where: { tenantId, classId: sourceClassId, status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });

    if (students.length === 0) throw new AppError('No active students found in this class', 400, 'NO_STUDENTS');

    const studentIds = students.map((s) => s.id);

    if (isGraduation) {
      await tx.student.updateMany({
        where: { id: { in: studentIds } },
        data: { status: 'GRADUATED', classId: null },
      });
      return { count: studentIds.length, action: 'GRADUATED' };
    } else {
      if (!targetClassId) throw new AppError('Target class required for promotion', 400, 'NO_TARGET');

      const targetClass = await tx.class.findUnique({
        where: { id: targetClassId },
        include: { _count: { select: { students: true } } },
      });

      if (!targetClass) throw new AppError('Target class not found', 404, 'NOT_FOUND');
      if (targetClass._count.students + studentIds.length > targetClass.capacity) {
        throw new AppError(
          `Target class capacity (${targetClass.capacity}) exceeded. Current: ${targetClass._count.students}, Incoming: ${studentIds.length}`,
          400,
          'CAPACITY_EXCEEDED'
        );
      }

      await tx.student.updateMany({
        where: { id: { in: studentIds } },
        data: { classId: targetClassId },
      });
      return { count: studentIds.length, action: 'PROMOTED' };
    }
  });
}
