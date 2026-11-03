import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Executive School-wide Analytics (Restricted to Administrators & Accountants)
router.get(
  '/',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'ACCOUNTANT'),
  analyticsController.getAnalyticsHandler
);

// Student / Parent Personal Learner Dashboard
router.get('/me', authenticate, analyticsController.getPersonalDashboardHandler);

export default router;
