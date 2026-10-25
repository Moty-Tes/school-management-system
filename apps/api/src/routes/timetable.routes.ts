import { Router } from 'express';
import * as timetableController from '../controllers/timetable.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/subjects', authenticate, timetableController.listSubjectsHandler);
router.post('/subjects', authenticate, timetableController.createSubjectHandler);

router.get('/', authenticate, timetableController.getTimetableHandler);
router.post('/', authenticate, timetableController.createTimetableHandler);

export default router;