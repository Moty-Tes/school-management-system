import { prisma } from '../lib/prisma.js';

export interface AttendanceRecordInput {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export async function saveAttendance(
  tenantId: string, 
  classId: string, 
  dateString: string, 
  records: AttendanceRecordInput[]
) {
  // Force the date to midnight UTC so it matches the DB @db.Date
  const date = new Date(dateString);
  date.setUTCHours(0, 0, 0, 0);

  // Use a transaction to delete existing records for this class/day, then insert the new ones
  return prisma.$transaction(async (tx) => {
    // 1. Delete existing attendance for this class and date
    await tx.attendance.deleteMany({
      where: { tenantId, classId, date },
    });

    // 2. Insert new attendance records
    const created = await tx.attendance.createMany({
      data: records.map((r) => ({
        tenantId,
        classId,
        studentId: r.studentId,
        status: r.status,
        date,
      })),
    });

    return created;
  });
}

export async function getAttendanceForDate(tenantId: string, classId: string, dateString: string) {
  const date = new Date(dateString);
  date.setUTCHours(0, 0, 0, 0);

  return prisma.attendance.findMany({
    where: { tenantId, classId, date },
    select: { studentId: true, status: true },
  });
}