import { Router } from 'express';
import * as formController from '../controllers/form.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, formController.createHandler);
router.get('/', authenticate, formController.listHandler);
router.get('/:id', authenticate, formController.getHandler);
router.get('/:id/submissions', authenticate, formController.getSubmissionsHandler);
router.patch('/:id/toggle', authenticate, formController.toggleHandler);
router.post('/:id/submit', authenticate, formController.submitHandler);

export default router;