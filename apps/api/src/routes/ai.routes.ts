import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/risk/:studentId', authenticate, aiController.getRiskScoreHandler);
router.get('/comment/:studentId', authenticate, aiController.generateCommentHandler);

export default router;