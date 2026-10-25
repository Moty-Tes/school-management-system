import { Router } from 'express';
import * as gradingController from '../controllers/grading.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, gradingController.createHandler);
router.get('/', authenticate, gradingController.listHandler);
router.patch('/:id/default', authenticate, gradingController.setDefaultHandler);

export default router;