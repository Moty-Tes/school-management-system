import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getSchoolPulse } from './dashboard.service.js';

describe('School Operations Pulse Briefing Service', () => {
  const mockDbWithGaps = {
    class: {
      findMany: async () => [
        { id: 'class-1', name: 'Grade 10', section: 'A' },
        { id: 'class-2', name: 'Grade 10', section: 'B' },
      ],
    },
    attendance: {
      findMany: async () => [{ classId: 'class-1' }],
    },
    invoice: {
      findMany: async () => [
        { id: 'inv-1', amount: 350.0 },
        { id: 'inv-2', amount: 150.0 },
      ],
    },
    admissionApplication: {
      count: async () => 3,
    },
    submission: {
      count: async () => 7,
    },
    safeguardingIncident: {
      count: async () => 1,
    },
    supportReferral: {
      count: async () => 2,
    },
  };

  const mockDbNominal = {
    class: {
      findMany: async () => [{ id: 'class-1', name: 'Grade 9', section: 'A' }],
    },
    attendance: {
      findMany: async () => [{ classId: 'class-1' }],
    },
    invoice: {
      findMany: async () => [],
    },
    admissionApplication: {
      count: async () => 0,
    },
    submission: {
      count: async () => 0,
    },
    safeguardingIncident: {
      count: async () => 0,
    },
    supportReferral: {
      count: async () => 0,
    },
  };

  test('detects operational gaps with explainable sources and counts', async () => {
    const pulse = await getSchoolPulse('test-tenant-id', 'admin-user-id', ['ADMIN'], mockDbWithGaps);

    assert.ok(pulse);
    assert.strictEqual(pulse.tenantId, 'test-tenant-id');
    assert.strictEqual(pulse.summary.urgentCount, 1); // 1 safeguarding incident
    assert.strictEqual(pulse.summary.warningCount, 2); // 1 attendance gap, 1 overdue invoices

    // Check Attendance Gap Item
    const attGap = pulse.items.find((i) => i.id === 'pulse-attendance-gap');
    assert.ok(attGap, 'Should contain attendance gap item');
    assert.strictEqual(attGap?.severity, 'warning');
    assert.strictEqual(attGap?.count, 1);
    assert.ok(attGap?.source.includes('classes'));
    assert.ok(attGap?.action.href === '/attendance');

    // Check Overdue Invoices Item
    const finOverdue = pulse.items.find((i) => i.id === 'pulse-overdue-invoices');
    assert.ok(finOverdue, 'Should contain overdue invoices item');
    assert.strictEqual(finOverdue?.count, 2);
    assert.ok(finOverdue?.detail.includes('$500.00'));

    // Check Safeguarding Item
    const sg = pulse.items.find((i) => i.id === 'pulse-safeguarding-cases');
    assert.ok(sg, 'Should contain safeguarding item');
    assert.strictEqual(sg?.severity, 'urgent');
    assert.strictEqual(sg?.count, 1);
  });

  test('reports institutional nominal state when all operational checkpoints pass', async () => {
    const pulse = await getSchoolPulse('test-tenant-id', 'admin-user-id', ['ADMIN'], mockDbNominal);

    assert.ok(pulse);
    assert.strictEqual(pulse.summary.urgentCount, 0);
    assert.strictEqual(pulse.summary.warningCount, 0);

    const completeAtt = pulse.items.find((i) => i.id === 'pulse-attendance-complete');
    assert.ok(completeAtt, 'Should indicate all classes attended');
  });

  test('restricts safeguarding alerts away from non-admin roles', async () => {
    const parentPulse = await getSchoolPulse('test-tenant-id', 'parent-user-id', ['PARENT'], mockDbWithGaps);
    const hasSafeguarding = parentPulse.items.some((i) => i.category === 'SAFEGUARDING');
    assert.strictEqual(hasSafeguarding, false, 'Safeguarding items must never be exposed to non-admin personas');
  });
});
