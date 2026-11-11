import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { createLog } from './audit.service.js';

export type AttendanceStatusValue = 'PRESENT' | 'ABSENT' | 'LATE';

export interface AttendanceRecordInput {
  studentId: string;
  status: AttendanceStatusValue;
}

export interface AttendanceScope {
  classIds?: string[];
  studentIds?: string[];
}

export interface EarlyWarningOptions {
  classId?: string;
  startDate?: string;
  endDate?: string;
  thresholdPercent?: number;
  minSessions?: number;
  scope?: AttendanceScope;
}

export interface EarlyWarningStudent {
  studentId: string;
  admissionNumber: string;
  studentName: string;
  classId: string;
  className: string;
  totalSessions: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendanceRate: number;
  riskLevel: 'CRITICAL' | 'WARNING';
  lastRecordedDate: string;
}

export type AuditLogFn = (
  tenantId: string,
  userId: string,
  action: string,
  entity: string,
  details: string
) => Promise<void>;

const DEFAULT_THRESHOLD_PERCENT = 85;
const DEFAULT_MIN_SESSIONS = 3;
const DEFAULT_WINDOW_DAYS = 30;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses a YYYY-MM-DD (or ISO timestamp) into midnight UTC to match @db.Date columns.
 */
export function parseUtcDateOnly(dateString: string, fieldName = 'date'): Date {
  const trimmed = dateString?.trim();
  if (!trimmed) {
    throw new AppError(`${fieldName} is required`, 400, 'INVALID_DATE');
  }

  let parsed: Date;
  if (ISO_DATE_RE.test(trimmed)) {
    const [yearStr, monthStr, dayStr] = trimmed.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    parsed = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      throw new AppError(`Invalid ${fieldName}. Expected YYYY-MM-DD.`, 400, 'INVALID_DATE');
    }
    return parsed;
  }

  parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`Invalid ${fieldName}. Expected YYYY-MM-DD.`, 400, 'INVALID_DATE');
  }
  parsed.setUTCHours(0, 0, 0, 0);
  return parsed;
}

export async function saveAttendance(
  tenantId: string,
  classId: string,
  dateString: string,
  records: AttendanceRecordInput[],
  actorUserId?: string,
  db: any = prisma,
  logAudit: AuditLogFn = createLog
) {
  const date = parseUtcDateOnly(dateString, 'date');

  if (!Array.isArray(records) || records.length === 0) {
    throw new AppError('At least one attendance record is required', 400, 'EMPTY_ATTENDANCE_RECORDS');
  }

  const uniqueStudentIds = Array.from(new Set(records.map((r) => r.studentId)));
  if (uniqueStudentIds.length !== records.length) {
    throw new AppError('Duplicate student records are not allowed for the same date', 400, 'DUPLICATE_STUDENT_RECORDS');
  }

  // Validate class exists inside this tenant
  const existingClass = await db.class.findFirst({
    where: { id: classId, tenantId },
    select: { id: true },
  });
  if (!existingClass) {
    throw new AppError('Class not found or does not belong to this tenant', 404, 'CLASS_NOT_FOUND');
  }

  // Validate all students are active and enrolled in this class within this tenant
  const existingStudents = await db.student.findMany({
    where: {
      tenantId,
      classId,
      deletedAt: null,
      id: { in: uniqueStudentIds },
    },
    select: { id: true },
  });

  if (existingStudents.length !== uniqueStudentIds.length) {
    throw new AppError(
      'One or more students do not belong to this class or tenant',
      400,
      'STUDENT_CLASS_OR_TENANT_MISMATCH'
    );
  }

  // Atomically replace class attendance for this date
  const created = await db.$transaction(async (tx: any) => {
    await tx.attendance.deleteMany({
      where: { tenantId, classId, date },
    });

    return tx.attendance.createMany({
      data: records.map((r) => ({
        tenantId,
        classId,
        studentId: r.studentId,
        status: r.status,
        date,
      })),
    });
  });

  // Record audit trail only when a real authenticated user ID is present
  if (actorUserId) {
    await logAudit(
      tenantId,
      actorUserId,
      'ATTENDANCE_RECORDED',
      `Class:${classId}`,
      `Recorded ${records.length} attendance entries for ${date.toISOString().slice(0, 10)}`
    );
  }

  return created;
}

export async function getAttendanceForDate(
  tenantId: string,
  classId: string,
  dateString: string,
  scope?: AttendanceScope,
  db: any = prisma
) {
  const date = parseUtcDateOnly(dateString, 'date');

  if (scope?.classIds && !scope.classIds.includes(classId)) {
    throw new AppError('Access forbidden for requested class', 403, 'FORBIDDEN');
  }

  if (scope?.studentIds && scope.studentIds.length === 0) {
    return [];
  }

  const where: any = {
    tenantId,
    classId,
    date,
    ...(scope?.studentIds ? { studentId: { in: scope.studentIds } } : {}),
  };

  return db.attendance.findMany({
    where,
    select: { studentId: true, status: true },
    orderBy: { studentId: 'asc' },
  });
}

