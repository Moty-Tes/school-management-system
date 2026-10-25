import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function createQuiz(tenantId: string, data: { classId: string, title: string, duration: number, questions: any[] }) {
  // Calculate total marks based on questions (e.g., 5 marks per question)
  const totalMarks = data.questions.length * 5;

  return prisma.quiz.create({
    data: {
      tenantId,
      classId: data.classId,
      title: data.title,
      duration: data.duration,
      totalMarks,
      questions: data.questions, // Storing as JSON
    },
  });
}

export async function listQuizzes(tenantId: string, studentClassId?: string) {
  return prisma.quiz.findMany({
    where: { 
      tenantId,
      ...(studentClassId ? { classId: studentClassId } : {}) 
    },
    include: { class: true, _count: { select: { attempts: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getQuizForStudent(tenantId: string, quizId: string, studentId: string) {
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, tenantId },
  });
  if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');

  // CHECK IF ALREADY TAKEN
  const attempt = await prisma.quizAttempt.findUnique({
    where: { quizId_studentId: { quizId, studentId } }
  });
  if (attempt) throw new AppError('You have already taken this quiz', 400, 'ALREADY_TAKEN');

  // SECURITY: Strip the correct answers before sending to the frontend!
  const safeQuestions = (quiz.questions as any[]).map(q => ({
    text: q.text,
    options: q.options
    // correctIndex is intentionally removed
  }));

  return { ...quiz, questions: safeQuestions };
}

export async function submitQuiz(tenantId: string, quizId: string, studentId: string, answers: number[]) {
  const quiz = await prisma.quiz.findFirst({ where: { id: quizId, tenantId } });
  if (!quiz) throw new AppError('Quiz not found', 404, 'NOT_FOUND');

  // Auto-Grade
  let score = 0;
  const questions = quiz.questions as any[];
  
  questions.forEach((q, index) => {
    if (answers[index] === q.correctIndex) {
      score += 5; // 5 marks per correct answer
    }
  });

  return prisma.quizAttempt.create({
    data: { tenantId, quizId, studentId, score },
  });
}

export async function getAttempts(tenantId: string, quizId: string) {
  return prisma.quizAttempt.findMany({
    where: { tenantId, quizId },
    include: { student: true },
    orderBy: { score: 'desc' }
  });
}