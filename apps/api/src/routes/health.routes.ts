import { Router } from 'express';
import * as healthController from '../controllers/health.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Emergency assistance escalation request: Accessible by Staff to obtain verified contacts and protocols
// MUST be registered before /:studentId to avoid param collision
router.post(
  '/emergency-request',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'HEALTH_OFFICER', 'NURSE', 'TEACHER'),
  healthController.emergencyRequestHandler
);

// Clinic recent visits summary: Restricted to medical personnel and school administrators
router.get(
  '/visits/recent',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'HEALTH_OFFICER', 'NURSE'),
  healthController.recentVisitsHandler
);

// Student health records: Modification restricted to Health Staff and School Admins
router.post(
  '/:studentId/record',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'HEALTH_OFFICER', 'NURSE'),
  healthController.upsertHandler
);

// Student health records lookup: Authenticated (Service checks administrative/medical roles or parent/student relation)
router.get('/:studentId/record', authenticate, healthController.getHandler);

// Clinic visit logging: Restricted to medical and admin staff
router.post(
  '/:studentId/visit',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'HEALTH_OFFICER', 'NURSE'),
  healthController.logVisitHandler
);

export default router;
