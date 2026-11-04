import { Router } from 'express';
import * as assignmentController from '../controllers/assignment.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Only verified teachers may create assignments
router.post(
  '/',
  authenticate,
  requireRoles('TEACHER'),
  assignmentController.createHandler
);

// All authenticated users in the school may view assignments list
router.get('/', authenticate, assignmentController.listHandler);

// Only enrolled students may submit assignment homework
router.post(
  '/:id/submit',
  authenticate,
  requireRoles('STUDENT'),
  assignmentController.submitHandler
);

// Teachers and school admins may view student submissions
router.get(
  '/:id/submissions',
  authenticate,
  requireRoles('TEACHER', 'SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN'),
  assignmentController.getSubmissionsHandler
);

// Only teachers may grade submissions and provide feedback
router.patch(
  '/submissions/:id/grade',
  authenticate,
  requireRoles('TEACHER'),
  assignmentController.gradeHandler
);

export default router;
