import { Router } from 'express';
import * as demoController from '../controllers/demo.controller.js';

const router: Router = Router();

// Public endpoints for client pitching and demonstration discovery
router.get('/info', demoController.getDemoInfoHandler);
router.get('/personas', demoController.getDemoPersonasHandler);

// Endpoint to restore demo environment to pristine state after practice sessions
router.post('/reset', demoController.resetDemoHandler);

export default router;
