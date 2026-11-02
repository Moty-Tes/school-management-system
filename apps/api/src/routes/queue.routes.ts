import { Router } from 'express';
import * as queueController from '../controllers/queue.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Background queue monitoring is restricted to system administrators
router.use(authenticate, requireRoles('SUPER_ADMIN', 'TENANT_ADMIN'));

router.get('/jobs', queueController.listJobsHandler);
router.post('/jobs', queueController.enqueueJobHandler);
router.get('/jobs/:jobId', queueController.getJobStatusHandler);

export default router;
