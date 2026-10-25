import { Router } from 'express';
import * as leaveController from '../controllers/leave.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, leaveController.requestHandler);
router.get('/me', authenticate, leaveController.getMyLeavesHandler);
router.get('/all', authenticate, leaveController.getAllLeavesHandler); // Admin only in reality
router.patch('/:id', authenticate, leaveController.updateStatusHandler);

export default router;