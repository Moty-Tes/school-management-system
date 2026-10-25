import { Router } from 'express';
import * as platformController from '../controllers/platform.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Note: In production, you should also add a middleware to check if req.auth.roles includes 'SUPER_ADMIN'
router.get('/stats', authenticate, platformController.getStatsHandler);
router.patch('/tenants/:tenantId/modules', authenticate, platformController.updateTenantModulesHandler);

export default router;