import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  saveAttendance,
  getAttendanceForDate,
  listScopedAttendance,
  getAttendanceEarlyWarningInsights,
} from './attendance.service.js';
import {
  resolveAttendanceAccessScope,
  createAttendanceHandlers,
} from '../controllers/attendance.controller.js';

function createMockAttendanceDb(overrides: Record<string, any> = {}) {
  const state = {
    deletedCalls: [] as any[],
    createdCalls: [] as any[],
    attendanceFindManyCalls: [] as any[],
  };

  const baseTx = {
    attendance: {
      deleteMany: async (args: any) => {
        state.deletedCalls.push(args);
        return { count: 1 };
      },
      createMany: async (args: any) => {
        state.createdCalls.push(args);
        return { count: args.data.length };
      },
    },
  };

  const db: any = {
    __state: state,
    $transaction: async (fn: (tx: any) => Promise<any>) => fn(baseTx),
    class: {
      findFirst: async ({ where }: any) => {
        if (where.tenantId === 'tenant-1' && (where.id === 'class-a' || where.id === 'class-b')) {
          return { id: where.id };
        }
        return null;
      },
    },
    student: {
      findMany: async ({ where }: any) => {
        if (where.tenantId !== 'tenant-1' || where.classId !== 'class-a') return [];
        const allowed = ['stu-1', 'stu-2', 'stu-3'];
        const requested: string[] = where.id?.in || [];
        return requested.filter((id) => allowed.includes(id)).map((id) => ({ id }));
      },
      findFirst: async ({ where }: any) => {
        if (
          where.tenantId === 'tenant-1' &&
          where.firstName === 'Abebe' &&
          where.lastName === 'Bikila'
        ) {
          return { id: 'stu-1' };
        }
        return null;
      },
    },
    teacherProfile: {
      findFirst: async ({ where }: any) => {
        if (where.tenantId === 'tenant-1' && where.userId === 'user-teacher') {
          return { id: 'teacher-1' };
        }
        return null;
      },
    },
    timetable: {
      findMany: async ({ where }: any) => {
        if (where.tenantId === 'tenant-1' && where.teacherId === 'teacher-1') {
          return [{ classId: 'class-a' }];
        }
        return [];
      },
    },
    substituteAssignment: {
      findMany: async () => [],
    },
    parentProfile: {
      findFirst: async ({ where }: any) => {
        if (where.tenantId === 'tenant-1' && where.userId === 'user-parent') {
          return {
            id: 'parent-1',
            students: [{ studentId: 'stu-2' }, { studentId: 'stu-3' }],
          };
        }
        return null;
      },
    },
    user: {
      findUnique: async ({ where }: any) => {
        if (where.id === 'user-student') {
          return { id: 'user-student', profile: { firstName: 'Abebe', lastName: 'Bikila' } };
        }
        if (where.id === 'user-student-no-profile') {
          return { id: 'user-student-no-profile', profile: null };
        }
        return null;
      },
    },
    attendance: {
      findMany: async (args: any) => {
        state.attendanceFindManyCalls.push(args);
        return [];
      },
    },
    ...overrides,
  };

  return { db, state };
}

