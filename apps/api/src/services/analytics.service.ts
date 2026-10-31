import { prisma } from '../lib/prisma.js';

export async function getDashboardAnalytics(tenantId: string) {
  // 1. Student Gender Distribution (For Pie Chart)
  const genderCounts = await prisma.student.groupBy({
    by: ['gender'],
    where: { tenantId, deletedAt: null },
    _count: { gender: true },
  });

  const genderData = genderCounts.map((g) => ({
    name: g.gender,
    value: g._count.gender,
  }));

  // 2. Fee Collection Trend (Last 6 Months) (For Bar Chart)
  // We fetch all payments and group them by month in JavaScript for simplicity
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const payments = await prisma.payment.findMany({
    where: { tenantId, createdAt: { gte: sixMonthsAgo } },
    select: { amount: true, createdAt: true },
  });

  const monthlyRevenue = new Map<string, number>();
  
  // Initialize last 6 months with 0
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthYear = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthlyRevenue.set(monthYear, 0);
  }

  payments.forEach((p) => {
    const monthYear = p.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
    const current = monthlyRevenue.get(monthYear) || 0;
    monthlyRevenue.set(monthYear, current + Number(p.amount));
  });

  // Convert to array and reverse to go chronologically left-to-right
  const revenueData = Array.from(monthlyRevenue.entries())
    .map(([name, total]) => ({ name, total }))
    .reverse();

  // 3. Overall Attendance Rate (For Progress Bar or Area Chart)
  const attendanceCounts = await prisma.attendance.groupBy({
    by: ['status'],
    where: { tenantId },
    _count: { status: true },
  });

  let present = 0;
  let absent = 0;
  let late = 0;

  attendanceCounts.forEach(ac => {
    if (ac.status === 'PRESENT') present += ac._count.status;
    if (ac.status === 'ABSENT') absent += ac._count.status;
    if (ac.status === 'LATE') late += ac._count.status;
  });

  const totalRecords = present + absent + late;
  const attendanceRate = totalRecords > 0 ? Math.round((present / totalRecords) * 100) : 0;

  return {
    genderData,
    revenueData,
    attendance: { present, absent, late, rate: attendanceRate },
    totalRevenue: (await prisma.payment.findMany({ where: { tenantId }, select: { amount: true } })).reduce((sum, p) => sum + Number(p.amount), 0),
    pendingAmount: (await prisma.invoice.findMany({ where: { tenantId, status: { not: 'PAID' } }, select: { amount: true } })).reduce((sum, i) => sum + Number(i.amount), 0),
    totalInvoiced: (await prisma.invoice.findMany({ where: { tenantId }, select: { amount: true } })).reduce((sum, i) => sum + Number(i.amount), 0),
    invoiceCount: await prisma.invoice.count({ where: { tenantId } }),
    totalStudents: await prisma.student.count({ where: { tenantId, deletedAt: null } }),
    totalTeachers: await prisma.teacherProfile.count({ where: { tenantId } })
  };
}
export async function getPersonalDashboard(tenantId: string, userId: string) {
  // 1. Find the student profile for this user (if it's a student/parent account)
  // Note: In our simplified system, we'll assume students are linked via User -> UserProfile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });

  const student = await prisma.student.findFirst({
    where: { 
      tenantId,
      firstName: user?.profile?.firstName,
      lastName: user?.profile?.lastName
    },
    include: { class: true }
  });

  if (!student) {
    return { isStudent: false, message: "No student profile linked to this account." };
  }

  // 2. Fetch their grades
  const grades = await prisma.grade.findMany({
    where: { studentId: student.id },
    include: { assessment: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // 3. Fetch their attendance
  const attendanceCounts = await prisma.attendance.groupBy({
    by: ['status'],
    where: { studentId: student.id },
    _count: { status: true },
  });

  // 4. Fetch their timetable
  const timetable = await prisma.timetable.findMany({
    where: { classId: student.classId || '' },
    include: { subject: true, teacher: { include: { user: { include: { profile: true } } } } },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });

  return {
    isStudent: true,
    student,
    grades,
    attendance: attendanceCounts,
    timetable
  };
}