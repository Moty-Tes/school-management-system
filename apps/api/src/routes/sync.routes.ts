import { Router } from 'express';
import * as syncController from '../controllers/sync.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Ingest offline batch
router.post('/batch', authenticate, syncController.processSyncBatchHandler);

// Supervisor conflict review & resolution
router.get('/conflicts', authenticate, syncController.listConflictsHandler);
router.post('/conflicts/:id/resolve', authenticate, syncController.resolveConflictHandler);

export default router;
