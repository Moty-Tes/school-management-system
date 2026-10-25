import { Router } from 'express';
import * as cbtController from '../controllers/cbt.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, cbtController.createExamHandler);
router.post('/:id/start', authenticate, cbtController.startExamHandler);
router.post('/log-cheat', authenticate, cbtController.logCheatHandler);
router.post('/submit', authenticate, cbtController.submitExamHandler);
router.get('/:id/results', authenticate, cbtController.getResultsHandler);

export default router;