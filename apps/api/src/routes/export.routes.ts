import { Router } from 'express';
import * as exportController from '../controllers/export.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/students', authenticate, exportController.exportStudentsHandler);
router.get('/finance', authenticate, exportController.exportFinanceHandler);
router.get('/attendance', authenticate, exportController.exportAttendanceHandler);

export default router;