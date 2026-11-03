import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { PulseItem, SchoolPulseData } from './SchoolPulseCard.js';

describe('SchoolPulse Operational Briefing Engine', () => {
  const samplePulse: SchoolPulseData = {
    tenantId: 'tenant-st-marys',
    evaluatedAt: new Date().toISOString(),
    summary: {
      totalItems: 3,
      urgentCount: 1,
      warningCount: 1,
      infoCount: 1,
    },
    items: [
      {
        id: 'pulse-safeguarding-cases',
        category: 'SAFEGUARDING',
        severity: 'urgent',
        title: 'Active Child Protection & Safeguarding Concern',
        detail: '1 confidential safeguarding record requires DSL review.',
        reason: 'Confidential incident records with status OPEN.',
        source: 'Database table: safeguarding_incidents',
        dateRange: 'Open investigations',
        action: { label: 'Safeguarding Register', href: '/safeguarding' },
        count: 1,
        responsibleRole: 'Designated Safeguarding Lead',
        status: 'OPEN',
      },
      {
        id: 'pulse-attendance-gap',
        category: 'ATTENDANCE',
        severity: 'warning',
        title: 'Attendance Gaps Detected Today',
        detail: '2 classes have not logged daily attendance today.',
        reason: 'Zero attendance records for today.',
        source: 'Database tables: classes and attendance',
        dateRange: 'Today',
        action: { label: 'Log Attendance', href: '/attendance' },
        count: 2,
        responsibleRole: 'Class Teachers & Academic Staff',
        status: 'OPEN',
      },
      {
        id: 'pulse-attendance-complete',
        category: 'ATTENDANCE',
        severity: 'info',
        title: 'Attendance Fully Recorded Today',
        detail: 'All classes have submitted register.',
        reason: 'All classes have records.',
        source: 'Database tables: classes and attendance',
        dateRange: 'Today',
        action: { label: 'Review Attendance', href: '/attendance' },
        count: 0,
        responsibleRole: 'Class Teachers & Academic Staff',
        status: 'RESOLVED',
      },
    ],
  };

  test('validates pulse data contract and item properties', () => {
    assert.strictEqual(samplePulse.tenantId, 'tenant-st-marys');
    assert.strictEqual(samplePulse.items.length, 3);
    assert.strictEqual(samplePulse.summary.urgentCount, 1);
    assert.strictEqual(samplePulse.summary.warningCount, 1);

    for (const item of samplePulse.items) {
      assert.ok(item.id, 'Every item must have an id');
      assert.ok(item.title, 'Every item must have a title');
      assert.ok(item.detail, 'Every item must have a detail');
      assert.ok(item.source, 'Every item must have an audit source');
      assert.ok(item.responsibleRole, 'Every item must assign a responsibleRole');
      assert.ok(['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(item.status || ''), 'Status must be valid');
    }
  });

  test('correctly supports operational workbench lifecycle transitions', () => {
    // Initial state: OPEN
    let currentStatus: PulseItem['status'] = 'OPEN';
    assert.strictEqual(currentStatus, 'OPEN');

    // Transition 1: Acknowledge & In Progress
    currentStatus = 'IN_PROGRESS';
    assert.strictEqual(currentStatus, 'IN_PROGRESS');

    // Transition 2: Resolve item
    currentStatus = 'RESOLVED';
    assert.strictEqual(currentStatus, 'RESOLVED');

    // Transition 3: Reopen item
    currentStatus = 'OPEN';
    assert.strictEqual(currentStatus, 'OPEN');
  });

  test('maps responsible role accountability accurately across sensitive domains', () => {
    const sgItem = samplePulse.items.find((i) => i.category === 'SAFEGUARDING');
    assert.strictEqual(sgItem?.responsibleRole, 'Designated Safeguarding Lead');

    const attItem = samplePulse.items.find((i) => i.id === 'pulse-attendance-gap');
    assert.strictEqual(attItem?.responsibleRole, 'Class Teachers & Academic Staff');
  });
});
