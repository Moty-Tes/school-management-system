import { Router } from 'express';
import * as assessmentController from '../controllers/assessment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, assessmentController.createHandler);
router.get('/', authenticate, assessmentController.listHandler);
router.post('/grades', authenticate, assessmentController.saveGradesHandler);
router.post('/:id/grades', authenticate, assessmentController.saveGradesHandler);
router.get('/:id/grades', authenticate, assessmentController.getGradesHandler);
router.get('/grades', authenticate, assessmentController.getGradesHandler);

// Assessment Governance, Audit Trails, Accommodations & Moderation
router.post('/grades/audit-change', authenticate, assessmentController.modifyGradeWithAuditHandler);
router.get('/grades/audit-trail', authenticate, assessmentController.getGradeAuditTrailHandler);
router.post('/accommodations', authenticate, assessmentController.registerAccommodationHandler);
router.get('/accommodations/duration/:studentId', authenticate, assessmentController.calculateAccommodatedDurationHandler);
router.post('/moderation', authenticate, assessmentController.submitModerationReviewHandler);

export default router;
