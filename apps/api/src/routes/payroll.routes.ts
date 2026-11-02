import { Router } from 'express';
import * as payrollController from '../controllers/payroll.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Employee self-service: View own payslips
router.get('/me', authenticate, payrollController.myPayslipsHandler);

// Administrative & Financial operations: Generate, list, and disburse payroll
router.post('/generate', authenticate, requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ACCOUNTANT'), payrollController.generateHandler);
router.get('/list', authenticate, requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ACCOUNTANT'), payrollController.listHandler);
router.patch('/:id/pay', authenticate, requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ACCOUNTANT'), payrollController.payHandler);

export default router;
