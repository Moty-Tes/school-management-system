import { Request, Response, NextFunction } from 'express';
import * as libraryService from '../services/library.service.js';
import { z } from 'zod';

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().optional(),
  category: z.string(),
  totalCopies: z.number().int().positive(),
});

const issueSchema = z.object({
  bookId: z.string(),
  studentId: z.string(),
  dueDate: z.string(),
});

export async function addBookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const input = bookSchema.parse(req.body);
    const result = await libraryService.addBook(req.auth.tenantId, input);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listBooksHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await libraryService.listBooks(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function issueBookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const input = issueSchema.parse(req.body);
    const result = await libraryService.issueBook(req.auth.tenantId, input as any);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function returnBookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await libraryService.returnBook(req.auth.tenantId, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function listLoansHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth?.tenantId) throw new Error("No tenant");
    const result = await libraryService.listActiveLoans(req.auth.tenantId);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}