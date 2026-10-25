import { Router } from 'express';
import * as broadcastController from '../controllers/broadcast.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, broadcastController.sendHandler);
router.get('/', authenticate, broadcastController.listHandler);

export default router;