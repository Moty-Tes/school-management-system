import { Router } from 'express';
import * as examController from '../controllers/exam.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/rooms', authenticate, examController.createRoomHandler);
router.get('/rooms', authenticate, examController.listRoomsHandler);
router.post('/schedules', authenticate, examController.createScheduleHandler);
router.get('/schedules', authenticate, examController.listSchedulesHandler);
router.post('/:id/generate-seating', authenticate, examController.generateSeatingHandler);
router.get('/:id/seating', authenticate, examController.getSeatingHandler);

export default router;