import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Marking and recording daily attendance requires authorized staff roles
router.post(
  '/',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'TEACHER', 'REGISTRAR'),
  attendanceController.saveAttendanceHandler
);

// Early-warning attendance summary & flagged student insights (strictly tenant & role scoped)
router.get('/insights', authenticate, attendanceController.getAttendanceInsightsHandler);

// Reviewing attendance records is permitted for authenticated academic members
router.get('/', authenticate, attendanceController.getAttendanceHandler);

export default router;
