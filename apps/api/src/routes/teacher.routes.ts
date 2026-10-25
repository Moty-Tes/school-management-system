import { Router } from 'express';
import * as teacherController from '../controllers/teacher.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, teacherController.createTeacherHandler);
router.get('/', authenticate, teacherController.listTeachersHandler);

export default router;