describe('Attendance Role Precedence & Access Scoping', () => {
  test('assigned teacher can write and read assigned class only', async () => {
    const { db } = createMockAttendanceDb();

    const scope = await resolveAttendanceAccessScope(
      { sub: 'user-teacher', tenantId: 'tenant-1', roles: ['TEACHER'] },
      { action: 'WRITE', classId: 'class-a', dateString: '2026-10-15' },
      db
    );
    assert.deepEqual(scope, { mode: 'CLASSES', classIds: ['class-a'] });

    await assert.rejects(
      resolveAttendanceAccessScope(
        { sub: 'user-teacher', tenantId: 'tenant-1', roles: ['TEACHER'] },
        { action: 'WRITE', classId: 'class-b', dateString: '2026-10-15' },
        db
      ),
      (err: any) => err.status === 403 && err.code === 'TEACHER_NOT_ASSIGNED_TO_CLASS'
    );
  });

  test('teacher without TeacherProfile fails closed (403)', async () => {
    const { db } = createMockAttendanceDb();

    await assert.rejects(
      resolveAttendanceAccessScope(
        { sub: 'user-no-teacher-profile', tenantId: 'tenant-1', roles: ['TEACHER'] },
        { action: 'READ', classId: 'class-a', dateString: '2026-10-15' },
        db
      ),
      (err: any) => err.status === 403 && err.code === 'TEACHER_PROFILE_REQUIRED'
    );
  });

  test('multi-role user [TEACHER, REGISTRAR] or [TEACHER, PARENT] does NOT bypass teacher class restriction', async () => {
    const { db } = createMockAttendanceDb();

    for (const multiRoles of [
      ['TEACHER', 'REGISTRAR'],
      ['REGISTRAR', 'TEACHER'],
      ['TEACHER', 'PARENT'],
      ['TEACHER', 'ACCOUNTANT'],
    ]) {
      await assert.rejects(
        resolveAttendanceAccessScope(
          { sub: 'user-teacher', tenantId: 'tenant-1', roles: multiRoles },
          { action: 'WRITE', classId: 'class-b', dateString: '2026-10-15' },
          db
        ),
        (err: any) => err.status === 403 && err.code === 'TEACHER_NOT_ASSIGNED_TO_CLASS'
      );

      const readScope = await resolveAttendanceAccessScope(
        { sub: 'user-teacher', tenantId: 'tenant-1', roles: multiRoles },
        { action: 'READ' },
        db
      );
      assert.deepEqual(readScope, { mode: 'CLASSES', classIds: ['class-a'] });
    }
  });

  test('cover teacher via SubstituteAssignment is granted access for covered date', async () => {
    const { db } = createMockAttendanceDb({
      substituteAssignment: {
        findMany: async () => [{ timetable: { classId: 'class-b' } }],
      },
    });

    const scope = await resolveAttendanceAccessScope(
      { sub: 'user-teacher', tenantId: 'tenant-1', roles: ['TEACHER'] },
      { action: 'WRITE', classId: 'class-b', dateString: '2026-10-15' },
      db
    );
    assert.deepEqual(scope, { mode: 'CLASSES', classIds: ['class-a', 'class-b'] });
  });

  test('admin and standalone registrar have tenant-wide class scope; accountant is denied', async () => {
    const { db } = createMockAttendanceDb();

    for (const role of ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR']) {
      const scope = await resolveAttendanceAccessScope(
        { sub: 'staff-1', tenantId: 'tenant-1', roles: [role] },
        { action: 'READ', classId: 'class-b', dateString: '2026-10-15' },
        db
      );
      assert.deepEqual(scope, { mode: 'TENANT' });
    }

    await assert.rejects(
      resolveAttendanceAccessScope(
        { sub: 'acct-1', tenantId: 'tenant-1', roles: ['ACCOUNTANT'] },
        { action: 'READ', classId: 'class-a', dateString: '2026-10-15' },
        db
      ),
      (err: any) => err.status === 403 && err.code === 'FORBIDDEN'
    );
  });

  test('student and parent are strictly scoped at DB query level and denied writes', async () => {
    const { db, state } = createMockAttendanceDb();

    await assert.rejects(
      resolveAttendanceAccessScope(
        { sub: 'user-student', tenantId: 'tenant-1', roles: ['STUDENT'] },
        { action: 'WRITE', classId: 'class-a', dateString: '2026-10-15' },
        db
      ),
      (err: any) => err.status === 403
    );

    const studentScope = await resolveAttendanceAccessScope(
      { sub: 'user-student', tenantId: 'tenant-1', roles: ['STUDENT'] },
      { action: 'READ', classId: 'class-a', dateString: '2026-10-15' },
      db
    );
    assert.deepEqual(studentScope, { mode: 'STUDENTS', studentIds: ['stu-1'] });

    await getAttendanceForDate('tenant-1', 'class-a', '2026-10-15', { studentIds: ['stu-1'] }, db);
    assert.deepEqual(state.attendanceFindManyCalls[0].where.studentId, { in: ['stu-1'] });

    // Student without profile fails closed to empty list without hitting attendance table
    const emptyStudentScope = await resolveAttendanceAccessScope(
      { sub: 'user-student-no-profile', tenantId: 'tenant-1', roles: ['STUDENT'] },
      { action: 'READ' },
      db
    );
    assert.deepEqual(emptyStudentScope, { mode: 'STUDENTS', studentIds: [] });

    const beforeCount = state.attendanceFindManyCalls.length;
    const emptyRows = await listScopedAttendance(
      'tenant-1',
      { scope: { studentIds: [] } },
      db
    );
    assert.deepEqual(emptyRows, []);
    assert.equal(state.attendanceFindManyCalls.length, beforeCount);

    const parentScope = await resolveAttendanceAccessScope(
      { sub: 'user-parent', tenantId: 'tenant-1', roles: ['PARENT'] },
      { action: 'READ' },
      db
    );
    assert.deepEqual(parentScope, { mode: 'STUDENTS', studentIds: ['stu-2', 'stu-3'] });
  });

  test('cross-tenant class access fails closed with 404 CLASS_NOT_FOUND', async () => {
    const { db } = createMockAttendanceDb();

    await assert.rejects(
      resolveAttendanceAccessScope(
        { sub: 'admin-1', tenantId: 'other-tenant', roles: ['TENANT_ADMIN'] },
        { action: 'READ', classId: 'class-a', dateString: '2026-10-15' },
        db
      ),
      (err: any) => err.status === 404 && err.code === 'CLASS_NOT_FOUND'
    );
  });
});

