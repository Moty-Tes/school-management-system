import { Router } from 'express';
import * as expenseController from '../controllers/expense.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// School expense accounting is restricted to finance staff and administrators
router.use(authenticate, requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ACCOUNTANT'));

router.post('/', expenseController.createHandler);
router.get('/', expenseController.listHandler);
router.get('/summary', expenseController.summaryHandler);

export default router;
