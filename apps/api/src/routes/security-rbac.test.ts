import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { requireRoles } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/error.middleware.js';

describe('Server-Side Sensitive Domain Authorization Matrix', () => {
  const studentUser = {
    auth: {
      sub: 'usr-student-99',
      sessionId: 'sess-stu',
      tenantId: 'tenant-school-1',
      roles: ['STUDENT'],
      type: 'access',
    },
  };

  const parentUser = {
    auth: {
      sub: 'usr-parent-88',
      sessionId: 'sess-par',
      tenantId: 'tenant-school-1',
      roles: ['PARENT'],
      type: 'access',
    },
  };

  const teacherUser = {
    auth: {
      sub: 'usr-teacher-77',
      sessionId: 'sess-tea',
      tenantId: 'tenant-school-1',
      roles: ['TEACHER'],
      type: 'access',
    },
  };

  const accountantUser = {
    auth: {
      sub: 'usr-acct-66',
      sessionId: 'sess-acc',
      tenantId: 'tenant-school-1',
      roles: ['ACCOUNTANT'],
      type: 'access',
    },
  };

  const registrarUser = {
    auth: {
      sub: 'usr-reg-55',
      sessionId: 'sess-reg',
      tenantId: 'tenant-school-1',
      roles: ['REGISTRAR'],
      type: 'access',
    },
  };

  const superAdminUser = {
    auth: {
      sub: 'usr-super-11',
      sessionId: 'sess-sup',
      tenantId: 'tenant-school-1',
      roles: ['SUPER_ADMIN'],
      type: 'access',
    },
  };

  function testAccess(middleware: any, req: any): { allowed: boolean; error: any } {
    let allowed = false;
    let error: any = null;
    middleware(req, {}, (err?: any) => {
      if (err) {
        error = err;
      } else {
        allowed = true;
      }
    });
    return { allowed, error };
  }

  test('Finance Management: forbids Students and Teachers; allows Accountants and Super Admin', () => {
    const financeStaffGate = requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'ACCOUNTANT');

    const stu = testAccess(financeStaffGate, studentUser);
    assert.strictEqual(stu.allowed, false);
    assert.strictEqual(stu.error?.status, 403);

    const tea = testAccess(financeStaffGate, teacherUser);
    assert.strictEqual(tea.allowed, false);
    assert.strictEqual(tea.error?.status, 403);

    const acc = testAccess(financeStaffGate, accountantUser);
    assert.strictEqual(acc.allowed, true);

    const sup = testAccess(financeStaffGate, superAdminUser);
    assert.strictEqual(sup.allowed, true);
  });

  test('Admissions & Intake: forbids Parents and Students; allows Registrars', () => {
    const admissionsGate = requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR');

    const par = testAccess(admissionsGate, parentUser);
    assert.strictEqual(par.allowed, false);
    assert.strictEqual(par.error?.status, 403);

    const stu = testAccess(admissionsGate, studentUser);
    assert.strictEqual(stu.allowed, false);
    assert.strictEqual(stu.error?.status, 403);

    const reg = testAccess(admissionsGate, registrarUser);
    assert.strictEqual(reg.allowed, true);
  });

  test('Financial Data Export: strictly forbids Students, Teachers, and Registrars', () => {
    const exportFinanceGate = requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'ACCOUNTANT');

    assert.strictEqual(testAccess(exportFinanceGate, studentUser).allowed, false);
    assert.strictEqual(testAccess(exportFinanceGate, teacherUser).allowed, false);
    assert.strictEqual(testAccess(exportFinanceGate, registrarUser).allowed, false);
    assert.strictEqual(testAccess(exportFinanceGate, accountantUser).allowed, true);
  });

  test('Student Enrollment Mutations: strictly forbids Students and Parents', () => {
    const studentMutationGate = requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR');

    assert.strictEqual(testAccess(studentMutationGate, studentUser).allowed, false);
    assert.strictEqual(testAccess(studentMutationGate, parentUser).allowed, false);
    assert.strictEqual(testAccess(studentMutationGate, registrarUser).allowed, true);
  });

  test('Pastoral Interventions & Referrals: allows Teachers and Admins; strictly forbids Students', () => {
    const pastoralGate = requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'TEACHER');

    assert.strictEqual(testAccess(pastoralGate, studentUser).allowed, false);
    assert.strictEqual(testAccess(pastoralGate, parentUser).allowed, false);
    assert.strictEqual(testAccess(pastoralGate, teacherUser).allowed, true);
  });
});
