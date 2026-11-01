import { Router } from 'express';
import * as interventionController from '../controllers/intervention.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Staff referrals
router.post('/referrals', authenticate, interventionController.submitReferralHandler);
router.get('/referrals', authenticate, interventionController.listReferralsHandler);

// Intervention Plans (IIP)
router.post('/plans', authenticate, interventionController.createPlanHandler);
router.post('/plans/meetings', authenticate, interventionController.recordMeetingHandler);

// Historical Student Support Dossier
router.get('/students/:studentId/history', authenticate, interventionController.getStudentHistoryHandler);

export default router;
