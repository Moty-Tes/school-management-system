import { Router } from 'express';
import * as roleController from '../controllers/role.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Role and permission configuration is restricted to administrators
router.use(authenticate, requireRoles('SUPER_ADMIN', 'TENANT_ADMIN'));

router.get('/permissions', roleController.listPermissionsHandler);
router.get('/', roleController.listRolesHandler);
router.post('/', roleController.createRoleHandler);

export default router;
