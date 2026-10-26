import { Router } from 'express';
import * as behaviorController from '../controllers/behavior.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, behaviorController.createHandler);
router.get('/student/:studentId', authenticate, behaviorController.listHandler);

export default router;