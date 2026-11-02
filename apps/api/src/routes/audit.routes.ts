import { Router } from 'express';
import * as auditController from '../controllers/audit.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Audit log review is restricted to authorized administrators
router.use(authenticate, requireRoles('SUPER_ADMIN', 'TENANT_ADMIN'));

router.get('/', auditController.getActivityHandler);

export default router;
