import { Router } from 'express';
import * as examController from '../controllers/exam.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Student-scoped seat lookup: Students & Parents only receive their own seat allocations
router.get('/my-seats', authenticate, examController.getMySeatsHandler);

// Room management: Restricted to School Administrators and Registrars
router.post(
  '/rooms',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR'),
  examController.createRoomHandler
);
router.get('/rooms', authenticate, examController.listRoomsHandler);

// Exam schedule management: Restricted to School Administrators and Registrars
router.post(
  '/schedules',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR'),
  examController.createScheduleHandler
);
router.get('/schedules', authenticate, examController.listSchedulesHandler);

// Seating generation and full hall roster views: Restricted to Administrators and Exam Proctors/Teachers
router.post(
  '/:id/generate-seating',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR'),
  examController.generateSeatingHandler
);
router.get(
  '/:id/seating',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR', 'TEACHER'),
  examController.getSeatingHandler
);

export default router;
