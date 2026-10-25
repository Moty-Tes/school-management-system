import { Router } from 'express';
import * as payrollController from '../controllers/payroll.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/generate', authenticate, payrollController.generateHandler);
router.get('/list', authenticate, payrollController.listHandler);
router.get('/me', authenticate, payrollController.myPayslipsHandler);
router.patch('/:id/pay', authenticate, payrollController.payHandler);

export default router;