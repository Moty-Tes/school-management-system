import { Router } from 'express';
import * as parentController from '../controllers/parent.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/v1/parents/my-children
// Fetches all students linked to the currently logged-in parent
router.get('/my-children', authenticate, parentController.getChildrenHandler);

export default router;