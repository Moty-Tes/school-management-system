import { Router } from 'express';
import * as parentController from '../controllers/parent.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Fetches all students linked to the currently logged-in parent
router.get('/my-children', authenticate, parentController.getChildrenHandler);
router.get('/children', authenticate, parentController.getChildrenHandler);
router.get('/', authenticate, parentController.getChildrenHandler);

export default router;
