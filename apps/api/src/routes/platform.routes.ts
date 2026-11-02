import { Router } from 'express';
import * as platformController from '../controllers/platform.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Platform management is strictly restricted to SUPER_ADMIN
router.use(authenticate, requireRoles('SUPER_ADMIN'));

router.get('/stats', platformController.getStatsHandler);
router.patch('/tenants/:tenantId/modules', platformController.updateTenantModulesHandler);

export default router;
