import { Request, Response, NextFunction } from 'express';
import * as attendanceService from '../services/attendance.service.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { AccessTokenPayload } from '../lib/jwt.js';
import { z } from 'zod';

const saveAttendanceSchema = z.object({
  classId: z.string().min(1),
  date: z.string().min(1),
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
      })
    )
    .min(1),
});

const insightsQuerySchema = z.object({
  classId: z.string().min(1).optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  thresholdPercent: z.coerce.number().min(1).max(100).optional(),
  minSessions: z.coerce.number().int().min(1).max(365).optional(),
});

export type ResolvedAttendanceScope =
  | { mode: 'TENANT' }
  | { mode: 'CLASSES'; classIds: string[] }
  | { mode: 'STUDENTS'; studentIds: string[] };

/**
 * Resolves tenant- and role-scoped access for attendance endpoints.
 *
 * Role precedence (strict):
 * 1. SUPER_ADMIN / TENANT_ADMIN / ADMIN -> tenant-wide access
 * 2. TEACHER (when not admin) -> strictly scoped to timetable / substitute assigned classes;
 *    never bypassed even if TEACHER also holds REGISTRAR, ACCOUNTANT, PARENT, or STUDENT.
 * 3. REGISTRAR (when neither admin nor teacher) -> tenant-wide access
 * 4. PARENT / STUDENT (READ only) -> strictly scoped to linked children and/or own student record
 * 5. All other roles -> 403 FORBIDDEN (fail closed)
 */
export async function resolveAttendanceAccessScope(
  auth: Partial<AccessTokenPayload> | undefined,
  options: {
    action: 'READ' | 'WRITE';
    classId?: string;
    dateString?: string;
  },
  db: any = prisma
): Promise<ResolvedAttendanceScope> {
  if (!auth?.tenantId || !auth?.sub || !Array.isArray(auth.roles)) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }

  const tenantId = auth.tenantId;
  const userId = auth.sub;
  const roles = auth.roles.map((r) => String(r).toUpperCase());

  const verifyClassInTenant = async (targetClassId: string) => {
    const cls = await db.class.findFirst({
      where: { id: targetClassId, tenantId },
      select: { id: true },
    });
    if (!cls) {
      throw new AppError('Class not found or does not belong to this tenant', 404, 'CLASS_NOT_FOUND');
    }
  };

  const isAdmin =
    roles.includes('SUPER_ADMIN') ||
    roles.includes('TENANT_ADMIN') ||
    roles.includes('ADMIN');

  if (isAdmin) {
    if (options.classId) await verifyClassInTenant(options.classId);
    return { mode: 'TENANT' };
  }

  const isTeacher = roles.includes('TEACHER');
  if (isTeacher) {
    const teacherProfile = await db.teacherProfile.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!teacherProfile) {
      throw new AppError(
        'Teacher profile not found for this tenant',
        403,
        'TEACHER_PROFILE_REQUIRED'
      );
    }

    const timetableRows = await db.timetable.findMany({
      where: { tenantId, teacherId: teacherProfile.id },
      select: { classId: true },
    });

    const assignedClassIds = new Set<string>(
      timetableRows.map((entry: { classId: string }) => entry.classId)
    );

    if (options.dateString && db.substituteAssignment?.findMany) {
      const targetDate = attendanceService.parseUtcDateOnly(options.dateString, 'date');
      const coverRows = await db.substituteAssignment.findMany({
        where: {
          tenantId,
          coverTeacherId: teacherProfile.id,
          date: targetDate,
        },
        select: {
          timetable: {
            select: { classId: true },
          },
        },
      });
      for (const cover of coverRows) {
        if (cover?.timetable?.classId) {
          assignedClassIds.add(cover.timetable.classId);
        }
      }
    }

    const classIds = Array.from(assignedClassIds);

    if (options.classId) {
      await verifyClassInTenant(options.classId);
      if (!assignedClassIds.has(options.classId)) {
        throw new AppError(
          'Teacher is not assigned to teach this class',
          403,
          'TEACHER_NOT_ASSIGNED_TO_CLASS'
        );
      }
    }

    return { mode: 'CLASSES', classIds };
  }

  const isRegistrar = roles.includes('REGISTRAR');
  if (isRegistrar) {
    if (options.classId) await verifyClassInTenant(options.classId);
    return { mode: 'TENANT' };
  }

  if (options.action === 'WRITE') {
    throw new AppError(
      'You do not have permission to record attendance',
      403,
      'FORBIDDEN'
    );
  }

  const isParent = roles.includes('PARENT');
  const isStudent = roles.includes('STUDENT');

  if (isParent || isStudent) {
    if (options.classId) await verifyClassInTenant(options.classId);

    const allowedStudentIds = new Set<string>();

    if (isParent) {
      const parentProfile = await db.parentProfile.findFirst({
        where: { tenantId, userId },
        include: { students: { select: { studentId: true } } },
      });
      for (const link of parentProfile?.students || []) {
        if (link?.studentId) allowedStudentIds.add(link.studentId);
      }
    }

    if (isStudent) {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      const firstName = user?.profile?.firstName?.trim();
      const lastName = user?.profile?.lastName?.trim();

      if (firstName && lastName) {
        const student = await db.student.findFirst({
          where: {
            tenantId,
            firstName,
            lastName,
            deletedAt: null,
          },
          select: { id: true },
        });
        if (student?.id) {
          allowedStudentIds.add(student.id);
        }
      }
    }

    return { mode: 'STUDENTS', studentIds: Array.from(allowedStudentIds) };
  }

  throw new AppError('Access forbidden', 403, 'FORBIDDEN');
}

