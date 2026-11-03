import { Router } from 'express';
import * as gradingController from '../controllers/grading.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

const academicLeads = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN'];

router.post('/', authenticate, requireRoles(...academicLeads), gradingController.createHandler);
router.get('/', authenticate, gradingController.listHandler);
router.patch('/:id/default', authenticate, requireRoles(...academicLeads), gradingController.setDefaultHandler);

export default router;
