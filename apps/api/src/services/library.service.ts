import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export async function addBook(tenantId: string, data: any) {
  return prisma.book.create({
    data: {
      tenantId,
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      category: data.category,
      totalCopies: data.totalCopies,
      availableCopies: data.totalCopies, // Initially, all copies are available
    },
  });
}

export async function listBooks(tenantId: string) {
  return prisma.book.findMany({
    where: { tenantId },
    orderBy: { title: 'asc' },
  });
}

export async function issueBook(tenantId: string, data: { bookId: string, studentId: string, dueDate: string }) {
  return prisma.$transaction(async (tx) => {
    const book = await tx.book.findFirst({ where: { id: data.bookId, tenantId } });
    if (!book) throw new AppError('Book not found', 404, 'NOT_FOUND');
    if (book.availableCopies <= 0) throw new AppError('No copies available', 400, 'NO_COPIES');

    // Deduct available copy
    await tx.book.update({
      where: { id: data.bookId },
      data: { availableCopies: { decrement: 1 } },
    });

    // Create loan record
    return tx.bookLoan.create({
      data: {
        tenantId,
        bookId: data.bookId,
        studentId: data.studentId,
        dueDate: new Date(data.dueDate),
      },
      include: { book: true, student: true },
    });
  });
}

export async function returnBook(tenantId: string, loanId: string) {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.bookLoan.findFirst({
      where: { id: loanId, tenantId, returnedAt: null },
    });
    if (!loan) throw new AppError('Active loan not found', 404, 'NOT_FOUND');

    // Calculate fine (e.g., 10 ETB per day late)
    const now = new Date();
    const dueDate = new Date(loan.dueDate);
    let fine = 0;
    if (now > dueDate) {
      const daysLate = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
      fine = daysLate * 10;
    }

    // Mark as returned
    await tx.bookLoan.update({
      where: { id: loanId },
      data: { returnedAt: now, fineAmount: fine },
    });

    // Restore available copy
    await tx.book.update({
      where: { id: loan.bookId },
      data: { availableCopies: { increment: 1 } },
    });

    return { message: 'Book returned successfully', fine };
  });
}

export async function listActiveLoans(tenantId: string) {
  return prisma.bookLoan.findMany({
    where: { tenantId, returnedAt: null },
    include: { book: true, student: true },
    orderBy: { dueDate: 'asc' },
  });
}