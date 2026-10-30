import { Router } from 'express';
import * as classController from '../controllers/class.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, classController.createClassHandler);
router.get('/', authenticate, classController.listClassesHandler);

export default router;