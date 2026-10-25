import { Router } from 'express';
import * as expenseController from '../controllers/expense.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, expenseController.createHandler);
router.get('/', authenticate, expenseController.listHandler);
router.get('/summary', authenticate, expenseController.summaryHandler);

export default router;