/**
 * Lists recent attendance records within the caller's DB-enforced tenant and role scope.
 */
export async function listScopedAttendance(
  tenantId: string,
  options: {
    scope?: AttendanceScope;
    classId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {},
  db: any = prisma
) {
  const { scope, classId, startDate, endDate, limit = 100 } = options;

  if (scope?.classIds && scope.classIds.length === 0) {
    return [];
  }
  if (scope?.studentIds && scope.studentIds.length === 0) {
    return [];
  }
  if (classId && scope?.classIds && !scope.classIds.includes(classId)) {
    throw new AppError('Access forbidden for requested class', 403, 'FORBIDDEN');
  }

  const where: any = { tenantId };
  if (classId) {
    where.classId = classId;
  } else if (scope?.classIds) {
    where.classId = { in: scope.classIds };
  }

  if (scope?.studentIds) {
    where.studentId = { in: scope.studentIds };
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = parseUtcDateOnly(startDate, 'startDate');
    if (endDate) where.date.lte = parseUtcDateOnly(endDate, 'endDate');
    if (where.date.gte && where.date.lte && where.date.gte > where.date.lte) {
      throw new AppError('startDate must be before or equal to endDate', 400, 'INVALID_DATE_RANGE');
    }
  }

  const rows = await db.attendance.findMany({
    where,
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true, admissionNumber: true },
      },
      class: {
        select: { id: true, name: true, section: true },
      },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: Math.min(Math.max(1, limit), 250),
  });

  return rows.map((row: any) => ({
    id: row.id,
    studentId: row.studentId,
    studentName: row.student
      ? `${row.student.firstName} ${row.student.lastName}`.trim()
      : 'Student',
    admissionNumber: row.student?.admissionNumber || '',
    date: row.date instanceof Date ? row.date.toISOString() : String(row.date),
    status: String(row.status || 'PRESENT').toLowerCase(),
    period: 'Daily Roll',
    classId: row.classId,
    className: row.class
      ? `${row.class.name}${row.class.section ? ` - ${row.class.section}` : ''}`
      : 'Class',
  }));
}

/**
 * Attendance Early-Warning & Summary Insights.
 *
 * Attendance rate formula:
 *   attendanceRate = ((presentCount + lateCount) / totalSessions) * 100
 * A student is flagged when:
 *   totalSessions >= minSessions (default 3) AND attendanceRate < thresholdPercent (default 85%)
 * Risk tiers:
 *   CRITICAL: attendanceRate < max(0, thresholdPercent - 10)  (default < 75%)
 *   WARNING:  attendanceRate < thresholdPercent               (default < 85%)
 */
