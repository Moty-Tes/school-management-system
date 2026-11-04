import { Router } from 'express';
import * as timetableController from '../controllers/timetable.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Subject catalog: viewable by authenticated users, manageable by administrative staff
router.get('/subjects', authenticate, timetableController.listSubjectsHandler);
router.post(
  '/subjects',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR'),
  timetableController.createSubjectHandler
);

// Timetable schedule: viewable by school community, scheduled by administrative staff
router.get('/', authenticate, timetableController.getTimetableHandler);
router.post(
  '/',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR'),
  timetableController.createTimetableHandler
);
router.post(
  '/auto-generate',
  authenticate,
  requireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'REGISTRAR'),
  timetableController.autoGenerateTimetableHandler
);

export default router;
