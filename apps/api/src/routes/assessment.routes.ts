import { Router } from 'express';
import * as assessmentController from '../controllers/assessment.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

const educators = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'TEACHER'];
const academicLeads = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN'];

router.post('/', authenticate, requireRoles(...educators), assessmentController.createHandler);
router.get('/', authenticate, assessmentController.listHandler);
router.post('/grades', authenticate, requireRoles(...educators), assessmentController.saveGradesHandler);
router.post('/:id/grades', authenticate, requireRoles(...educators), assessmentController.saveGradesHandler);
router.get('/:id/grades', authenticate, assessmentController.getGradesHandler);
router.get('/grades', authenticate, assessmentController.getGradesHandler);

// Assessment Governance, Audit Trails, Accommodations & Moderation
router.post('/grades/audit-change', authenticate, requireRoles(...educators), assessmentController.modifyGradeWithAuditHandler);
router.get('/grades/audit-trail', authenticate, requireRoles(...academicLeads), assessmentController.getGradeAuditTrailHandler);
router.post('/accommodations', authenticate, requireRoles(...educators), assessmentController.registerAccommodationHandler);
router.get('/accommodations/duration/:studentId', authenticate, assessmentController.calculateAccommodatedDurationHandler);
router.post('/moderation', authenticate, requireRoles(...educators), assessmentController.submitModerationReviewHandler);

export default router;
