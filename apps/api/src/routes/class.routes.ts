import { Router } from 'express';
import * as classController from '../controllers/class.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const router = Router();

router.post('/', authenticate, classController.createClassHandler);
router.get('/', authenticate, classController.listClassesHandler);

export default router;