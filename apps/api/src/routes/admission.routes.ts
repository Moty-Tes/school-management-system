import { Router } from 'express';
import * as admissionController from '../controllers/admission.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// PUBLIC ROUTE: Parents don't need to be logged in to apply
router.post('/apply', admissionController.applyHandler);

// PRIVATE ROUTES: Staff authorization enforced on server
router.get(
  '/',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR'),
  admissionController.listHandler
);

router.patch(
  '/:id',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR'),
  admissionController.reviewHandler
);

export default router;
