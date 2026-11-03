import { Router } from 'express';
import * as interventionController from '../controllers/intervention.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

const pastoralTeam = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'TEACHER'];
const interventionLeads = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN'];

// Staff referrals
router.post('/referrals', authenticate, requireRoles(...pastoralTeam), interventionController.submitReferralHandler);
router.get('/referrals', authenticate, requireRoles(...pastoralTeam), interventionController.listReferralsHandler);

// Intervention Plans (IIP)
router.post('/plans', authenticate, requireRoles(...interventionLeads), interventionController.createPlanHandler);
router.post('/plans/meetings', authenticate, requireRoles(...pastoralTeam), interventionController.recordMeetingHandler);

// Historical Student Support Dossier (Restricted Pastoral Record)
router.get('/students/:studentId/history', authenticate, requireRoles(...pastoralTeam), interventionController.getStudentHistoryHandler);

export default router;
