import { Router } from 'express';
import * as messageController from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/contacts', authenticate, messageController.getContactsHandler);
router.get('/:userId', authenticate, messageController.getConversationHandler);
router.post('/', authenticate, messageController.sendMessageHandler);
router.patch('/:senderId/read', authenticate, messageController.markReadHandler);

export default router;