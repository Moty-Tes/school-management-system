import { Router } from 'express';
import * as websiteController from '../controllers/website.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Admin Routes
router.get('/settings', authenticate, websiteController.getSettingsHandler);
router.patch('/settings', authenticate, websiteController.updateSettingsHandler);

// Public Route (No authentication)
router.get('/public/:tenantCode', websiteController.getPublicHandler);

export default router;