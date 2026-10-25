import { Router } from 'express';
import * as dailylogController from '../controllers/dailylog.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, dailylogController.upsertHandler);
router.get('/student/:studentId', authenticate, dailylogController.listHandler);

export default router;