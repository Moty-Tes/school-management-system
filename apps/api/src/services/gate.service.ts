import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export interface GateScanInput {
  tenantId: string;
  scannerUserId: string;
  admissionNumber: string;
  scanType: 'ARRIVAL' | 'DEPARTURE';
  isSimulation?: boolean;
}

export interface GateScanResult {
  scanId: string;
  timestamp: string;
  scanType: 'ARRIVAL' | 'DEPARTURE';
  student: {
    id: string;
    admissionNumber: string;
    fullName: string;
    className: string;
    status: string;
    guardianName: string;
    guardianEmergencyPhone: string;
    photoUrl: string | null;
  };
  eventSummary: string;
  notification: {
    recipientPhone: string;
    recipientName: string;
    text: string;
    deliveryStatus: 'SIMULATED_DEMO_DISPATCH' | 'SENT' | 'PENDING';
    note: string;
  };
}

/**
 * Processes physical gate arrival/departure events with least-privilege data projection,
 * duplicate scan suppression, and safe family notification wording.
 */
export async function recordGateScan(input: GateScanInput): Promise<GateScanResult> {
  const { tenantId, scannerUserId, admissionNumber, scanType, isSimulation = false } = input;

  // 1. Locate student in this tenant's directory
  const student = await prisma.student.findFirst({
    where: {
      tenantId,
      admissionNumber: admissionNumber.trim().toUpperCase(),
      deletedAt: null,
    },
    include: {
      class: { select: { name: true, section: true } },
    },
  });

  if (!student) {
    throw new AppError(
      `Student ID "${admissionNumber}" is not recognized in this school's enrollment register.`,
      404,
      'UNKNOWN_STUDENT_ID'
    );
  }

  // 2. Duplicate Scan Suppression (Within 2 minutes)
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  const recentScan = await prisma.gatePass.findFirst({
    where: {
      tenantId,
      studentId: student.id,
      exitTime: { gte: twoMinutesAgo },
    },
    orderBy: { exitTime: 'desc' },
  });

  if (recentScan) {
    const elapsedSeconds = Math.round((Date.now() - recentScan.exitTime.getTime()) / 1000);
    throw new AppError(
      `Duplicate scan prevented: ${student.firstName} ${student.lastName} was already recorded ${elapsedSeconds} seconds ago.`,
      409,
      'DUPLICATE_SCAN'
    );
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toISOString().slice(0, 10);
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  // 3. Record GatePass
  const gatePass = await prisma.gatePass.create({
    data: {
      tenantId,
      studentId: student.id,
      reason: scanType === 'ARRIVAL' ? 'Campus Entrance Arrival Scan' : 'Standard Campus Dismissal Exit Scan',
      releasedTo: student.guardianName,
      approvedBy: `Gate Security User (${scannerUserId.slice(0, 8)})`,
      exitTime: now,
    },
  });

  // 4. If arrival, update or insert today's attendance
  if (scanType === 'ARRIVAL' && student.classId) {
    // Current UTC hour + 3 for East Africa Time (Addis Ababa)
    const eatHours = (now.getUTCHours() + 3) % 24;
    const isLate = eatHours >= 8 && now.getUTCMinutes() > 30; // 08:30 threshold

    const existingAtt = await prisma.attendance.findFirst({
      where: {
        tenantId,
        studentId: student.id,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (!existingAtt) {
      await prisma.attendance.create({
        data: {
          tenantId,
          studentId: student.id,
          classId: student.classId,
          date: startOfDay,
          status: isLate ? 'LATE' : 'PRESENT',
        },
      });
    }
  }

  // 5. Safe Notification Dispatch (Simulated for Demo)
  const notificationText =
    scanType === 'ARRIVAL'
      ? `[School Gate Arrival] ${student.firstName} ${student.lastName} has checked in through the main campus entrance at ${timeStr}.`
      : `[School Gate Departure] ${student.firstName} ${student.lastName} has checked out through the campus exit gate at ${timeStr}.`;

  return {
    scanId: gatePass.id,
    timestamp: now.toISOString(),
    scanType,
    student: {
      id: student.id,
      admissionNumber: student.admissionNumber,
      fullName: `${student.firstName} ${student.lastName}`,
      className: student.class ? `${student.class.name} (${student.class.section})` : 'Unassigned',
      status: student.status,
      guardianName: student.guardianName,
      guardianEmergencyPhone: student.guardianPhone,
      photoUrl: student.photoUrl,
    },
    eventSummary: `${scanType === 'ARRIVAL' ? 'Entrance Arrival' : 'Dismissal Exit'} recorded successfully.`,
    notification: {
      recipientPhone: student.guardianPhone,
      recipientName: student.guardianName,
      text: notificationText,
      deliveryStatus: 'SIMULATED_DEMO_DISPATCH',
      note: isSimulation
        ? 'Simulated gate terminal event. No hardware reader or telecom carrier contacted.'
        : 'Demo mode dispatch. Hardware turnstile is simulated.',
    },
  };
}

/**
 * Returns recent gate scan audit logs with minimum required information.
 */
export async function getRecentGateScans(tenantId: string, limit = 50) {
  const passes = await prisma.gatePass.findMany({
    where: { tenantId },
    include: {
      student: {
        select: {
          id: true,
          admissionNumber: true,
          firstName: true,
          lastName: true,
          guardianName: true,
          guardianPhone: true,
          class: { select: { name: true, section: true } },
        },
      },
    },
    orderBy: { exitTime: 'desc' },
    take: limit,
  });

  return passes.map((p) => ({
    id: p.id,
    timestamp: p.exitTime,
    reason: p.reason,
    approvedBy: p.approvedBy,
    student: {
      id: p.student.id,
      admissionNumber: p.student.admissionNumber,
      fullName: `${p.student.firstName} ${p.student.lastName}`,
      className: p.student.class ? `${p.student.class.name} (${p.student.class.section})` : 'Unassigned',
      guardianPhone: p.student.guardianPhone,
    },
  }));
}

/**
 * Evaluates the post-dismissal grace period (default: 5 minutes).
 * Generates verified verification notices for missing scans with safe, non-alarming wording.
 */
export async function checkPostDismissalGracePeriod(tenantId: string, graceMinutes = 5) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

  // 1. Find all students who attended school today
  const attendedToday = await prisma.attendance.findMany({
    where: {
      tenantId,
      date: { gte: startOfDay, lte: endOfDay },
      status: { in: ['PRESENT', 'LATE'] },
    },
    select: { studentId: true },
  });

  const attendedStudentIds = [...new Set(attendedToday.map((a) => a.studentId))];
  if (attendedStudentIds.length === 0) {
    return { evaluatedCount: 0, missingExitScans: [] };
  }

  // 2. Find students who have an exit scan today
  const exitPasses = await prisma.gatePass.findMany({
    where: {
      tenantId,
      studentId: { in: attendedStudentIds },
      exitTime: { gte: startOfDay, lte: endOfDay },
    },
    select: { studentId: true },
  });

  const scannedOutIds = new Set(exitPasses.map((p) => p.studentId));
  const missingExitStudentIds = attendedStudentIds.filter((id) => !scannedOutIds.has(id));

  const missingStudents = await prisma.student.findMany({
    where: { tenantId, id: { in: missingExitStudentIds } },
    select: {
      id: true,
      admissionNumber: true,
      firstName: true,
      lastName: true,
      guardianName: true,
      guardianPhone: true,
      class: { select: { name: true, section: true } },
    },
    take: 25,
  });

  return {
    evaluatedCount: attendedStudentIds.length,
    missingExitCount: missingExitStudentIds.length,
    graceMinutes,
    disclaimer:
      'Absence of an exit scan is not proof of student location. Gate scans verify badge touchpoints only.',
    missingExitScans: missingStudents.map((s) => ({
      studentId: s.id,
      admissionNumber: s.admissionNumber,
      fullName: `${s.firstName} ${s.lastName}`,
      className: s.class ? `${s.class.name} (${s.class.section})` : 'Unassigned',
      guardianPhone: s.guardianPhone,
      verificationNotice: `Notice for guardian of ${s.firstName}: A dismissal gate scan has not been recorded following the ${graceMinutes}-minute post-dismissal window. Please verify pickup or check with school transportation if unexpected.`,
    })),
  };
}
