import { Router } from 'express';
import * as teacherController from '../controllers/teacher.controller.js';
import { authenticate, requireRoles } from '../middleware/auth.middleware.js';

const router = Router();

const facultyManagers = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN'];

router.post('/', authenticate, requireRoles(...facultyManagers), teacherController.createTeacherHandler);
router.get('/', authenticate, teacherController.listTeachersHandler);

export default router;
