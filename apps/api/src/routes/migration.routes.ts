import { Router } from 'express';
import * as migrationController from '../controllers/migration.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Data migration is restricted to institutional administrators
router.use(authenticate, requireRoles('SUPER_ADMIN', 'TENANT_ADMIN'));

router.post('/dry-run', migrationController.validateAndDryRunHandler);
router.post('/commit', migrationController.commitImportHandler);

export default router;
