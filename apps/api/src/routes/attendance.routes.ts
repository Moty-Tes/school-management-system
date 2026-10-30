import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, attendanceController.saveAttendanceHandler);
router.get('/', authenticate, attendanceController.getAttendanceHandler);

export default router;