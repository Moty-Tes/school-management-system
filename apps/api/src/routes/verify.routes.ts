import { Router } from 'express';
import * as verifyController from '../controllers/verify.controller.js';

const router = Router();

// Note: There is NO 'authenticate' middleware here. 
// This route is completely public.
router.get('/student/:studentId', verifyController.verifyStudentHandler);

export default router;