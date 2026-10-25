import { Router } from 'express';
import * as reportController from '../controllers/report.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const router = Router();

router.get('/students/:id/report-card', authenticate, reportController.downloadReportHandler);
router.get('/students/:id/id-card', authenticate, reportController.downloadIdCardHandler);
router.get('/students/:id/transcript', authenticate, reportController.downloadTranscriptHandler);

export default router;