describe('saveAttendance Validation & Audit Safety', () => {
  test('saves attendance atomically and logs real actor ID without student PII', async () => {
    const { db, state } = createMockAttendanceDb();
    const auditLogs: any[] = [];

    const result = await saveAttendance(
      'tenant-1',
      'class-a',
      '2026-10-15',
      [
        { studentId: 'stu-1', status: 'PRESENT' },
        { studentId: 'stu-2', status: 'LATE' },
      ],
      'user-teacher',
      db,
      async (tenantId, userId, action, entity, details) => {
        auditLogs.push({ tenantId, userId, action, entity, details });
      }
    );

    assert.equal(result.count, 2);
    assert.equal(state.deletedCalls.length, 1);
    assert.equal(state.createdCalls.length, 1);
    assert.equal(auditLogs.length, 1);
    assert.equal(auditLogs[0].userId, 'user-teacher');
    assert.notEqual(auditLogs[0].userId, 'SYSTEM');
    assert.equal(auditLogs[0].details.includes('stu-1'), false);
  });

  test('rejects invalid date, duplicate students, and out-of-class/cross-tenant students', async () => {
    const { db } = createMockAttendanceDb();

    await assert.rejects(
      saveAttendance(
        'tenant-1',
        'class-a',
        '2026-02-31',
        [{ studentId: 'stu-1', status: 'PRESENT' }],
        'user-teacher',
        db
      ),
      (err: any) => err.status === 400 && err.code === 'INVALID_DATE'
    );

    await assert.rejects(
      saveAttendance(
        'tenant-1',
        'class-a',
        '2026-10-15',
        [
          { studentId: 'stu-1', status: 'PRESENT' },
          { studentId: 'stu-1', status: 'ABSENT' },
        ],
        'user-teacher',
        db
      ),
      (err: any) => err.status === 400 && err.code === 'DUPLICATE_STUDENT_RECORDS'
    );

    await assert.rejects(
      saveAttendance(
        'tenant-1',
        'class-a',
        '2026-10-15',
        [{ studentId: 'foreign-stu', status: 'PRESENT' }],
        'user-teacher',
        db
      ),
      (err: any) => err.status === 400 && err.code === 'STUDENT_CLASS_OR_TENANT_MISMATCH'
    );
  });
});

