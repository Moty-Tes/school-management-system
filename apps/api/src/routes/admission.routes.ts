import { Router } from 'express';
import * as admissionController from '../controllers/admission.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// PUBLIC ROUTE: Parents don't need to be logged in to apply
router.post('/apply', admissionController.applyHandler);

// PRIVATE ROUTES: Admins must be logged in
router.get('/', authenticate, admissionController.listHandler);
router.patch('/:id', authenticate, admissionController.reviewHandler);

export default router;