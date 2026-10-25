import { Router } from 'express';
import * as authController from '../controllers/auth.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';

const router: Router = Router();

router.post('/register', authController.registerHandler);
router.post('/login', authController.loginHandler);
router.post('/refresh', authController.refreshHandler);
router.post('/logout', authenticate, authController.logoutHandler);
router.get('/me', authenticate, authController.meHandler);

export default router;