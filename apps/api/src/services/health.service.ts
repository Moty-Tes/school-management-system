import { prisma } from '../lib/prisma.js';
import * as notificationService from './notification.service.js';
import { AppError } from '../middleware/error.middleware.js';

export async function upsertHealthRecord(tenantId: string, studentId: string, data: any) {
  // Verify student exists in this tenant
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, deletedAt: null },
  });
  if (!student) {
    throw new AppError('Student not found in this school tenant', 404, 'NOT_FOUND');
  }

  return prisma.healthRecord.upsert({
    where: { studentId },
    update: { ...data },
    create: { tenantId, studentId, ...data },
  });
}

export async function getHealthRecord(
  tenantId: string,
  studentId: string,
  userId: string,
  roles: string[]
) {
  const isPrivilegedStaff = roles.some((r) =>
    ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'HEALTH_OFFICER', 'NURSE'].includes(r)
  );

  if (!isPrivilegedStaff) {
    const isStudent = roles.includes('STUDENT');
    const isParent = roles.includes('PARENT');

    if (isStudent) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      const student = await prisma.student.findFirst({
        where: {
          id: studentId,
          tenantId,
          firstName: user?.profile?.firstName || '',
          lastName: user?.profile?.lastName || '',
        },
      });
      if (!student) {
        throw new AppError('Access denied: You may only view your own health record', 403, 'FORBIDDEN');
      }
    } else if (isParent) {
      const parentProfile = await prisma.parentProfile.findFirst({
        where: { tenantId, userId },
        include: { students: true },
      });
      const isLinkedChild = parentProfile?.students.some((s) => s.studentId === studentId);
      if (!isLinkedChild) {
        throw new AppError('Access denied: You may only view health records for your registered children', 403, 'FORBIDDEN');
      }
    } else {
      throw new AppError('Access denied: Confidential health records require authorized medical or administrative credentials', 403, 'FORBIDDEN');
    }
  }

  const record = await prisma.healthRecord.findFirst({
    where: { studentId, tenantId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNumber: true,
          dateOfBirth: true,
          gender: true,
        },
      },
    },
  });

  return record;
}

export async function logClinicVisit(
  tenantId: string,
  studentId: string,
  data: { symptoms: string; treatment: string; medication?: string }
) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, deletedAt: null },
  });
  if (!student) {
    throw new AppError('Student not found in this school tenant', 404, 'NOT_FOUND');
  }

  const visit = await prisma.clinicVisit.create({
    data: { tenantId, studentId, ...data },
    include: { student: true },
  });

  // Notify registered parents
  const parentLinks = await prisma.parentStudent.findMany({
    where: { studentId },
    include: { parent: { include: { user: true } } },
  });

  const notifMessage = `${visit.student.firstName} visited the campus clinic for: ${data.symptoms}. Treatment: ${data.treatment}`;

  for (const link of parentLinks) {
    if (link.parent?.userId) {
      await notificationService.createNotification(tenantId, {
        userId: link.parent.userId,
        title: 'School Clinic Visit 🏥',
        message: notifMessage,
        type: 'WARNING',
        link: `/students/${studentId}`,
      });
    }
  }

  return visit;
}

export async function getRecentVisits(tenantId: string) {
  return prisma.clinicVisit.findMany({
    where: { tenantId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNumber: true,
          class: { select: { name: true } },
        },
      },
    },
    orderBy: { visitedAt: 'desc' },
    take: 50,
  });
}

export async function requestEmergencyAssistance(
  tenantId: string,
  requesterId: string,
  studentId: string,
  data: { reason: string; locationNotes?: string; urgency?: 'STANDARD' | 'CRITICAL' }
) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId, deletedAt: null },
    include: {
      healthRecord: true,
      approvedPickupPersons: {
        where: { isAuthorized: true },
        orderBy: { emergencyPriority: 'asc' },
      },
      parents: {
        include: {
          parent: {
            include: {
              user: {
                select: {
                  email: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!student) {
    throw new AppError('Student not found in this school tenant', 404, 'NOT_FOUND');
  }

  const verifiedContacts: Array<{
    name: string;
    phone: string;
    relationship: string;
    priority?: number;
    source: string;
  }> = [];

  // 1. Primary Guardian from enrollment
  if (student.guardianPhone) {
    verifiedContacts.push({
      name: student.guardianName,
      phone: student.guardianPhone,
      relationship: 'PRIMARY_GUARDIAN',
      priority: 1,
      source: 'STUDENT_ENROLLMENT_RECORD',
    });
  }

  // 2. Health record emergency contact
  if (student.healthRecord?.emergencyContactPhone) {
    verifiedContacts.push({
      name: student.healthRecord.emergencyContactName || 'Primary Health Emergency Contact',
      phone: student.healthRecord.emergencyContactPhone,
      relationship: 'HEALTH_RECORD_CONTACT',
      priority: 1,
      source: 'STUDENT_HEALTH_RECORD',
    });
  }

  // 3. Approved pickup persons
  for (const pickup of student.approvedPickupPersons) {
    verifiedContacts.push({
      name: pickup.fullName,
      phone: pickup.phone,
      relationship: pickup.relationship,
      priority: pickup.emergencyPriority,
      source: 'APPROVED_PICKUP_ROSTER',
    });
  }

  // 4. Linked parents from portal
  for (const link of student.parents) {
    const parentProfile = link.parent?.user?.profile;
    if (parentProfile?.phone) {
      verifiedContacts.push({
        name: `${parentProfile.firstName || ''} ${parentProfile.lastName || ''}`.trim() || 'Parent / Guardian',
        phone: parentProfile.phone,
        relationship: link.relationship || 'PARENT_GUARDIAN',
        priority: 1,
        source: 'PARENT_PORTAL',
      });
    }
  }

  // Record an internal urgent clinic visit entry for audit trail
  const urgencyLabel = data.urgency === 'CRITICAL' ? 'CRITICAL' : 'STANDARD';
  const visit = await prisma.clinicVisit.create({
    data: {
      tenantId,
      studentId,
      symptoms: `[EMERGENCY ASSISTANCE REQUEST: ${urgencyLabel}] ${data.reason}`,
      treatment: `Emergency contacts surfaced for direct telephone contact. Location: ${
        data.locationNotes || 'Campus Premises'
      }. Requester: ${requesterId}`,
      medication: 'SIMULATED_INTERNAL_ESCALATION_ONLY',
    },
  });

  return {
    eventId: visit.id,
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    admissionNumber: student.admissionNumber,
    timestamp: new Date().toISOString(),
    urgency: urgencyLabel,
    disclaimer:
      'CRITICAL SAFETY NOTICE: This system does not automatically dispatch external emergency services, fire, or ambulances. School staff must immediately call local emergency services (e.g. Addis Ababa 907 or designated emergency services) and telephone the verified contacts listed below directly.',
    campusEmergencyProtocol: [
      '1. Keep student stabilized and attended by qualified adult staff at all times.',
      '2. In life-threatening emergencies, immediately call municipal emergency services (Addis Ababa: 907) or prepare school emergency transport.',
      '3. Directly phone primary emergency contacts and parents listed in verified contacts below.',
      '4. Escort to School Health Bay or maintain perimeter until certified responders arrive.',
    ],
    verifiedEmergencyContacts: verifiedContacts,
    knownAllergies: student.healthRecord?.allergies || 'No known allergies reported',
    knownConditions: student.healthRecord?.chronicConditions || 'None reported',
    bloodType: student.healthRecord?.bloodType || 'Unknown',
  };
}
