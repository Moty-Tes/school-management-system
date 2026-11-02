import { Router } from 'express';
import * as safeguardingController from '../controllers/safeguarding.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Staff report confidential concern (accessible by teachers and school staff)
router.post('/concerns', authenticate, safeguardingController.reportConcernHandler);

// Strictly confidential: Only designated leads and school directors can list or inspect incident files
router.get(
  '/incidents',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SAFEGUARDING_LEAD', 'DSL', 'HEADMASTER'),
  safeguardingController.listIncidentsHandler
);

router.get(
  '/incidents/:id',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SAFEGUARDING_LEAD', 'DSL', 'HEADMASTER'),
  safeguardingController.getIncidentHandler
);

// Front-Desk Approved Pickup & Reunification verification
router.post(
  '/pickups',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR', 'TEACHER'),
  safeguardingController.registerPickupHandler
);

router.post(
  '/pickups/verify',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'REGISTRAR', 'TEACHER'),
  safeguardingController.verifyPickupHandler
);

export default router;
