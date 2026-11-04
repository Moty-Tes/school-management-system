import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { requireRoles } from '../middleware/auth.middleware.js';

describe('Gate Scanner, Exam Scoping & Health Governance Authorization Suite', () => {
  const studentUser = {
    auth: {
      sub: 'usr-student-01',
      tenantId: 'tenant-demo',
      roles: ['STUDENT'],
      type: 'access',
    },
  };

  const parentUser = {
    auth: {
      sub: 'usr-parent-01',
      tenantId: 'tenant-demo',
      roles: ['PARENT'],
      type: 'access',
    },
  };

  const teacherUser = {
    auth: {
      sub: 'usr-teacher-01',
      tenantId: 'tenant-demo',
      roles: ['TEACHER'],
      type: 'access',
    },
  };

  const principalAdminUser = {
    auth: {
      sub: 'usr-principal-01',
      tenantId: 'tenant-demo',
      roles: ['TENANT_ADMIN'],
      type: 'access',
    },
  };

  const registrarUser = {
    auth: {
      sub: 'usr-registrar-01',
      tenantId: 'tenant-demo',
      roles: ['REGISTRAR'],
      type: 'access',
    },
  };

  const healthOfficerUser = {
    auth: {
      sub: 'usr-nurse-01',
      tenantId: 'tenant-demo',
      roles: ['HEALTH_OFFICER'],
      type: 'access',
    },
  };

  function testAccess(middleware: any, req: any): { allowed: boolean; status?: number; code?: string } {
    let allowed = false;
    let status: number | undefined;
    let code: string | undefined;

    middleware(req, {}, (err?: any) => {
      if (err) {
        status = err.status || 500;
        code = err.code;
      } else {
        allowed = true;
      }
    });

    return { allowed, status, code };
  }

  describe('1. Teacher Assignment Governance', () => {
    // Only verified teachers may create assignments.
    // Principals / Admins who are not teachers are prevented from creating homework attributed to arbitrary staff.
    const createAssignmentGate = requireRoles('TEACHER');

    test('strictly requires TEACHER role to create assignments', () => {
      assert.strictEqual(testAccess(createAssignmentGate, teacherUser).allowed, true);
      assert.strictEqual(testAccess(createAssignmentGate, principalAdminUser).allowed, false);
      assert.strictEqual(testAccess(createAssignmentGate, studentUser).allowed, false);
      assert.strictEqual(testAccess(createAssignmentGate, parentUser).allowed, false);
    });

    // Only students may submit assignment homework
    const submitAssignmentGate = requireRoles('STUDENT');

    test('strictly requires STUDENT role to submit homework', () => {
      assert.strictEqual(testAccess(submitAssignmentGate, studentUser).allowed, true);
      assert.strictEqual(testAccess(submitAssignmentGate, teacherUser).allowed, false);
      assert.strictEqual(testAccess(submitAssignmentGate, parentUser).allowed, false);
    });
  });

  describe('2. Exam Room & Seating Matrix Scoping', () => {
    // Generating seating plans is restricted to Administrators and Registrars
    const generateSeatingGate = requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR');

    test('restricts seating allocation generation to school administrators & registrars', () => {
      assert.strictEqual(testAccess(generateSeatingGate, principalAdminUser).allowed, true);
      assert.strictEqual(testAccess(generateSeatingGate, registrarUser).allowed, true);
      assert.strictEqual(testAccess(generateSeatingGate, teacherUser).allowed, false);
      assert.strictEqual(testAccess(generateSeatingGate, studentUser).allowed, false);
      assert.strictEqual(testAccess(generateSeatingGate, parentUser).allowed, false);
    });

    // Viewing entire school seating plan is restricted to administrators and exam hall proctors (teachers)
    // Students must NOT view the school-wide seating roster
    const schoolSeatingViewGate = requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR', 'TEACHER');

    test('prevents students and parents from querying whole-school exam seating roster', () => {
      assert.strictEqual(testAccess(schoolSeatingViewGate, principalAdminUser).allowed, true);
      assert.strictEqual(testAccess(schoolSeatingViewGate, teacherUser).allowed, true);
      assert.strictEqual(testAccess(schoolSeatingViewGate, studentUser).allowed, false);
      assert.strictEqual(testAccess(schoolSeatingViewGate, parentUser).allowed, false);
    });
  });

  describe('3. Gate Scanner Least-Privilege & Access Control', () => {
    const gateOperatorGate = requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR');

    test('allows designated campus security / registrar operators and forbids unauthorized roles', () => {
      assert.strictEqual(testAccess(gateOperatorGate, principalAdminUser).allowed, true);
      assert.strictEqual(testAccess(gateOperatorGate, registrarUser).allowed, true);
      assert.strictEqual(testAccess(gateOperatorGate, teacherUser).allowed, false);
      assert.strictEqual(testAccess(gateOperatorGate, studentUser).allowed, false);
      assert.strictEqual(testAccess(gateOperatorGate, parentUser).allowed, false);
    });

    test('verifies least-privilege projection for gate scan payload', () => {
      const mockScanOutput = {
        scanId: 'gp-123',
        timestamp: new Date().toISOString(),
        scanType: 'ARRIVAL',
        student: {
          id: 'stu-001',
          admissionNumber: 'ET-2026-9-001',
          fullName: 'Abebe Kebede',
          className: 'Grade 9-A',
          status: 'ACTIVE',
          guardianName: 'Kebede Tadesse',
          guardianEmergencyPhone: '+251911000001',
          photoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=ET-2026-9-001',
        },
        eventSummary: 'Entrance Arrival recorded successfully.',
      };

      // Ensure sensitive student records are completely omitted
      const keys = Object.keys(mockScanOutput.student);
      assert.strictEqual(keys.includes('feeBalance'), false);
      assert.strictEqual(keys.includes('tuitionDue'), false);
      assert.strictEqual(keys.includes('grades'), false);
      assert.strictEqual(keys.includes('medicalRecord'), false);
      assert.strictEqual(keys.includes('allergies'), false);
      assert.strictEqual(keys.includes('gpa'), false);
    });
  });

  describe('4. Clinic & Health Emergency Escalation Governance', () => {
    const healthStaffGate = requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'HEALTH_OFFICER', 'NURSE');

    test('restricts clinic record mutations to medical staff and school leadership', () => {
      assert.strictEqual(testAccess(healthStaffGate, healthOfficerUser).allowed, true);
      assert.strictEqual(testAccess(healthStaffGate, principalAdminUser).allowed, true);
      assert.strictEqual(testAccess(healthStaffGate, teacherUser).allowed, false);
      assert.strictEqual(testAccess(healthStaffGate, studentUser).allowed, false);
      assert.strictEqual(testAccess(healthStaffGate, parentUser).allowed, false);
    });

    const emergencyRequestGate = requireRoles(
      'SUPER_ADMIN',
      'TENANT_ADMIN',
      'ADMIN',
      'HEALTH_OFFICER',
      'NURSE',
      'TEACHER'
    );

    test('permits teachers supervising students to request emergency protocol while blocking students/parents', () => {
      assert.strictEqual(testAccess(emergencyRequestGate, teacherUser).allowed, true);
      assert.strictEqual(testAccess(emergencyRequestGate, healthOfficerUser).allowed, true);
      assert.strictEqual(testAccess(emergencyRequestGate, principalAdminUser).allowed, true);
      assert.strictEqual(testAccess(emergencyRequestGate, studentUser).allowed, false);
      assert.strictEqual(testAccess(emergencyRequestGate, parentUser).allowed, false);
    });

    test('ensures emergency protocol response includes prominent simulation safety disclaimer', () => {
      const disclaimer =
        'CRITICAL SAFETY NOTICE: This system does not automatically dispatch external emergency services, fire, or ambulances. School staff must immediately call local emergency services (e.g. Addis Ababa 907 or designated emergency services) and telephone the verified contacts listed below directly.';

      assert.ok(disclaimer.includes('does not automatically dispatch'));
      assert.ok(disclaimer.includes('Addis Ababa 907'));
      assert.ok(disclaimer.includes('telephone the verified contacts listed below directly'));
    });
  });
});
