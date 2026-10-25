import { Router } from 'express';
import * as tenantController from '../controllers/tenant.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/settings', authenticate, tenantController.getSettingsHandler);
router.patch('/settings', authenticate, tenantController.updateSettingsHandler);

export default router;