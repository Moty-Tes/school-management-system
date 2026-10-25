import { Router } from 'express';
import * as fundraisingController from '../controllers/fundraising.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Private Routes (Admin only)
router.post('/campaigns', authenticate, fundraisingController.createHandler);
router.get('/campaigns', authenticate, fundraisingController.listHandler);

// Public Routes (No authentication required)
router.get('/public/:tenantCode/:id', fundraisingController.publicCampaignHandler);
router.post('/public/:tenantCode/:id/donate', fundraisingController.donateHandler);

export default router;