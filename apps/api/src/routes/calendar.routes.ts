import { Router } from 'express';
import * as calendarController from '../controllers/calendar.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/ethiopian/today', authenticate, calendarController.getEthiopianTodayHandler);
router.get('/ethiopian/convert', authenticate, calendarController.convertEthiopianCalendarHandler);

router.post('/', authenticate, calendarController.createHandler);
router.get('/', authenticate, calendarController.listHandler);
router.delete('/:id', authenticate, calendarController.deleteHandler);

export default router;
