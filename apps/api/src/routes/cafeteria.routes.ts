import { Router } from 'express';
import * as cafeteriaController from '../controllers/cafeteria.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/menu', authenticate, cafeteriaController.createMenuHandler);
router.get('/menu', authenticate, cafeteriaController.listMenuHandler);
router.get('/wallet/:studentId', authenticate, cafeteriaController.getWalletHandler);
router.post('/wallet/topup', authenticate, cafeteriaController.topUpHandler);
router.post('/purchase', authenticate, cafeteriaController.purchaseHandler);

export default router;