export async function getAttendanceEarlyWarningInsights(
  tenantId: string,
  options: EarlyWarningOptions = {},
  db: any = prisma
) {
  const end = options.endDate
    ? parseUtcDateOnly(options.endDate, 'endDate')
    : (() => {
        const now = new Date();
        now.setUTCHours(0, 0, 0, 0);
        return now;
      })();

  const start = options.startDate
    ? parseUtcDateOnly(options.startDate, 'startDate')
    : new Date(end.getTime() - (DEFAULT_WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000);

  if (start > end) {
    throw new AppError('startDate must be before or equal to endDate', 400, 'INVALID_DATE_RANGE');
  }

  const thresholdPercent =
    options.thresholdPercent !== undefined ? Number(options.thresholdPercent) : DEFAULT_THRESHOLD_PERCENT;
  if (!Number.isFinite(thresholdPercent) || thresholdPercent < 1 || thresholdPercent > 100) {
    throw new AppError('thresholdPercent must be between 1 and 100', 400, 'INVALID_THRESHOLD');
  }

  const minSessions =
    options.minSessions !== undefined ? Math.floor(Number(options.minSessions)) : DEFAULT_MIN_SESSIONS;
  if (!Number.isFinite(minSessions) || minSessions < 1) {
    throw new AppError('minSessions must be at least 1', 400, 'INVALID_MIN_SESSIONS');
  }

  const scope = options.scope;
  const criticalCutoff = Math.max(0, thresholdPercent - 10);

  const buildEmptyResponse = () => ({
    period: {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    },
    policy: {
      thresholdPercent,
      criticalPercent: criticalCutoff,
      minSessions,
      formula: '((present + late) / totalSessions) * 100',
    },
    summary: {
      totalRecords: 0,
      uniqueStudents: 0,
      flaggedCount: 0,
      criticalCount: 0,
      warningCount: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      overallAttendanceRate: 100,
    },
    flaggedStudents: [] as EarlyWarningStudent[],
  });

  if (options.classId) {
    if (scope?.classIds && !scope.classIds.includes(options.classId)) {
      throw new AppError('Teacher is not assigned to this class', 403, 'TEACHER_NOT_ASSIGNED_TO_CLASS');
    }
    const cls = await db.class.findFirst({
      where: { id: options.classId, tenantId },
      select: { id: true },
    });
    if (!cls) {
      throw new AppError('Class not found or does not belong to this tenant', 404, 'CLASS_NOT_FOUND');
    }
  }

  if (scope?.classIds && scope.classIds.length === 0) {
    return buildEmptyResponse();
  }
  if (scope?.studentIds && scope.studentIds.length === 0) {
    return buildEmptyResponse();
  }

  const where: any = {
    tenantId,
    date: { gte: start, lte: end },
    student: { deletedAt: null },
  };

  if (options.classId) {
    where.classId = options.classId;
  } else if (scope?.classIds) {
    where.classId = { in: scope.classIds };
  }

  if (scope?.studentIds) {
    where.studentId = { in: scope.studentIds };
  }

  const records = await db.attendance.findMany({
    where,
    select: {
      studentId: true,
      classId: true,
      status: true,
      date: true,
      student: {
        select: {
          firstName: true,
          lastName: true,
          admissionNumber: true,
        },
      },
      class: {
        select: {
          name: true,
          section: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  if (records.length === 0) {
    return buildEmptyResponse();
  }

  let totalPresent = 0;
  let totalLate = 0;
  let totalAbsent = 0;

  const byStudent = new Map<
    string,
    {
      studentId: string;
      admissionNumber: string;
      studentName: string;
      classId: string;
      className: string;
      presentCount: number;
      lateCount: number;
      absentCount: number;
      lastRecordedDate: string;
    }
  >();

  for (const r of records) {
    const dateIso = (r.date instanceof Date ? r.date : new Date(r.date)).toISOString().slice(0, 10);

    if (r.status === 'PRESENT') totalPresent++;
    else if (r.status === 'LATE') totalLate++;
    else if (r.status === 'ABSENT') totalAbsent++;

    let bucket = byStudent.get(r.studentId);
    if (!bucket) {
      const classLabel = r.class
        ? `${r.class.name}${r.class.section ? ` - ${r.class.section}` : ''}`
        : 'Unassigned';
      bucket = {
        studentId: r.studentId,
        admissionNumber: r.student?.admissionNumber || '',
        studentName: r.student
          ? `${r.student.firstName} ${r.student.lastName}`.trim()
          : 'Student',
        classId: r.classId,
        className: classLabel,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        lastRecordedDate: dateIso,
      };
      byStudent.set(r.studentId, bucket);
    }

    if (dateIso > bucket.lastRecordedDate) {
      bucket.lastRecordedDate = dateIso;
    }

    if (r.status === 'PRESENT') bucket.presentCount++;
    else if (r.status === 'LATE') bucket.lateCount++;
    else if (r.status === 'ABSENT') bucket.absentCount++;
  }

  const flaggedStudents: EarlyWarningStudent[] = [];

  for (const bucket of byStudent.values()) {
    const totalSessions = bucket.presentCount + bucket.lateCount + bucket.absentCount;
    if (totalSessions < minSessions) continue;

    const attendedSessions = bucket.presentCount + bucket.lateCount;
    const attendanceRate = Math.round((attendedSessions / totalSessions) * 1000) / 10;

    if (attendanceRate < thresholdPercent) {
      const riskLevel: 'CRITICAL' | 'WARNING' =
        attendanceRate < criticalCutoff ? 'CRITICAL' : 'WARNING';
      flaggedStudents.push({
        studentId: bucket.studentId,
        admissionNumber: bucket.admissionNumber,
        studentName: bucket.studentName,
        classId: bucket.classId,
        className: bucket.className,
        totalSessions,
        presentCount: bucket.presentCount,
        lateCount: bucket.lateCount,
        absentCount: bucket.absentCount,
        attendanceRate,
        riskLevel,
        lastRecordedDate: bucket.lastRecordedDate,
      });
    }
  }

  flaggedStudents.sort((a, b) => {
    if (a.attendanceRate !== b.attendanceRate) return a.attendanceRate - b.attendanceRate;
    return b.absentCount - a.absentCount;
  });

  const totalRecords = totalPresent + totalLate + totalAbsent;
  const overallAttendanceRate =
    totalRecords > 0
      ? Math.round(((totalPresent + totalLate) / totalRecords) * 1000) / 10
      : 100;

  return {
    period: {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    },
    policy: {
      thresholdPercent,
      criticalPercent: criticalCutoff,
      minSessions,
      formula: '((present + late) / totalSessions) * 100',
    },
    summary: {
      totalRecords,
      uniqueStudents: byStudent.size,
      flaggedCount: flaggedStudents.length,
      criticalCount: flaggedStudents.filter((s) => s.riskLevel === 'CRITICAL').length,
      warningCount: flaggedStudents.filter((s) => s.riskLevel === 'WARNING').length,
      presentCount: totalPresent,
      lateCount: totalLate,
      absentCount: totalAbsent,
      overallAttendanceRate,
    },
    flaggedStudents,
  };
}