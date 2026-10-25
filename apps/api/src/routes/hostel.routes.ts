import { Router } from 'express';
import * as hostelController from '../controllers/hostel.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, hostelController.getDataHandler);
router.post('/blocks', authenticate, hostelController.createBlockHandler);
router.post('/blocks/:blockId/rooms', authenticate, hostelController.createRoomHandler);
router.post('/allocate', authenticate, hostelController.allocateHandler);
router.post('/check-in', authenticate, hostelController.checkInHandler);

export default router;