import { Router } from 'express';
import * as syncController from '../controllers/sync.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/v1/sync/batch - Process offline mutation queue with conflict resolution
router.post('/batch', authenticate, syncController.processSyncBatchHandler);

export default router;
