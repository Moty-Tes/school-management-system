import { Router } from 'express';
import * as queueController from '../controllers/queue.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/jobs', authenticate, queueController.listJobsHandler);
router.post('/jobs', authenticate, queueController.enqueueJobHandler);
router.get('/jobs/:jobId', authenticate, queueController.getJobStatusHandler);

export default router;
