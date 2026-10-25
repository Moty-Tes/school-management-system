import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createExam(tenantId: string, data: any) {
  // Calculate total marks based on the questions provided
  const totalMarks = data.questions.reduce((sum: number, q: any) => sum + q.marks, 0);

  return prisma.cBTExam.create({
    data: {
      tenantId,
      classId: data.classId,
      title: data.title,
      duration: data.duration,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      totalMarks,
      questions: {
        create: data.questions.map((q: any) => ({
          tenantId,
          text: q.text,
          options: q.options,
          correctOption: q.correctOption,
          marks: q.marks,
        }))
      }
    }
  });
}

export async function startExam(tenantId: string, studentId: string, examId: string) {
  const exam = await prisma.cBTExam.findFirst({
    where: { id: examId, tenantId },
    include: { questions: true }
  });
  if (!exam) throw new AppError('Exam not found', 404, 'NOT_FOUND');

  // Check if already taken
  const existing = await prisma.cBTAttempt.findUnique({
    where: { examId_studentId: { examId, studentId } }
  });
  if (existing) throw new AppError('You have already taken this exam', 400, 'ALREADY_TAKEN');

  // Create attempt
  const attempt = await prisma.cBTAttempt.create({
    data: { tenantId, examId, studentId }
  });

  // SECURITY: Strip out the correctOption so the browser cannot cheat
  const safeQuestions = exam.questions.map(q => ({
    id: q.id,
    text: q.text,
    options: q.options,
    marks: q.marks
  }));

  return {
    attemptId: attempt.id,
    duration: exam.duration,
    questions: safeQuestions
  };
}

export async function logTabSwitch(tenantId: string, attemptId: string) {
  // Increment the anti-cheat counter
  return prisma.cBTAttempt.update({
    where: { id: attemptId, tenantId },
    data: { tabSwitches: { increment: 1 } }
  });
}

export async function submitExam(tenantId: string, attemptId: string, answers: { questionId: string, selectedOption: number }[]) {
  const attempt = await prisma.cBTAttempt.findUnique({
    where: { id: attemptId, tenantId },
    include: { exam: { include: { questions: true } } }
  });

  if (!attempt || attempt.status !== 'IN_PROGRESS') {
    throw new AppError('Invalid or already submitted attempt', 400, 'INVALID_ATTEMPT');
  }

  let totalScore = 0;
  const answerRecords = [];

  for (const ans of answers) {
    const question = attempt.exam.questions.find(q => q.id === ans.questionId);
    if (!question) continue;

    const isCorrect = question.correctOption === ans.selectedOption;
    if (isCorrect) totalScore += question.marks;

    answerRecords.push({
      tenantId,
      attemptId,
      questionId: ans.questionId,
      selectedOption: ans.selectedOption
    });
  }

  // If they switched tabs more than 3 times, disqualify them
  const finalStatus = attempt.tabSwitches > 3 ? 'DISQUALIFIED' : 'COMPLETED';
  const finalScore = finalStatus === 'DISQUALIFIED' ? 0 : totalScore;

  return prisma.$transaction(async (tx) => {
    // Save all their answers
    await tx.studentAnswer.createMany({ data: answerRecords });

    // Update attempt
    return tx.cBTAttempt.update({
      where: { id: attemptId },
      data: {
        score: finalScore,
        status: finalStatus,
        submittedAt: new Date()
      }
    });
  });
}

export async function getExamResults(tenantId: string, examId: string) {
  return prisma.cBTAttempt.findMany({
    where: { tenantId, examId },
    include: { student: true },
    orderBy: { score: 'desc' }
  });
}