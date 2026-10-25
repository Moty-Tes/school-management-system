import { Router } from 'express';
import * as substituteController from '../controllers/substitute.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/uncovered', authenticate, substituteController.getUncoveredHandler);
router.get('/available', authenticate, substituteController.getAvailableHandler);
router.post('/assign', authenticate, substituteController.assignHandler);

export default router;