import { Router } from 'express';
import * as frontdeskController from '../controllers/frontdesk.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Visitors
router.post('/visitors', authenticate, frontdeskController.logVisitorHandler);
router.get('/visitors', authenticate, frontdeskController.getVisitorsHandler);
router.patch('/visitors/:id/checkout', authenticate, frontdeskController.checkoutVisitorHandler);

// Gate Passes
router.post('/gate-passes', authenticate, frontdeskController.createGatePassHandler);
router.get('/gate-passes', authenticate, frontdeskController.getGatePassesHandler);
router.patch('/gate-passes/:id/return', authenticate, frontdeskController.returnStudentHandler);

export default router;