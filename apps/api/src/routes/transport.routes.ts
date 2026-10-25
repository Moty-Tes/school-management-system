import { Router } from 'express';
import * as transportController from '../controllers/transport.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, transportController.getTransportDataHandler);
router.post('/routes', authenticate, transportController.createRouteHandler);
router.post('/vehicles', authenticate, transportController.createVehicleHandler);
router.post('/assign', authenticate, transportController.assignStudentHandler);

export default router;