import { Router } from 'express';
import * as libraryController from '../controllers/library.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/books', authenticate, libraryController.addBookHandler);
router.get('/books', authenticate, libraryController.listBooksHandler);
router.post('/issue', authenticate, libraryController.issueBookHandler);
router.patch('/return/:id', authenticate, libraryController.returnBookHandler);
router.get('/loans', authenticate, libraryController.listLoansHandler);

export default router;