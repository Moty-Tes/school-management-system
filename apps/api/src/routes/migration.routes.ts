import { Router } from 'express';
import * as migrationController from '../controllers/migration.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/dry-run', authenticate, migrationController.validateAndDryRunHandler);
router.post('/commit', authenticate, migrationController.commitImportHandler);

export default router;
