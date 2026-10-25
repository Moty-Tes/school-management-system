import { Router } from 'express';
import * as assessmentController from '../controllers/assessment.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const router = Router();

router.post('/', authenticate, assessmentController.createHandler);
router.get('/', authenticate, assessmentController.listHandler);
router.post('/grades', authenticate, assessmentController.saveGradesHandler);
router.get('/:id/grades', authenticate, assessmentController.getGradesHandler);

export default router;