function toServiceScope(
  resolved: ResolvedAttendanceScope
): attendanceService.AttendanceScope | undefined {
  if (resolved.mode === 'CLASSES') return { classIds: resolved.classIds };
  if (resolved.mode === 'STUDENTS') return { studentIds: resolved.studentIds };
  return undefined;
}

export function createAttendanceHandlers(
  deps: {
    db?: any;
    service?: typeof attendanceService;
  } = {}
) {
  const db = deps.db ?? prisma;
  const service = deps.service ?? attendanceService;

  async function saveAttendanceHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const input = saveAttendanceSchema.parse(req.body) as {
        classId: string;
        date: string;
        records: attendanceService.AttendanceRecordInput[];
      };
      const auth = req.auth;

      await resolveAttendanceAccessScope(
        auth,
        {
          action: 'WRITE',
          classId: input.classId,
          dateString: input.date,
        },
        db
      );

      await service.saveAttendance(
        auth!.tenantId,
        input.classId,
        input.date,
        input.records,
        auth!.sub,
        db
      );

      res.status(200).json({ success: true, message: 'Attendance saved' });
    } catch (err) {
      next(err);
    }
  }

  async function getAttendanceHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const classId = typeof req.query.classId === 'string' && req.query.classId.trim()
        ? req.query.classId.trim()
        : undefined;
      const date = typeof req.query.date === 'string' && req.query.date.trim()
        ? req.query.date.trim()
        : undefined;

      if ((classId && !date) || (!classId && date)) {
        throw new AppError(
          'Both classId and date are required when querying a specific class date',
          400,
          'MISSING_CLASS_OR_DATE'
        );
      }

      const resolved = await resolveAttendanceAccessScope(
        req.auth,
        {
          action: 'READ',
          classId,
          dateString: date,
        },
        db
      );

      const scope = toServiceScope(resolved);

      if (classId && date) {
        const records = await service.getAttendanceForDate(
          req.auth!.tenantId,
          classId,
          date,
          scope,
          db
        );
        return res.status(200).json({ success: true, data: records });
      }

      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
      const limitParam = req.query.limit ? Number(req.query.limit) : undefined;
      const limit = limitParam && Number.isFinite(limitParam) ? limitParam : 100;

      const records = await service.listScopedAttendance(
        req.auth!.tenantId,
        { scope, startDate, endDate, limit },
        db
      );

      return res.status(200).json({ success: true, data: records });
    } catch (err) {
      next(err);
    }
  }

  async function getAttendanceInsightsHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const query = insightsQuerySchema.parse(req.query);

      const resolved = await resolveAttendanceAccessScope(
        req.auth,
        {
          action: 'READ',
          classId: query.classId,
        },
        db
      );

      const insights = await service.getAttendanceEarlyWarningInsights(
        req.auth!.tenantId,
        {
          classId: query.classId,
          startDate: query.startDate,
          endDate: query.endDate,
          thresholdPercent: query.thresholdPercent,
          minSessions: query.minSessions,
          scope: toServiceScope(resolved),
        },
        db
      );

      return res.status(200).json({ success: true, data: insights });
    } catch (err) {
      next(err);
    }
  }

  return {
    saveAttendanceHandler,
    getAttendanceHandler,
    getAttendanceInsightsHandler,
  };
}

const defaultHandlers = createAttendanceHandlers();
export const saveAttendanceHandler = defaultHandlers.saveAttendanceHandler;
export const getAttendanceHandler = defaultHandlers.getAttendanceHandler;
export const getAttendanceInsightsHandler = defaultHandlers.getAttendanceInsightsHandler;