describe('Attendance Early-Warning Insights (Feature B)', () => {
  test('flags CRITICAL (<75%) and WARNING (<85%) students with >= minSessions and computes exact rates', async () => {
    const sampleRows = [
      // stu-1: 1 PRESENT, 1 LATE, 2 ABSENT => 2/4 = 50% (CRITICAL)
      {
        studentId: 'stu-1',
        classId: 'class-a',
        status: 'PRESENT',
        date: new Date('2026-10-01T00:00:00Z'),
        student: { firstName: 'Abebe', lastName: 'Bikila', admissionNumber: 'ADM-001' },
        class: { name: 'Grade 10', section: 'A' },
      },
      {
        studentId: 'stu-1',
        classId: 'class-a',
        status: 'LATE',
        date: new Date('2026-10-02T00:00:00Z'),
        student: { firstName: 'Abebe', lastName: 'Bikila', admissionNumber: 'ADM-001' },
        class: { name: 'Grade 10', section: 'A' },
      },
      {
        studentId: 'stu-1',
        classId: 'class-a',
        status: 'ABSENT',
        date: new Date('2026-10-03T00:00:00Z'),
        student: { firstName: 'Abebe', lastName: 'Bikila', admissionNumber: 'ADM-001' },
        class: { name: 'Grade 10', section: 'A' },
      },
      {
        studentId: 'stu-1',
        classId: 'class-a',
        status: 'ABSENT',
        date: new Date('2026-10-04T00:00:00Z'),
        student: { firstName: 'Abebe', lastName: 'Bikila', admissionNumber: 'ADM-001' },
        class: { name: 'Grade 10', section: 'A' },
      },
      // stu-2: 4 PRESENT, 1 ABSENT => 4/5 = 80% (WARNING)
      {
        studentId: 'stu-2',
        classId: 'class-a',
        status: 'PRESENT',
        date: new Date('2026-10-01T00:00:00Z'),
        student: { firstName: 'Sara', lastName: 'Tadesse', admissionNumber: 'ADM-002' },
        class: { name: 'Grade 10', section: 'A' },
      },
      {
        studentId: 'stu-2',
        classId: 'class-a',
        status: 'PRESENT',
        date: new Date('2026-10-02T00:00:00Z'),
        student: { firstName: 'Sara', lastName: 'Tadesse', admissionNumber: 'ADM-002' },
        class: { name: 'Grade 10', section: 'A' },
      },
      {
        studentId: 'stu-2',
        classId: 'class-a',
        status: 'PRESENT',
        date: new Date('2026-10-03T00:00:00Z'),
        student: { firstName: 'Sara', lastName: 'Tadesse', admissionNumber: 'ADM-002' },
        class: { name: 'Grade 10', section: 'A' },
      },
      {
        studentId: 'stu-2',
        classId: 'class-a',
        status: 'PRESENT',
        date: new Date('2026-10-04T00:00:00Z'),
        student: { firstName: 'Sara', lastName: 'Tadesse', admissionNumber: 'ADM-002' },
        class: { name: 'Grade 10', section: 'A' },
      },
      {
        studentId: 'stu-2',
        classId: 'class-a',
        status: 'ABSENT',
        date: new Date('2026-10-05T00:00:00Z'),
        student: { firstName: 'Sara', lastName: 'Tadesse', admissionNumber: 'ADM-002' },
        class: { name: 'Grade 10', section: 'A' },
      },
      // stu-3: only 1 ABSENT session -> below minSessions=3 -> NOT flagged
      {
        studentId: 'stu-3',
        classId: 'class-a',
        status: 'ABSENT',
        date: new Date('2026-10-05T00:00:00Z'),
        student: { firstName: 'Dawit', lastName: 'Bekele', admissionNumber: 'ADM-003' },
        class: { name: 'Grade 10', section: 'A' },
      },
    ];

    const { db, state } = createMockAttendanceDb({
      attendance: {
        findMany: async (args: any) => {
          state.attendanceFindManyCalls.push(args);
          return sampleRows;
        },
      },
    });

    const insights = await getAttendanceEarlyWarningInsights(
      'tenant-1',
      {
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        thresholdPercent: 85,
        minSessions: 3,
      },
      db
    );

    assert.equal(insights.summary.totalRecords, 10);
    assert.equal(insights.summary.uniqueStudents, 3);
    assert.equal(insights.summary.flaggedCount, 2);
    assert.equal(insights.summary.criticalCount, 1);
    assert.equal(insights.summary.warningCount, 1);
    assert.equal(insights.summary.overallAttendanceRate, 60);

    assert.equal(insights.flaggedStudents[0].studentId, 'stu-1');
    assert.equal(insights.flaggedStudents[0].attendanceRate, 50);
    assert.equal(insights.flaggedStudents[0].riskLevel, 'CRITICAL');

    assert.equal(insights.flaggedStudents[1].studentId, 'stu-2');
    assert.equal(insights.flaggedStudents[1].attendanceRate, 80);
    assert.equal(insights.flaggedStudents[1].riskLevel, 'WARNING');
  });

  test('enforces date boundaries, tenant/role filters, and controller handler scoping', async () => {
    const { db, state } = createMockAttendanceDb();
    const handlers = createAttendanceHandlers({ db });

    await assert.rejects(
      getAttendanceEarlyWarningInsights(
        'tenant-1',
        { startDate: '2026-10-31', endDate: '2026-10-01' },
        db
      ),
      (err: any) => err.status === 400 && err.code === 'INVALID_DATE_RANGE'
    );

    // Controller handler test: parent requests insights -> DB query scoped to linked children only
    let responsePayload: any = null;
    let statusCode = 0;
    let passedErr: any = null;

    await handlers.getAttendanceInsightsHandler(
      {
        auth: { sub: 'user-parent', tenantId: 'tenant-1', roles: ['PARENT'] },
        query: { startDate: '2026-10-01', endDate: '2026-10-15', thresholdPercent: '85' },
      } as any,
      {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (body: any) => {
              responsePayload = body;
            },
          };
        },
      } as any,
      (err: any) => {
        passedErr = err;
      }
    );

    assert.equal(passedErr, null);
    assert.equal(statusCode, 200);
    assert.equal(responsePayload.success, true);
    assert.deepEqual(state.attendanceFindManyCalls[0].where.studentId, { in: ['stu-2', 'stu-3'] });
    assert.equal(state.attendanceFindManyCalls[0].where.tenantId, 'tenant-1');

    // Controller handler test: [TEACHER, REGISTRAR] trying unassigned class-b gets 403
    let teacherErr: any = null;
    await handlers.getAttendanceInsightsHandler(
      {
        auth: { sub: 'user-teacher', tenantId: 'tenant-1', roles: ['TEACHER', 'REGISTRAR'] },
        query: { classId: 'class-b' },
      } as any,
      { status: () => ({ json: () => {} }) } as any,
      (err: any) => {
        teacherErr = err;
      }
    );

    assert.equal(teacherErr?.status, 403);
    assert.equal(teacherErr?.code, 'TEACHER_NOT_ASSIGNED_TO_CLASS');
  });
});
