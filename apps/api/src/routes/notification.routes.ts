import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', authenticate, notificationController.getNotificationsHandler);
router.patch('/:id/read', authenticate, notificationController.markReadHandler);
router.post('/mark-all-read', authenticate, notificationController.markAllReadHandler);
export default router;