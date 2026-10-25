import { Router } from 'express';
import * as quizController from '../controllers/quiz.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, quizController.createHandler);
router.get('/', authenticate, quizController.listHandler);
router.get('/:id/take', authenticate, quizController.getForStudentHandler);
router.post('/:id/submit', authenticate, quizController.submitHandler);
router.get('/:id/attempts', authenticate, quizController.attemptsHandler);

export default router;