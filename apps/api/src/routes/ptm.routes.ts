import { Router } from 'express';
import * as ptmController from '../controllers/ptm.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/events', authenticate, ptmController.createEventHandler);
router.get('/events', authenticate, ptmController.listEventsHandler);
router.post('/slots', authenticate, ptmController.createSlotsHandler);
router.get('/slots/me', authenticate, ptmController.teacherSlotsHandler);
router.get('/slots/available', authenticate, ptmController.availableSlotsHandler);
router.post('/book', authenticate, ptmController.bookHandler);

export default router;