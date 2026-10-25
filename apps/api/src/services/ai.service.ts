import { prisma } from '../lib/prisma.js';

/**
 * Calculates a dropout risk score (0-100) based on attendance, grades, and behavior.
 * Score >= 70 is HIGH RISK, >= 40 is MEDIUM, < 40 is LOW.
 */
export async function calculateRiskScore(tenantId: string, studentId: string) {
  // 1. Fetch Attendance
  const attendance = await prisma.attendance.groupBy({
    by: ['status'],
    where: { tenantId, studentId },
    _count: { status: true },
  });
  const absentCount = attendance.find(a => a.status === 'ABSENT')?._count.status || 0;
  const totalAttendance = attendance.reduce((sum, a) => sum + a._count.status, 0);
  const attendanceRate = totalAttendance > 0 ? ((totalAttendance - absentCount) / totalAttendance) * 100 : 100;

  // 2. Fetch Grades
  const grades = await prisma.grade.findMany({
    where: { tenantId, studentId },
    include: { assessment: true },
  });
  let totalScore = 0;
  let totalMax = 0;
  grades.forEach(g => {
    totalScore += g.score;
    totalMax += g.assessment.maxScore;
  });
  const averageGrade = totalMax > 0 ? (totalScore / totalMax) * 100 : 100;

  // 3. Fetch Negative Behavior
  const negativeBehavior = await prisma.behaviorLog.count({
    where: { tenantId, studentId, type: 'NEGATIVE' },
  });

  // 4. Calculate Risk Score
  let riskScore = 0;
  if (attendanceRate < 80) riskScore += 30;
  else if (attendanceRate < 90) riskScore += 15;

  if (averageGrade < 50) riskScore += 40;
  else if (averageGrade < 65) riskScore += 20;

  if (negativeBehavior > 2) riskScore += 30;
  else if (negativeBehavior > 0) riskScore += 10;

  const riskLevel = riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW';

  return {
    riskScore,
    riskLevel,
    metrics: {
      attendanceRate: Math.round(attendanceRate),
      averageGrade: Math.round(averageGrade),
      negativeBehavior,
    }
  };
}

/**
 * Generates a professional report card comment based on the student's data.
 * (In a real-world scenario, this would call an LLM like OpenAI or self-hosted Llama).
 */
export async function generateReportComment(tenantId: string, studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { grades: { include: { assessment: true } }, behaviorLogs: true }
  });

  if (!student) throw new Error('Student not found');

  let totalScore = 0;
  let totalMax = 0;
  student.grades.forEach(g => { totalScore += g.score; totalMax += g.assessment.maxScore; });
  const avg = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

  const positiveLogs = student.behaviorLogs.filter(b => b.type === 'POSITIVE').length;
  const negativeLogs = student.behaviorLogs.filter(b => b.type === 'NEGATIVE').length;

  // Simulated AI logic (Regex/Template based)
  let academicPart = "";
  if (avg >= 85) academicPart = `shows an excellent grasp of the curriculum and consistently performs at a high level`;
  else if (avg >= 70) academicPart = `demonstrates a good understanding of the material and performs well overall`;
  else if (avg >= 50) academicPart = `is making satisfactory progress but could benefit from additional review and practice`;
  else academicPart = `is struggling to grasp core concepts and requires immediate academic intervention and support`;

  let behaviorPart = "";
  if (positiveLogs > negativeLogs) behaviorPart = `Their positive attitude and behavior in class are highly commendable.`;
  else if (negativeLogs > 0) behaviorPart = `However, we have noted some classroom behavior challenges that we are working on together.`;
  else behaviorPart = `They display a neutral and cooperative attitude in class.`;

  return {
    comment: `${student.firstName} ${academicPart}. ${behaviorPart} We encourage continued effort and partnership between home and school to ensure their success.`
  };
}