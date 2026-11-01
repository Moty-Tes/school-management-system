import { Router } from 'express';
import * as safeguardingController from '../controllers/safeguarding.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Staff report confidential concern
router.post('/concerns', authenticate, safeguardingController.reportConcernHandler);

// DSL view & list
router.get('/incidents', authenticate, safeguardingController.listIncidentsHandler);
router.get('/incidents/:id', authenticate, safeguardingController.getIncidentHandler);

// Front-Desk Approved Pickup & Reunification
router.post('/pickups', authenticate, safeguardingController.registerPickupHandler);
router.post('/pickups/verify', authenticate, safeguardingController.verifyPickupHandler);

export default router;
