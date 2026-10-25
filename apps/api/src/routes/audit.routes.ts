import { Router } from 'express';
import * as auditController from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, auditController.getActivityHandler);

export default router;