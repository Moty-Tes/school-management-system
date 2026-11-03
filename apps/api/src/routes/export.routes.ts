import { Router } from 'express';
import * as exportController from '../controllers/export.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.get(
  '/students',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR'),
  exportController.exportStudentsHandler
);

router.get(
  '/finance',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'ACCOUNTANT'),
  exportController.exportFinanceHandler
);

router.get(
  '/attendance',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR', 'TEACHER'),
  exportController.exportAttendanceHandler
);

export default router;
