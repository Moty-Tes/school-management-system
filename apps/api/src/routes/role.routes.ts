import { Router } from 'express';
import * as roleController from '../controllers/role.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/permissions', authenticate, roleController.listPermissionsHandler);
router.get('/', authenticate, roleController.listRolesHandler);
router.post('/', authenticate, roleController.createRoleHandler);

export default router;