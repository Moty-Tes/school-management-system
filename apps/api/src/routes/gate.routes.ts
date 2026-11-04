import { Router } from 'express';
import * as gateController from '../controllers/gate.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Scanning access: gate security, registrars, and administrators
router.post(
  '/scan',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR'),
  gateController.scanHandler
);

// Gate logs audit: registrars, admins
router.get(
  '/logs',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR'),
  gateController.listScansHandler
);

// Grace period departure verification
router.get(
  '/grace-check',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR'),
  gateController.graceCheckHandler
);

export default router;
