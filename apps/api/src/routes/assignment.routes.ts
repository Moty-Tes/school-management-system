import { Router } from 'express';
import * as assignmentController from '../controllers/assignment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, assignmentController.createHandler);
router.get('/', authenticate, assignmentController.listHandler);
router.post('/:id/submit', authenticate, assignmentController.submitHandler);
router.get('/:id/submissions', authenticate, assignmentController.getSubmissionsHandler);
router.patch('/submissions/:id/grade', authenticate, assignmentController.gradeHandler);

export default router;