import { Router } from 'express';
import * as healthController from '../controllers/health.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/:studentId/record', authenticate, healthController.upsertHandler);
router.get('/:studentId/record', authenticate, healthController.getHandler);
router.post('/:studentId/visit', authenticate, healthController.logVisitHandler);
router.get('/visits/recent', authenticate, healthController.recentVisitsHandler);

export default router;