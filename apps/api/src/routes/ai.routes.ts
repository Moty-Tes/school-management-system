import { Router } from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

const administrators = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN'];
const educators = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'TEACHER'];

// Restricted administrative analytics (never exposed directly to students or parents)
router.get('/risk/cohort', authenticate, requireRoles(...administrators), aiController.getCohortRiskHandler);
router.get('/risk/:studentId/predictive', authenticate, requireRoles(...administrators), aiController.getPredictiveRiskAnalysisHandler);
router.get('/risk/:studentId', authenticate, requireRoles(...administrators), aiController.getRiskScoreHandler);

// Teacher assistive report drafting (requires human staff review before publication)
router.get('/comment/:studentId', authenticate, requireRoles(...educators), aiController.generateCommentHandler);

export default router;
