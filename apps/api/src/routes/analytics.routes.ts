import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const router = Router();

// Admin Dashboard Route
router.get('/', authenticate, analyticsController.getAnalyticsHandler);

// Student / Parent Personal Dashboard Route
router.get('/me', authenticate, analyticsController.getPersonalDashboardHandler);

export default router;